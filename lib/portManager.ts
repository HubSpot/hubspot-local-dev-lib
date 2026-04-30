import axios from 'axios';

import {
  HEALTH_CHECK_PATH,
  PortManagerServer,
  SERVICE_HEALTHY,
} from '../utils/PortManagerServer.js';
import { isPortAvailable } from '../utils/isPortAvailable.js';
import { RequestPortsData, ServerPortMap } from '../types/PortManager.js';
import { logger } from './logger.js';

export { isPortAvailable };

export async function isPortManagerPortAvailable(): Promise<boolean> {
  return PortManagerServer.portAvailable();
}

export async function isPortManagerServerRunning(): Promise<boolean> {
  try {
    const { data } = await axios.get(
      `${PortManagerServer.baseUrl}${HEALTH_CHECK_PATH}`
    );
    return data.status === SERVICE_HEALTHY;
  } catch (e) {
    logger.debug(e);
    return false;
  }
}

export async function startPortManagerServer(port?: number): Promise<void> {
  const isRunning = await isPortManagerServerRunning();

  if (!isRunning) {
    await PortManagerServer.init(port);
  }
}

export async function stopPortManagerServer(): Promise<void> {
  const isRunning = await isPortManagerServerRunning();

  if (isRunning) {
    await axios.post(`${PortManagerServer.baseUrl}/close`);
  }
}

export async function requestPorts(
  portData: Array<RequestPortsData>
): Promise<{ [instanceId: string]: number }> {
  const { data } = await axios.post(`${PortManagerServer.baseUrl}/servers`, {
    portData: portData,
  });

  return data.ports;
}

export async function getActiveServers(): Promise<ServerPortMap> {
  const { data } = await axios.get(`${PortManagerServer.baseUrl}/servers`);
  return data.servers;
}

export async function getServerPortByInstanceId(
  serverInstanceId: string
): Promise<number> {
  const { data } = await axios.get(
    `${PortManagerServer.baseUrl}/servers/${serverInstanceId}`
  );
  return data.port;
}

export async function deleteServerInstance(
  serverInstanceId: string
): Promise<void> {
  await axios.delete(
    `${PortManagerServer.baseUrl}/servers/${serverInstanceId}`
  );
}

export async function portManagerHasActiveServers(): Promise<boolean> {
  const { data } = await axios.get(`${PortManagerServer.baseUrl}/servers`);
  return data.count > 0;
}
