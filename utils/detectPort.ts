/*
From https://github.com/node-modules/detect-port/tree/master

The MIT License (MIT)

Copyright (c) 2014 - present node-modules and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import net, { AddressInfo } from 'net';
import { ip } from 'address';
import { throwErrorWithMessage } from '../errors/standardErrors';

import { MIN_PORT_NUMBER, MAX_PORT_NUMBER } from '../constants/ports';

type NetError = Error & {
  code: string;
};

type ListenCallback = (error: NetError | null, port: number) => void;

const i18nKey = 'utils.detectPort';

export function detectPort(port?: number | null): Promise<number> {
  if (port && (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER)) {
    throwErrorWithMessage(`${i18nKey}.errors.invalidPort`);
  }

  const portToUse = port || 0;
  const maxPort = Math.min(portToUse + 10, MAX_PORT_NUMBER);

  return new Promise(resolve => {
    tryListen(portToUse, maxPort, (_, resolvedPort) => {
      resolve(resolvedPort);
    });
  });
}

function tryListen(port: number, maxPort: number, callback: ListenCallback) {
  const shouldGiveUp = port >= maxPort;
  const nextPort = shouldGiveUp ? 0 : port + 1;
  const nextMaxPort = shouldGiveUp ? 0 : maxPort;

  listen(port, undefined, (err, realPort) => {
    // ignore random listening
    if (port === 0) {
      return callback(err, realPort);
    }

    if (err) {
      return tryListen(nextPort, nextMaxPort, callback);
    }

    // 2. check 0.0.0.0
    listen(port, '0.0.0.0', err => {
      if (err) {
        return tryListen(nextPort, nextMaxPort, callback);
      }

      // 3. check localhost
      listen(port, 'localhost', err => {
        if (err && err.code !== 'EADDRNOTAVAIL') {
          return tryListen(nextPort, nextMaxPort, callback);
        }

        // 4. check current ip
        listen(port, ip(), (err, realPort) => {
          if (err) {
            return tryListen(nextPort, nextMaxPort, callback);
          }

          callback(null, realPort);
        });
      });
    });
  });
}

function listen(
  port: number,
  hostname: string | undefined,
  callback: ListenCallback
): void {
  const server = new net.Server();

  server.on('error', (err: NetError) => {
    server.close();
    if (err.code === 'ENOTFOUND') {
      return callback(null, port);
    }
    return callback(err, 0);
  });

  server.listen(port, hostname, () => {
    const addressInfo = server.address() as AddressInfo;
    server.close();
    return callback(null, addressInfo.port);
  });
}
