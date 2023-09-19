export type SandboxHubData = {
  type?: string | null;
  parentHubId?: number;
};

type User = {
  userId: number;
  firstName: string;
  lastName: string;
  gdprDeleted: boolean;
  removed: boolean;
  deactivated: boolean;
};

type TaskError = {
  message: string;
  in: string;
  code: string;
  subCategory: string;
  context: {
    missingScopes: Array<string>;
  };
};

type MutationError = {
  message: string;
  portableKey: string;
  subResource: {
    type: string;
    key: string;
  };
  standardError: {
    status: string;
    id: string;
    category: string;
    subCategory: { [key: string]: string };
    message: string;
    errors: Array<TaskError>;
    context: {
      additionalProp1: Array<string>;
      additionalProp2: Array<string>;
      additionalProp3: Array<string>;
    };
    links: {
      additionalProp1: string;
      additionalProp2: string;
      additionalProp3: string;
    };
  };
};

type TaskStatus = {
  numRequests: number;
  numSuccesses: number;
  errors: Array<TaskError>;
  mutationErrors: Array<MutationError>;
};

export type Task = {
  id: string;
  parentHubId: number;
  sandboxHubId: number;
  fromHubId: number;
  toHubId: number;
  command: string;
  type: string;
  status: string;
  result: string;
  sandboxType: string;
  requestedAt: string;
  requestedByUserId: number;
  requestedByUser: User;
  startedAt: string;
  completedAt: string;
  error: MutationError;
  creates: TaskStatus;
  updates: TaskStatus;
  deletes: TaskStatus;
  diffSummary: string;
  portableKeys: Array<string>;
};

export type Sandbox = {
  sandboxHubId: number;
  parentHubId: number;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
  type: string;
  archived: boolean;
  name: string;
  domain: string;
  createdByUser: User;
  updatedByUser: User | null;
  lastSync: {
    id: string;
    parentHubId: number;
    sandboxHubId: number;
    fromHubId: number;
    toHubId: number;
    command: string;
    status: string;
    result: string;
    sandboxType: string;
    requestedAt: string;
    requestedByUserId: number;
    requestedByUser: User;
    startedAt: string;
    completedAt: string;
    tasks: Array<Task>;
  };
  currentUserHasAccess: boolean | null;
  currentUserHasSuperAdminAccess: boolean | null;
  requestAccessFrom: User | null;
  superAdminsInSandbox: number | null;
};

export type SandboxResponse = {
  sandbox: Sandbox;
  personalAccessKey: string;
};

export type Usage = {
  STANDARD: {
    used: number;
    available: number;
    limit: number;
  };
  DEVELOPER: {
    used: number;
    available: number;
    limit: number;
  };
};

export type SandboxUsageLimitsResponse = {
  usage: Usage;
};

export type SyncTask = {
  type: string;
};

export type InitiateSyncResponse = {
  links: {
    status: string;
  };
  sync: {
    id: string;
    parentHubId: number;
    sandboxHubId: number;
    fromHubId: number;
    toHubId: number;
    command: string;
    status: string;
    sandboxType: string;
    requestedAt: string;
    requestedByUserId: number;
    tasks: Array<Task>;
  };
  id: string;
};

export type SandboxType = {
  name: string;
  dependsOn: Array<string>;
  pushToParentEnabled: boolean;
  isBeta: boolean;
  diffEnabled: boolean;
  groupType: string;
};

export type FetchTypesResponse = {
  results: Array<SandboxType>;
};
