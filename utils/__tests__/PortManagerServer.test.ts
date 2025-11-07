import { Request, Response } from 'express';
import { PortManagerServer } from '../PortManagerServer';
import { detectPort } from '../detectPort';
import { logger } from '../../lib/logger';
import { i18n } from '../lang';
import { PORT_MANAGER_SERVER_PORT } from '../../constants/ports';

// Mock express
const mockExpressApp = {
  use: jest.fn(),
  listen: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

jest.mock('express', () => {
  const mockExpress = jest.fn(() => mockExpressApp);
  // @ts-expect-error adding json method to mock
  mockExpress.json = jest.fn();
  return mockExpress;
});

// Mock cors
jest.mock('cors', () => jest.fn());

// Mock detectPort
jest.mock('../detectPort', () => ({
  detectPort: jest.fn(),
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

// Mock i18n
jest.mock('../lang', () => ({
  i18n: jest.fn(
    (key: string, params?: Record<string, unknown>) =>
      `Mocked i18n: ${key} ${JSON.stringify(params || {})}`
  ),
}));

const mockedDetectPort = detectPort as jest.MockedFunction<typeof detectPort>;
const mockedLogger = logger as jest.Mocked<typeof logger>;
const mockedI18n = i18n as jest.MockedFunction<typeof i18n>;

describe('PortManagerServer', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset PortManagerServer state
    PortManagerServer.app = undefined;
    PortManagerServer.server = undefined;
    PortManagerServer.serverPortMap = {};

    // Setup mock request and response
    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    };
  });

  describe('init()', () => {
    it('should throw an error if port is not available', async () => {
      mockedDetectPort.mockResolvedValue(PORT_MANAGER_SERVER_PORT + 1);

      await expect(PortManagerServer.init()).rejects.toThrow();

      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.errors.portInUse',
        {
          port: PORT_MANAGER_SERVER_PORT,
        }
      );
    });

    it('should throw an error if app is already initialized', async () => {
      mockedDetectPort.mockResolvedValue(PORT_MANAGER_SERVER_PORT);
      // @ts-expect-error partial mock to simulate app already initialized
      PortManagerServer.app = {};

      await expect(PortManagerServer.init()).rejects.toThrow();

      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.errors.duplicateInstance'
      );
    });

    it('should initialize successfully when port is available', async () => {
      mockedDetectPort.mockResolvedValue(PORT_MANAGER_SERVER_PORT);
      mockExpressApp.listen.mockImplementation((port, callback) => {
        setImmediate(() => callback());
        return { on: jest.fn().mockReturnThis() };
      });

      await PortManagerServer.init();

      expect(PortManagerServer.app).toBeDefined();
      expect(mockExpressApp.use).toHaveBeenCalledTimes(3); // express.json(), cors(), and health check
      expect(mockedLogger.debug).toHaveBeenCalled();
    });
  });

  describe('portAvailable()', () => {
    it('should return true when port is available', async () => {
      mockedDetectPort.mockResolvedValue(PORT_MANAGER_SERVER_PORT);

      const result = await PortManagerServer.portAvailable();

      expect(result).toBe(true);
      expect(mockedDetectPort).toHaveBeenCalledWith(PORT_MANAGER_SERVER_PORT);
    });

    it('should return false when port is not available', async () => {
      mockedDetectPort.mockResolvedValue(PORT_MANAGER_SERVER_PORT + 1);

      const result = await PortManagerServer.portAvailable();

      expect(result).toBe(false);
      expect(mockedDetectPort).toHaveBeenCalledWith(PORT_MANAGER_SERVER_PORT);
    });
  });

  describe('reset()', () => {
    it('should reset all properties to undefined/empty', () => {
      // @ts-expect-error partial mock to test reset functionality
      PortManagerServer.app = {};
      // @ts-expect-error partial mock to test reset functionality
      PortManagerServer.server = {};
      PortManagerServer.serverPortMap = { test: 3000 };

      // @ts-expect-error testing private method
      PortManagerServer.reset();

      expect(PortManagerServer.app).toBeUndefined();
      expect(PortManagerServer.server).toBeUndefined();
      expect(PortManagerServer.serverPortMap).toEqual({});
    });
  });

  describe('setupRoutes()', () => {
    it('should return early if app is not defined', () => {
      PortManagerServer.app = undefined;

      // @ts-expect-error testing private method
      PortManagerServer.setupRoutes();

      // No expectations needed as method returns early
    });

    it('should setup all routes when app is defined', () => {
      // @ts-expect-error partial mock of Express app
      PortManagerServer.app = mockExpressApp;

      // @ts-expect-error testing private method
      PortManagerServer.setupRoutes();

      expect(mockExpressApp.get).toHaveBeenCalledWith(
        '/servers',
        expect.any(Function)
      );
      expect(mockExpressApp.get).toHaveBeenCalledWith(
        '/servers/:instanceId',
        expect.any(Function)
      );
      expect(mockExpressApp.post).toHaveBeenCalledWith(
        '/servers',
        expect.any(Function)
      );
      expect(mockExpressApp.delete).toHaveBeenCalledWith(
        '/servers/:instanceId',
        expect.any(Function)
      );
      expect(mockExpressApp.post).toHaveBeenCalledWith(
        '/close',
        expect.any(Function)
      );
      expect(mockExpressApp.use).toHaveBeenCalledWith(
        '/port-manager-health-check',
        expect.any(Function)
      );
    });
  });

  describe('setPort()', () => {
    it('should set port in serverPortMap and log debug message', () => {
      const instanceId = 'test-instance';
      const port = 3000;

      // @ts-expect-error testing private method
      PortManagerServer.setPort(instanceId, port);

      expect(PortManagerServer.serverPortMap[instanceId]).toBe(port);
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.setPort',
        { instanceId, port }
      );
      expect(mockedLogger.debug).toHaveBeenCalled();
    });
  });

  describe('deletePort()', () => {
    it('should delete port from serverPortMap and log debug message', () => {
      const instanceId = 'test-instance';
      const port = 3000;
      PortManagerServer.serverPortMap[instanceId] = port;

      // @ts-expect-error testing private method
      PortManagerServer.deletePort(instanceId);

      expect(PortManagerServer.serverPortMap[instanceId]).toBeUndefined();
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.deletedPort',
        { instanceId, port }
      );
      expect(mockedLogger.debug).toHaveBeenCalled();
    });
  });

  describe('send404()', () => {
    it('should send 404 response with error message', () => {
      const instanceId = 'test-instance';

      // @ts-expect-error testing private method
      PortManagerServer.send404(mockResponse as Response, instanceId);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.errors.404',
        { instanceId }
      );
    });
  });

  describe('getServers()', () => {
    it('should return servers and count', async () => {
      PortManagerServer.serverPortMap = { instance1: 3000, instance2: 3001 };

      // @ts-expect-error testing private method
      await PortManagerServer.getServers(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockResponse.send).toHaveBeenCalledWith({
        servers: { instance1: 3000, instance2: 3001 },
        count: 2,
      });
    });
  });

  describe('getServerPortByInstanceId()', () => {
    it('should return port when instance exists', () => {
      const instanceId = 'test-instance';
      const port = 3000;
      PortManagerServer.serverPortMap[instanceId] = port;
      mockRequest.params = { instanceId };

      // @ts-expect-error testing private method
      PortManagerServer.getServerPortByInstanceId(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockResponse.send).toHaveBeenCalledWith({ port });
    });

    it('should send 404 when instance does not exist', () => {
      const instanceId = 'nonexistent-instance';
      mockRequest.params = { instanceId };

      // @ts-expect-error testing private method
      jest.spyOn(PortManagerServer, 'send404').mockImplementation();

      // @ts-expect-error testing private method
      PortManagerServer.getServerPortByInstanceId(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      // @ts-expect-error testing private method
      expect(PortManagerServer.send404).toHaveBeenCalledWith(
        mockResponse,
        instanceId
      );
    });
  });

  describe('assignPortsToServers()', () => {
    it('should assign ports successfully', async () => {
      const portData = [
        { instanceId: 'instance1', port: 3000 },
        { instanceId: 'instance2' }, // No port specified
      ];
      mockRequest.body = { portData };

      mockedDetectPort
        .mockResolvedValueOnce(3000) // First call returns requested port
        .mockResolvedValueOnce(3001); // Second call returns available port

      // @ts-expect-error testing private method
      await PortManagerServer.assignPortsToServers(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(PortManagerServer.serverPortMap.instance1).toBe(3000);
      expect(PortManagerServer.serverPortMap.instance2).toBe(3001);
      expect(mockResponse.send).toHaveBeenCalledWith({
        ports: { instance1: 3000, instance2: 3001 },
      });
    });

    it('should return 409 if instance already has a port', async () => {
      const instanceId = 'existing-instance';
      const existingPort = 2000;
      PortManagerServer.serverPortMap[instanceId] = existingPort;

      const portData = [{ instanceId, port: 3000 }];
      mockRequest.body = { portData };

      // @ts-expect-error testing private method
      await PortManagerServer.assignPortsToServers(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.errors.409',
        {
          instanceId,
          port: existingPort,
        }
      );
    });

    it('should return 400 if port is out of valid range', async () => {
      const portData = [{ instanceId: 'instance1', port: 70000 }]; // Port too high
      mockRequest.body = { portData };

      // @ts-expect-error testing private method
      await PortManagerServer.assignPortsToServers(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.errors.400',
        expect.any(Object)
      );
    });
  });

  describe('deleteServerInstance()', () => {
    it('should delete instance and return 200 when instance exists', () => {
      const instanceId = 'test-instance';
      const port = 3000;
      PortManagerServer.serverPortMap[instanceId] = port;
      mockRequest.params = { instanceId };

      // @ts-expect-error testing private method
      jest.spyOn(PortManagerServer, 'deletePort').mockImplementation();

      // @ts-expect-error testing private method
      PortManagerServer.deleteServerInstance(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      // @ts-expect-error testing private method
      expect(PortManagerServer.deletePort).toHaveBeenCalledWith(instanceId);
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
    });

    it('should send 404 when instance does not exist', () => {
      const instanceId = 'nonexistent-instance';
      mockRequest.params = { instanceId };

      // @ts-expect-error testing private method
      jest.spyOn(PortManagerServer, 'send404').mockImplementation();

      // @ts-expect-error testing private method
      PortManagerServer.deleteServerInstance(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      // @ts-expect-error testing private method
      expect(PortManagerServer.send404).toHaveBeenCalledWith(
        mockResponse,
        instanceId
      );
    });
  });

  describe('closeServer()', () => {
    it('should close server and reset when server exists', () => {
      const mockServer = { close: jest.fn() };
      // @ts-expect-error partial mock of Server
      PortManagerServer.server = mockServer;

      // @ts-expect-error testing private method
      jest.spyOn(PortManagerServer, 'reset').mockImplementation();

      // @ts-expect-error testing private method
      PortManagerServer.closeServer(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockedLogger.debug).toHaveBeenCalled();
      expect(mockedI18n).toHaveBeenCalledWith('utils.PortManagerServer.close');
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
      expect(mockServer.close).toHaveBeenCalled();
      // @ts-expect-error testing private method
      expect(PortManagerServer.reset).toHaveBeenCalled();
    });

    it('should do nothing when server does not exist', () => {
      PortManagerServer.server = undefined;

      // @ts-expect-error testing private method
      PortManagerServer.closeServer(
        // @ts-expect-error partial mock for testing
        mockRequest,
        mockResponse as Response
      );

      expect(mockResponse.sendStatus).not.toHaveBeenCalled();
    });
  });

  describe('listen()', () => {
    it('should resolve with server on successful listen', async () => {
      const mockServer = { on: jest.fn().mockReturnThis() };
      mockExpressApp.listen.mockImplementation((port, callback) => {
        // Immediately call the success callback
        setImmediate(() => callback());
        return mockServer;
      });

      // @ts-expect-error partial mock of Express app
      PortManagerServer.app = mockExpressApp;

      // @ts-expect-error testing private method
      const result = await PortManagerServer.listen();

      expect(result).toEqual(mockServer);
      expect(mockedLogger.debug).toHaveBeenCalled();
      expect(mockedI18n).toHaveBeenCalledWith(
        'utils.PortManagerServer.started',
        {
          port: PORT_MANAGER_SERVER_PORT,
        }
      );
    });

    it('should reject with error on listen failure', async () => {
      const error = new Error('Listen failed');
      // @ts-expect-error circular reference needed for mockServer.on to return mockServer
      const mockServer = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'error') {
            callback(error);
          }
          return mockServer;
        }),
      };
      mockExpressApp.listen.mockImplementation(() => {
        // Don't call the success callback, only return the server
        return mockServer;
      });

      // @ts-expect-error partial mock of Express app
      PortManagerServer.app = mockExpressApp;

      // @ts-expect-error testing private method
      await expect(PortManagerServer.listen()).rejects.toThrow('Listen failed');
    });
  });
});
