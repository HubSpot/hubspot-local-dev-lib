import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

import { detectPort } from '../utils/detectPort';
import {
  MIN_PORT_NUMBER,
  MAX_PORT_NUMBER,
  PORT_MANAGER_SERVER_PORT,
} from '../constants/ports';

type ServerPortMap = {
  [instanceId: string]: number;
};

class PortManagerServer {
  app?: Express;
  server?: Server;
  serverPortMap: ServerPortMap;

  constructor() {
    this.serverPortMap = {};
  }

  init(): void {
    if (this.app) {
      throw new Error('Port manager server is already running');
    }
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
    this.server = this.app.listen(PORT_MANAGER_SERVER_PORT, () =>
      console.log('Running port manager')
    );
  }

  setupRoutes(): void {
    if (!this.app) {
      return;
    }

    this.app.get('/servers', this.getServers);
    this.app.get('/servers/:instanceId', this.getServerPortByInstanceId);
    this.app.post('/servers', this.assignPortToServer);
    this.app.delete('/servers/:instanceId', this.deleteServerInstance);
    this.app.post('/close', this.closeServer);
  }

  setPort(instanceId: string, port: number) {
    this.serverPortMap[instanceId] = port;
  }

  send404(res: Response, instanceId: string) {
    res
      .status(404)
      .send(`Could not find a server with instanceId ${instanceId}`);
  }

  getServers = async (req: Request, res: Response): Promise<void> => {
    res.send({
      servers: this.serverPortMap,
      count: Object.keys(this.serverPortMap).length,
    });
  };

  getServerPortByInstanceId = (req: Request, res: Response): void => {
    const { instanceId } = req.params;
    const port = this.serverPortMap[instanceId];

    if (port) {
      res.send({ port });
    } else {
      this.send404(res, instanceId);
    }
  };

  assignPortToServer = async (req: Request, res: Response): Promise<void> => {
    const { instanceId, port } = req.body;

    if (this.serverPortMap[instanceId]) {
      res
        .status(409)
        .send('This server instance has already been assigned a port');
    } else if (port && (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER)) {
      res.status(400).send('Port must be between 1024 and 65535');
    } else {
      const portToUse = await detectPort(port);
      this.setPort(instanceId, portToUse);

      res.send({ port: portToUse });
    }
  };

  deleteServerInstance = (req: Request, res: Response): void => {
    const { instanceId } = req.params;
    const port = this.serverPortMap[instanceId];

    if (port) {
      delete this.serverPortMap[instanceId];
      res.send(200);
    } else {
      this.send404(res, instanceId);
    }
  };

  closeServer = (req: Request, res: Response): void => {
    if (this.server) {
      res.send(200);
      this.server.close();
    }
  };
}

export default new PortManagerServer();
