import axios from 'axios';

import {
  HEALTH_CHECK_PATH,
  PortManagerServer,
  SERVICE_HEALTHY,
} from '../utils/PortManagerServer.js';
import { PORT_MANAGER_SERVER_PORT } from '../constants/ports.js';
import { RequestPortsData, ServerPortMap } from '../types/PortManager.js';
import { logger } from './logger.js';

let portManagerPort = PORT_MANAGER_SERVER_PORT;

function getBaseUrl(): string {
  return `http://localhost:${portManagerPort}`;
}

export async function isPortManagerPortAvailable(): Promise<boolean> {
  return PortManagerServer.portAvailable();
}

export async function isPortManagerServerRunning(): Promise<boolean> {
  try {
    const { data } = await axios.get(`${getBaseUrl()}${HEALTH_CHECK_PATH}`);
    return data.status === SERVICE_HEALTHY;
  } catch (e) {
    logger.debug(e);
    return false;
  }
}

export async function startPortManagerServer(port?: number): Promise<void> {
  if (port) {
    portManagerPort = port;
  }

  const isRunning = await isPortManagerServerRunning();

  if (!isRunning) {
    await PortManagerServer.init(port);
  }
}

export async function stopPortManagerServer(): Promise<void> {
  const isRunning = await isPortManagerServerRunning();

  if (isRunning) {
    await axios.post(`${getBaseUrl()}/close`);
  }
}

export async function requestPorts(
  portData: Array<RequestPortsData>
): Promise<{ [instanceId: string]: number }> {
  const { data } = await axios.post(`${getBaseUrl()}/servers`, {
    portData: portData,
  });

  return data.ports;
}

export async function getActiveServers(): Promise<ServerPortMap> {
  const { data } = await axios.get(`${getBaseUrl()}/servers`);
  return data.servers;
}

export async function getServerPortByInstanceId(
  serverInstanceId: string
): Promise<number> {
  const { data } = await axios.get(
    `${getBaseUrl()}/servers/${serverInstanceId}`
  );
  return data.port;
}

export async function deleteServerInstance(
  serverInstanceId: string
): Promise<void> {
  await axios.delete(`${getBaseUrl()}/servers/${serverInstanceId}`);
}

export async function portManagerHasActiveServers(): Promise<boolean> {
  const { data } = await axios.get(`${getBaseUrl()}/servers`);
  return data.count > 0;
}
