import {
  createSandbox as __createSandbox,
  getSandboxUsageLimits as __getSandboxUsageLimits,
  deleteSandbox as __deleteSandbox,
} from '../../api/sandboxHubs';
import {
  initiateSync as __initiateSync,
  fetchTaskStatus as __fetchTaskStatus,
  fetchTypes as __fetchTypes,
} from '../../api/sandboxSync';
import { Sandbox, SyncTask, TaskRequestData, Usage } from '../../types/Sandbox';
import {
  createSandbox,
  deleteSandbox,
  getSandboxUsageLimits,
  fetchTypes,
  initiateSync,
  fetchTaskStatus,
} from '../sandboxes';
import { AxiosError } from 'axios';
import { mockAxiosResponse } from './__utils__/mockAxiosResponse';
import { HubSpotHttpError } from '../../models/HubSpotHttpError';

jest.mock('../../api/sandboxHubs');
jest.mock('../../api/sandboxSync');

const createSandboxMock = __createSandbox as jest.MockedFunction<
  typeof __createSandbox
>;

const deleteSandboxMock = __deleteSandbox as jest.MockedFunction<
  typeof __deleteSandbox
>;
const getSandboxUsageLimitsMock =
  __getSandboxUsageLimits as jest.MockedFunction<
    typeof __getSandboxUsageLimits
  >;
const fetchTypesMock = __fetchTypes as jest.MockedFunction<typeof __fetchTypes>;
const initiateSyncMock = __initiateSync as jest.MockedFunction<
  typeof __initiateSync
>;
const fetchTaskStatusMock = __fetchTaskStatus as jest.MockedFunction<
  typeof __fetchTaskStatus
>;

const sandboxName = 'Mock Standard Sandbox';
const sandboxHubId = 987654;
const accountId = 123456;

const MOCK_SANDBOX_ACCOUNT: Sandbox = {
  sandboxHubId: sandboxHubId,
  parentHubId: accountId,
  createdAt: '2023-01-27T22:24:27.279Z',
  updatedAt: '2023-02-09T19:36:25.123Z',
  archivedAt: null,
  type: 'developer',
  archived: false,
  name: sandboxName,
  domain: 'mockStandardSandbox.com',
  createdByUser: {
    userId: 111,
    firstName: 'Test',
    lastName: 'User',
  },
};

const MOCK_USAGE_DATA: Usage = {
  STANDARD: {
    used: 0,
    available: 1,
    limit: 1,
  },
  DEVELOPER: {
    used: 0,
    available: 1,
    limit: 1,
  },
};

const MOCK_TYPES = [
  {
    name: 'object-schemas',
    dependsOn: [],
    pushToProductionEnabled: true,
    isBeta: false,
    diffEnabled: true,
    groupType: 'object-schemas',
    syncMandatory: true,
  },
];

describe('lib/sandboxes', () => {
  let error: HubSpotHttpError;
  beforeEach(() => {
    error = new HubSpotHttpError('OH NO', { cause: new AxiosError() });
  });
  describe('createSandbox', () => {
    const personalAccessKey = 'pak-test-123';
    it('should create a sandbox', async () => {
      createSandboxMock.mockResolvedValue(
        mockAxiosResponse({
          sandbox: MOCK_SANDBOX_ACCOUNT,
          personalAccessKey,
        })
      );

      const response = await createSandbox(accountId, sandboxName, 1);
      expect(createSandboxMock).toHaveBeenCalledWith(accountId, sandboxName, 1);
      expect(response).toStrictEqual({
        personalAccessKey,
        name: sandboxName,
        sandbox: MOCK_SANDBOX_ACCOUNT,
      });
    });

    it('should throw an API error when an error is encountered', async () => {
      createSandboxMock.mockRejectedValue(error);

      await expect(async () => {
        await createSandbox(accountId, sandboxName, 1);
      }).rejects.toThrowError('The request failed.');
    });
  });

  describe('deleteSandbox', () => {
    it('should delete sandbox', async () => {
      const response = await deleteSandbox(accountId, sandboxHubId);
      expect(response).toStrictEqual({
        parentAccountId: accountId,
        sandboxAccountId: sandboxHubId,
      });
    });
    it('should throw an API error when an error is encountered', async () => {
      deleteSandboxMock.mockRejectedValue(error);

      await expect(async () => {
        await deleteSandbox(accountId, sandboxHubId);
      }).rejects.toThrowError('The request failed.');
    });
  });

  describe('getSandboxUsageLimits', () => {
    it('should get usage limit', async () => {
      getSandboxUsageLimitsMock.mockResolvedValue(
        mockAxiosResponse({
          usage: MOCK_USAGE_DATA,
        })
      );

      const response = await getSandboxUsageLimits(accountId);
      expect(response).toStrictEqual(MOCK_USAGE_DATA);
    });

    it('should throw an API error when an error is encountered', async () => {
      getSandboxUsageLimitsMock.mockRejectedValue(error);

      await expect(async () => {
        await getSandboxUsageLimits(accountId);
      }).rejects.toThrowError('The request failed.');
    });
  });

  describe('initiateSync', () => {
    const toHubId = 456789;
    const tasks: TaskRequestData[] = [];
    it('should initiate the sync', async () => {
      const sync = {
        links: {
          status: 'some status',
        },
        sync: {
          id: 'sync-id',
        } as SyncTask, // This object is huge, I don't want to add all of it
        id: 'this-is-an-id',
      };
      initiateSyncMock.mockResolvedValue(mockAxiosResponse(sync));

      const response = await initiateSync(
        accountId,
        toHubId,
        tasks,
        sandboxHubId
      );
      expect(initiateSyncMock).toHaveBeenCalledWith(
        accountId,
        toHubId,
        tasks,
        sandboxHubId
      );
      expect(response).toStrictEqual(sync);
    });

    it('should throw an API error when an error is encountered', async () => {
      initiateSyncMock.mockRejectedValue(error);

      await expect(async () => {
        await initiateSync(accountId, 234, [], 789);
      }).rejects.toThrowError('The request failed.');
    });
  });

  describe('fetchTaskStatus', () => {
    const taskId = 1234567890;
    it('should fetch the task status', async () => {
      const status = {
        status: 'please hold',
        tasks: [],
      };
      fetchTaskStatusMock.mockResolvedValue(mockAxiosResponse(status));

      const response = await fetchTaskStatus(accountId, taskId);
      expect(fetchTaskStatusMock).toHaveBeenCalledWith(accountId, taskId);
      expect(response).toStrictEqual(status);
    });

    it('should throw an API error when an error is encountered', async () => {
      fetchTaskStatusMock.mockRejectedValue(error);

      await expect(async () => {
        await fetchTaskStatus(accountId, taskId);
      }).rejects.toThrowError('The request failed.');
    });
  });

  describe('fetchTypes', () => {
    it('should fetch types', async () => {
      fetchTypesMock.mockResolvedValue(
        mockAxiosResponse({
          results: MOCK_TYPES,
        })
      );

      const response = await fetchTypes(accountId, sandboxHubId);
      expect(response).toStrictEqual(MOCK_TYPES);
    });

    it('should throw an API error when an error is encountered', async () => {
      fetchTypesMock.mockRejectedValue(error);

      await expect(async () => {
        await fetchTypes(accountId, sandboxHubId);
      }).rejects.toThrowError('The request failed.');
    });
  });
});
