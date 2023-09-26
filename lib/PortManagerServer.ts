import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

import { detectPort } from '../utils/detectPort';
import {
  MIN_PORT_NUMBER,
  MAX_PORT_NUMBER,
  PORT_MANAGER_SERVER_PORT,
} from '../constants/ports';

type PortMap = {
  [instanceId: string]: number;
};

class PortManagerServer {
  app?: Express;
  server?: Server;
  ports: PortMap;

  constructor() {
    this.ports = {
      yaa: 6000,
    };
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

  close(): void {
    if (this.server) {
      this.server.close();
    }
  }

  setupRoutes(): void {
    if (!this.app) {
      return;
    }

    this.app.get('/servers/:instanceId', this.getPortByInstanceId);
    this.app.post('/servers', this.assignPortToServer);
    this.app.delete('/servers/:instanceId', this.deleteServerInstance);
  }

  setPort(instanceId: string, port: number) {
    this.ports[instanceId] = port;
  }

  send404(res: Response, instanceId: string) {
    res
      .status(404)
      .send(`Could not find a server with instanceId ${instanceId}`);
  }

  getPortByInstanceId = (req: Request, res: Response): void => {
    const { instanceId } = req.params;
    const port = this.ports[instanceId];

    if (port) {
      res.send({ port });
    } else {
      this.send404(res, instanceId);
    }
  };

  assignPortToServer = async (req: Request, res: Response): Promise<void> => {
    const { instanceId, port } = req.body;

    if (this.ports[instanceId]) {
      res
        .status(409)
        .send('This server instance has already been assigned a port');
    }

    if (port && (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER)) {
      res.status(400).send('Port must be between 1024 and 65535');
    }

    const portToUse = await detectPort(port);
    this.setPort(instanceId, portToUse);

    res.send({ port: portToUse });
  };

  deleteServerInstance = (req: Request, res: Response): void => {
    const { instanceId } = req.params;
    const port = this.ports[instanceId];

    if (port) {
      delete this.ports[instanceId];
      res.send(200);
    } else {
      this.send404(res, instanceId);
    }
  };
}

export default PortManagerServer;
