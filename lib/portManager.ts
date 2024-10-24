import axios from 'axios';

import { PortManagerServer } from '../utils/PortManagerServer';
import { detectPort } from '../utils/detectPort';
import { PORT_MANAGER_SERVER_PORT } from '../constants/ports';
import { RequestPortsData } from '../types/PortManager';

export const BASE_URL = `http://localhost:${PORT_MANAGER_SERVER_PORT}`;

async function isPortManagerServerRunning(): Promise<boolean> {
  const port = await detectPort(PORT_MANAGER_SERVER_PORT);
  return port !== PORT_MANAGER_SERVER_PORT;
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

export async function deleteServerInstance(
  serverInstanceId: string
): Promise<void> {
  await axios.delete(`${BASE_URL}/servers/${serverInstanceId}`);
}

export async function portManagerHasActiveServers(): Promise<boolean> {
  const { data } = await axios.get(`${BASE_URL}/servers`);
  return data.count > 0;
}
