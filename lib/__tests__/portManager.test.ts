import { MAX_PORT_NUMBER } from '../../constants/ports';
import { PortManagerServer } from '../../utils/PortManagerServer';
import {
  deleteServerInstance,
  getServerPortByInstanceId,
  portManagerHasActiveServers,
  requestPorts,
  startPortManagerServer,
  stopPortManagerServer,
} from '../portManager';

const INSTANCE_ID_1 = 'test1';
const INSTANCE_ID_2 = 'test2';
const INSTANCE_ID_3 = 'test3';
const INSTANCE_ID_4 = 'test4';

const PORT_1 = 2345;
const PORT_2 = 5678;

const EMPTY_PORT_DATA = [
  { instanceId: INSTANCE_ID_1 },
  { instanceId: INSTANCE_ID_2 },
];

const PORT_DATA = [
  { instanceId: INSTANCE_ID_1, port: PORT_1 },
  { instanceId: INSTANCE_ID_2, port: PORT_2 },
];

const DUPLICATE_PORT_DATA = [
  { instanceId: INSTANCE_ID_3, port: PORT_1 },
  { instanceId: INSTANCE_ID_4, port: PORT_2 },
];

const BAD_PORT_DATA = [
  { instanceId: INSTANCE_ID_1, port: PORT_1 },
  { instanceId: INSTANCE_ID_2, port: MAX_PORT_NUMBER + 1 },
];

describe('lib/portManager', () => {
  describe('startPortManagerServer()', () => {
    it('starts the PortManagerServer', async () => {
      expect(PortManagerServer.server).toBeUndefined();
      await startPortManagerServer();
      expect(PortManagerServer.server).toBeDefined();
      await stopPortManagerServer();
    });

    it('does not fail if the PortManagerServer is already running', async () => {
      await startPortManagerServer();
      await startPortManagerServer();
      expect(PortManagerServer.server).toBeDefined();
      await stopPortManagerServer();
    });
  });

  describe('stopPortManagerServer()', () => {
    it('stops the PortManagerServer', async () => {
      await startPortManagerServer();
      expect(PortManagerServer.server).toBeDefined();
      await stopPortManagerServer();
      expect(PortManagerServer.server).toBeUndefined();
    });

    it('does not fail if the PortManagerServer is not running', async () => {
      await stopPortManagerServer();
      expect(PortManagerServer.server).toBeUndefined();
      await stopPortManagerServer();
    });
  });

  describe('requestPorts()', () => {
    beforeEach(async () => {
      await startPortManagerServer();
    });
    afterEach(async () => {
      await stopPortManagerServer();
    });
    it('returns ports when none are specified', async () => {
      const portData = await requestPorts(EMPTY_PORT_DATA);
      expect(typeof portData[INSTANCE_ID_1]).toBe('number');
      expect(typeof portData[INSTANCE_ID_2]).toBe('number');
    });

    it('returns the specified ports if not in use', async () => {
      const portData = await requestPorts(PORT_DATA);
      expect(portData[INSTANCE_ID_1]).toEqual(PORT_1);
      expect(portData[INSTANCE_ID_2]).toEqual(PORT_2);
    });

    it('returns different ports if the specified ports are in use', async () => {
      await requestPorts(PORT_DATA);
      const portData = await requestPorts(DUPLICATE_PORT_DATA);
      expect(portData[INSTANCE_ID_3]).not.toEqual(PORT_1);
      expect(portData[INSTANCE_ID_4]).not.toEqual(PORT_2);
      expect(typeof portData[INSTANCE_ID_3]).toBe('number');
      expect(typeof portData[INSTANCE_ID_4]).toBe('number');
    });

    it('throws an error if requesting a port for a server instance that already has a port', async () => {
      await requestPorts(PORT_DATA);
      await expect(requestPorts(PORT_DATA)).rejects.toThrow();
    });

    it('throws an error when an invalid port is requested', async () => {
      await expect(requestPorts(BAD_PORT_DATA)).rejects.toThrow();
    });
  });

  describe('deleteServerInstance()', () => {
    beforeEach(async () => {
      await startPortManagerServer();
    });
    afterEach(async () => {
      await stopPortManagerServer();
    });

    it('deletes port data for a server instance', async () => {
      await requestPorts(PORT_DATA);
      expect(PortManagerServer.serverPortMap[INSTANCE_ID_1]).toBeDefined();
      await deleteServerInstance(INSTANCE_ID_1);
      expect(PortManagerServer.serverPortMap[INSTANCE_ID_1]).toBeUndefined();
    });

    it('throws an error when attempting to delete a server instance that does not have a port', async () => {
      await expect(deleteServerInstance(INSTANCE_ID_1)).rejects.toThrow();
    });
  });

  describe('portManagerHasActiveServers()', () => {
    beforeEach(async () => {
      await startPortManagerServer();
    });
    afterEach(async () => {
      await stopPortManagerServer();
    });

    it('returns false when no servers are active', async () => {
      const hasActiveServers = await portManagerHasActiveServers();
      expect(hasActiveServers).toBe(false);
    });

    it('returns true when servers are active', async () => {
      await requestPorts(PORT_DATA);
      const hasActiveServers = await portManagerHasActiveServers();
      expect(hasActiveServers).toBe(true);
    });
  });

  describe('getServerPortByInstanceId()', () => {
    beforeEach(async () => {
      await startPortManagerServer();
    });
    afterEach(async () => {
      await stopPortManagerServer();
    });

    it('returns the port for known server instances', async () => {
      await requestPorts(PORT_DATA);
      const port = await getServerPortByInstanceId(INSTANCE_ID_1);
      expect(port).toBe(PORT_1);
    });

    it('returns the correct port for different server instances', async () => {
      await requestPorts(PORT_DATA);
      const port1 = await getServerPortByInstanceId(INSTANCE_ID_1);
      const port2 = await getServerPortByInstanceId(INSTANCE_ID_2);
      expect(port1).toBe(PORT_1);
      expect(port2).toBe(PORT_2);
    });

    it('throws an error for unknown server instances', async () => {
      await expect(
        getServerPortByInstanceId('unknown-instance')
      ).rejects.toThrow();
    });

    it('throws an error when requesting port for deleted server instance', async () => {
      await requestPorts(PORT_DATA);
      await deleteServerInstance(INSTANCE_ID_1);
      await expect(getServerPortByInstanceId(INSTANCE_ID_1)).rejects.toThrow();
    });
  });
});
