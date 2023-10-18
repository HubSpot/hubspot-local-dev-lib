import axios from 'axios';

import PortManagerServer from '../utils/PortManagerServer';
import { detectPort } from '../utils/detectPort';
import { PORT_MANAGER_SERVER_PORT } from '../constants/ports';

const BASE_URL = `http://localhost:${PORT_MANAGER_SERVER_PORT}`;

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

export async function assignPortToServerInstance(
  serverInstanceId: string
): Promise<number> {
  const { data } = await axios.post(`${BASE_URL}/servers`, {
    instanceId: serverInstanceId,
  });

  return data.port;
}

export async function deleteServerInstance(
  serverInstanceId: string
): Promise<void> {
  await axios.post(`${BASE_URL}/servers/${serverInstanceId}`);
}

export async function portManagerHasActiveServers() {
  const { data } = await axios.get(`${BASE_URL}/servers`);
  return data.count > 0;
}

function toId(str: string) {
  return str.replace(/\s+/g, '-').toLowerCase();
}

export function getServerInstanceId(serverId: string, resourceId: string) {
  return `${toId(serverId)}__${toId(resourceId)}`;
}
