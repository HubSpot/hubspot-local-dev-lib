import { MAX_PORT_NUMBER } from '../../constants/ports';
import { PortManagerServer } from '../../utils/PortManagerServer';
import {
  deleteServerInstance,
  getActiveServers,
  getServerPortByInstanceId,
  isPortManagerPortAvailable,
  portManagerHasActiveServers,
  requestPorts,
  startPortManagerServer,
  stopPortManagerServer,
} from '../portManager';

import _axios from 'axios';

// Mock the PortManagerServer
jest.mock('../../utils/PortManagerServer', () => ({
  PortManagerServer: {
    server: undefined,
    serverPortMap: {},
    init: jest.fn(),
    portAvailable: jest.fn(),
  },
  HEALTH_CHECK_PATH: '/port-manager-health-check',
  SERVICE_HEALTHY: 'OK',
}));

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

const mockedPortManagerServer = PortManagerServer as jest.Mocked<
  typeof PortManagerServer
>;
const axios = _axios as jest.Mocked<typeof _axios>;

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPortManagerServer.server = undefined;
    mockedPortManagerServer.serverPortMap = {};
  });

  describe('isPortManagerPortAvailable()', () => {
    it('returns true when port is available', async () => {
      mockedPortManagerServer.portAvailable.mockResolvedValue(true);

      const result = await isPortManagerPortAvailable();

      expect(result).toBe(true);
      expect(mockedPortManagerServer.portAvailable).toHaveBeenCalled();
    });

    it('returns false when port is not available', async () => {
      mockedPortManagerServer.portAvailable.mockResolvedValue(false);

      const result = await isPortManagerPortAvailable();

      expect(result).toBe(false);
      expect(mockedPortManagerServer.portAvailable).toHaveBeenCalled();
    });
  });
  describe('startPortManagerServer()', () => {
    it('starts the PortManagerServer when not running', async () => {
      // Mock the health check to fail (server not running)
      axios.get.mockRejectedValue(new Error('Connection refused'));
      mockedPortManagerServer.init.mockResolvedValue(undefined);

      await startPortManagerServer();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/port-manager-health-check'
      );
      expect(mockedPortManagerServer.init).toHaveBeenCalled();
    });

    it('does not start if the PortManagerServer is already running', async () => {
      // Mock the health check to succeed (server is running)
      axios.get.mockResolvedValue({ data: { status: 'OK' } });

      await startPortManagerServer();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/port-manager-health-check'
      );
      expect(mockedPortManagerServer.init).not.toHaveBeenCalled();
    });
  });

  describe('stopPortManagerServer()', () => {
    it('stops the PortManagerServer when running', async () => {
      // Mock the health check to succeed (server is running)
      axios.get.mockResolvedValue({ data: { status: 'OK' } });
      axios.post.mockResolvedValue({ status: 200 });

      await stopPortManagerServer();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/port-manager-health-check'
      );
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/close')
      );
    });

    it('does not fail if the PortManagerServer is not running', async () => {
      // Mock the health check to fail (server not running)
      axios.get.mockRejectedValue(new Error('Connection refused'));

      await stopPortManagerServer();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/port-manager-health-check'
      );
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('requestPorts()', () => {
    beforeEach(() => {
      // @ts-expect-error partial mock
      mockedPortManagerServer.server = {}; // Mock running server
    });

    it('returns ports when none are specified', async () => {
      const mockResponse = {
        data: {
          ports: {
            [INSTANCE_ID_1]: 3000,
            [INSTANCE_ID_2]: 3001,
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const portData = await requestPorts(EMPTY_PORT_DATA);

      expect(typeof portData[INSTANCE_ID_1]).toBe('number');
      expect(typeof portData[INSTANCE_ID_2]).toBe('number');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/servers'),
        { portData: EMPTY_PORT_DATA }
      );
    });

    it('returns the specified ports if not in use', async () => {
      const mockResponse = {
        data: {
          ports: {
            [INSTANCE_ID_1]: PORT_1,
            [INSTANCE_ID_2]: PORT_2,
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const portData = await requestPorts(PORT_DATA);

      expect(portData[INSTANCE_ID_1]).toEqual(PORT_1);
      expect(portData[INSTANCE_ID_2]).toEqual(PORT_2);
    });

    it('returns different ports if the specified ports are in use', async () => {
      const mockResponse = {
        data: {
          ports: {
            [INSTANCE_ID_3]: PORT_1 + 100,
            [INSTANCE_ID_4]: PORT_2 + 100,
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const portData = await requestPorts(DUPLICATE_PORT_DATA);

      expect(portData[INSTANCE_ID_3]).not.toEqual(PORT_1);
      expect(portData[INSTANCE_ID_4]).not.toEqual(PORT_2);
      expect(typeof portData[INSTANCE_ID_3]).toBe('number');
      expect(typeof portData[INSTANCE_ID_4]).toBe('number');
    });

    it('throws an error if requesting a port for a server instance that already has a port', async () => {
      const error = new Error('Server instance already has a port');
      axios.post.mockRejectedValue(error);

      await expect(requestPorts(PORT_DATA)).rejects.toThrow();
    });

    it('throws an error when an invalid port is requested', async () => {
      const error = new Error('Invalid port requested');
      axios.post.mockRejectedValue(error);

      await expect(requestPorts(BAD_PORT_DATA)).rejects.toThrow();
    });
  });

  describe('deleteServerInstance()', () => {
    beforeEach(() => {
      // @ts-expect-error partial mock
      mockedPortManagerServer.server = {}; // Mock running server
    });

    it('deletes port data for a server instance', async () => {
      axios.delete.mockResolvedValue({ status: 200 });

      await deleteServerInstance(INSTANCE_ID_1);

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/servers/${INSTANCE_ID_1}`)
      );
    });

    it('throws an error when attempting to delete a server instance that does not have a port', async () => {
      const error = new Error('Server instance not found');
      axios.delete.mockRejectedValue(error);

      await expect(deleteServerInstance(INSTANCE_ID_1)).rejects.toThrow();
    });
  });

  describe('portManagerHasActiveServers()', () => {
    beforeEach(() => {
      // @ts-expect-error partial mock
      mockedPortManagerServer.server = {}; // Mock running server
    });

    it('returns false when no servers are active', async () => {
      const mockResponse = {
        data: {
          servers: {},
          count: 0,
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const hasActiveServers = await portManagerHasActiveServers();

      expect(hasActiveServers).toBe(false);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/servers')
      );
    });

    it('returns true when servers are active', async () => {
      const mockResponse = {
        data: {
          servers: {
            [INSTANCE_ID_1]: PORT_1,
            [INSTANCE_ID_2]: PORT_2,
          },
          count: 2,
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const hasActiveServers = await portManagerHasActiveServers();

      expect(hasActiveServers).toBe(true);
    });
  });

  describe('getActiveServers()', () => {
    beforeEach(() => {
      // @ts-expect-error partial mock
      mockedPortManagerServer.server = {}; // Mock running server
    });

    it('returns the servers', async () => {
      const mockResponse = {
        data: {
          servers: {
            [INSTANCE_ID_1]: PORT_1,
            [INSTANCE_ID_2]: PORT_2,
          },
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const servers = await getActiveServers();

      expect(servers).toEqual({
        [INSTANCE_ID_1]: PORT_1,
        [INSTANCE_ID_2]: PORT_2,
      });
    });
  });

  describe('getServerPortByInstanceId()', () => {
    beforeEach(() => {
      // @ts-expect-error partial mock
      mockedPortManagerServer.server = {}; // Mock running server
    });

    it('returns the port for known server instances', async () => {
      const mockResponse = {
        data: {
          port: PORT_1,
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const port = await getServerPortByInstanceId(INSTANCE_ID_1);

      expect(port).toBe(PORT_1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/servers/${INSTANCE_ID_1}`)
      );
    });

    it('returns the correct port for different server instances', async () => {
      axios.get
        .mockResolvedValueOnce({ data: { port: PORT_1 } })
        .mockResolvedValueOnce({ data: { port: PORT_2 } });

      const port1 = await getServerPortByInstanceId(INSTANCE_ID_1);
      const port2 = await getServerPortByInstanceId(INSTANCE_ID_2);

      expect(port1).toBe(PORT_1);
      expect(port2).toBe(PORT_2);
    });

    it('throws an error for unknown server instances', async () => {
      const error = new Error('Server instance not found');
      axios.get.mockRejectedValue(error);

      await expect(
        getServerPortByInstanceId('unknown-instance')
      ).rejects.toThrow();
    });

    it('throws an error when requesting port for deleted server instance', async () => {
      const error = new Error('Server instance not found');
      axios.get.mockRejectedValue(error);

      await expect(getServerPortByInstanceId(INSTANCE_ID_1)).rejects.toThrow();
    });
  });
});
