import express, { Express, Request, Response } from 'express';

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
    this.app.listen(PORT_MANAGER_SERVER_PORT, () =>
      console.log('Running port manager')
    );
  }

  setupRoutes(): void {
    if (!this.app) {
      return;
    }

    this.app.get('/servers/:instanceId', this.getPortByInstanceId);
    this.app.post('/servers', this.assignPortToServer);
  }

  setPort(instanceId: string, port: number) {
    this.ports[instanceId] = port;
  }

  getPortByInstanceId = (req: Request, res: Response): void => {
    const { instanceId } = req.params;
    const port = this.ports[instanceId];

    if (port) {
      res.send({ port });
    } else {
      res
        .status(404)
        .send(`Could not find a server with instanceId ${instanceId}`);
    }
  };

  assignPortToServer = async (req: Request, res: Response): Promise<void> => {
    const { instanceId, port } = req.body;

    if (port && (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER)) {
      res.status(400).send('Port must be between 1024 and 65535');
    }

    const portToUse = await detectPort(port);
    this.setPort(instanceId, portToUse);

    res.send({ port: portToUse });
  };
}

export default PortManagerServer;
