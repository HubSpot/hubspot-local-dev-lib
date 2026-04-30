import { detectPort } from './detectPort.js';

export async function isPortAvailable(port: number): Promise<boolean> {
  return (await detectPort(port)) === port;
}
