import express, { Express } from 'express';

type PortMap = {
  [key: string]: number;
};

class PortManagerServer {
  app?: Express;
  ports: PortMap;

  constructor() {
    this.ports = {};
  }

  init(): void {
    if (this.app) {
      throw new Error('Port manager server is already running');
    }
    this.app = express();
  }
}

export default PortManagerServer;
