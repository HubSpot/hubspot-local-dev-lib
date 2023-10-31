import net, { AddressInfo } from 'net';
import { ip } from 'address';

import { MIN_PORT_NUMBER, MAX_PORT_NUMBER } from '../constants/ports';

type NetError = Error & {
  code: string;
};

type ListenCallback = (error: NetError | null, port: number) => void;

export function detectPort(port?: number | null): Promise<number> {
  if (port && (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER)) {
    throw new Error('Port must be between 1024 and 65535');
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
