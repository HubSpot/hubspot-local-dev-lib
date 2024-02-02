import {
  createSandbox as __createSandbox,
  getSandboxUsageLimits as __getSandboxUsageLimits,
} from '../../api/sandboxHubs';
import { fetchTypes as __fetchTypes } from '../../api/sandboxSync';
import { Sandbox, Usage } from '../../types/Sandbox';
import {
  createSandbox as createSandboxAction,
  deleteSandbox as deleteSandboxAction,
  getSandboxUsageLimits as getSandboxUsageLimitsAction,
  fetchTypes as fetchTypesAction,
} from '../sandboxes';

jest.mock('../../api/sandboxHubs');
jest.mock('../../api/sandboxSync');

const createSandbox = __createSandbox as jest.MockedFunction<
  typeof __createSandbox
>;
const getSandboxUsageLimits = __getSandboxUsageLimits as jest.MockedFunction<
  typeof __getSandboxUsageLimits
>;
const fetchTypes = __fetchTypes as jest.MockedFunction<typeof __fetchTypes>;

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
  it('createSandbox()', async () => {
    const personalAccessKey = 'pak-test-123';
    createSandbox.mockResolvedValue({
      sandbox: MOCK_SANDBOX_ACCOUNT,
      personalAccessKey,
    });

    const response = await createSandboxAction(accountId, sandboxName, 1);
    expect(response.personalAccessKey).toEqual(personalAccessKey);
    expect(response.name).toEqual(sandboxName);
    expect(response.sandbox).toBeTruthy();
  });

  it('deleteSandbox()', async () => {
    const response = await deleteSandboxAction(accountId, sandboxHubId);
    expect(response.parentAccountId).toEqual(accountId);
    expect(response.sandboxAccountId).toEqual(sandboxHubId);
  });

  it('getSandboxUsageLimits()', async () => {
    getSandboxUsageLimits.mockResolvedValue({
      usage: MOCK_USAGE_DATA,
    });

    const response = await getSandboxUsageLimitsAction(accountId);
    expect(response).toMatchObject(MOCK_USAGE_DATA);
  });

  it('fetchTypes()', async () => {
    fetchTypes.mockResolvedValue({
      results: MOCK_TYPES,
    });

    const response = await fetchTypesAction(accountId, sandboxHubId);
    expect(response).toMatchObject(MOCK_TYPES);
  });
});
