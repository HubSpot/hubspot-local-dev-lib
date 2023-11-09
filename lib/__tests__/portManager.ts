import PortManagerServer from '../../utils/PortManagerServer';
import {
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
  });

  // describe('deleteServerInstance', () => {});

  // describe('portManagerHasActiveServers()', () => {});

  // describe('getServerInstanceId()', () => {});
});
