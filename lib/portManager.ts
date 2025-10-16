import axios from 'axios';

import {
  HEALTH_CHECK_PATH,
  PortManagerServer,
  SERVICE_HEALTHY,
} from '../utils/PortManagerServer.js';
import { PORT_MANAGER_SERVER_PORT } from '../constants/ports.js';
import { RequestPortsData } from '../types/PortManager.js';
import { detectPort } from '../utils/detectPort.js';
import { logger } from './logger.js';

export const BASE_URL = `http://localhost:${PORT_MANAGER_SERVER_PORT}`;

export async function isPortManagerPortAvailable(): Promise<boolean> {
  return (
    (await detectPort(PORT_MANAGER_SERVER_PORT)) === PORT_MANAGER_SERVER_PORT
  );
}

export async function isPortManagerServerRunning(): Promise<boolean> {
  try {
    const { data } = await axios.get(`${BASE_URL}${HEALTH_CHECK_PATH}`);
    return data.status === SERVICE_HEALTHY;
  } catch (e) {
    logger.debug(e);
    return false;
  }
}

export async function startPortManagerServer(): Promise<void> {
  const isRunning = await isPortManagerServerRunning();

  if (!isRunning) {
    await PortManagerServer.init();
  }
}

export async function stopPortManagerServer(): Promise<void> {
  const isRunning = await isPortManagerServerRunning();

  if (isRunning) {
    await axios.post(`${BASE_URL}/close`);
    // Wait for server to actually close
    let attempts = 0;
    while ((await isPortManagerServerRunning()) && attempts < 10) {
      await new Promise(resolve => setImmediate(resolve));
      attempts++;
    }
  }
}

export async function requestPorts(
  portData: Array<RequestPortsData>
): Promise<{ [instanceId: string]: number }> {
  const { data } = await axios.post(`${BASE_URL}/servers`, {
    portData: portData,
  });

  return data.ports;
}

export async function getServerPortByInstanceId(
  serverInstanceId: string
): Promise<number> {
  const { data } = await axios.get(`${BASE_URL}/servers/${serverInstanceId}`);
  return data.port;
}

export async function deleteServerInstance(
  serverInstanceId: string
): Promise<void> {
  await axios.delete(`${BASE_URL}/servers/${serverInstanceId}`);
}

export async function portManagerHasActiveServers(): Promise<boolean> {
  const { data } = await axios.get(`${BASE_URL}/servers`);
  return data.count > 0;
}
