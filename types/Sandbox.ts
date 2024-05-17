export type SandboxHubData = {
  type?: string | null;
  parentHubId?: number;
};

type User = {
  userId: number;
  firstName: string;
  lastName: string;
  gdprDeleted?: boolean;
  removed?: boolean;
  deactivated?: boolean;
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

export type SyncTaskStatusType = {
  status: string;
  result?: string;
  tasks: Pick<CompositeSyncTask, 'type' | 'status'>[];
};

type SyncMutationData = {
  numRequests: number;
  numSuccesses: number;
  errors: Array<TaskError>;
  mutationErrors: Array<MutationError>;
};

export type CompositeSyncTask = {
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
  creates: SyncMutationData;
  updates: SyncMutationData;
  deletes: SyncMutationData;
  diffSummary: string;
  portableKeys: Array<string>;
};

export type SyncTask = {
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
  tasks: Array<CompositeSyncTask>;
};

export type Sandbox = {
  sandboxHubId: number;
  parentHubId: number;
  createdAt: string;
  updatedAt?: string | null;
  archivedAt?: string | null;
  type: string;
  archived: boolean;
  name: string;
  domain: string;
  createdByUser: User;
  updatedByUser?: User | null;
  lastSync?: SyncTask;
  currentUserHasAccess?: boolean;
  currentUserHasSuperAdminAccess?: boolean;
  requestAccessFrom?: User | null;
  superAdminsInSandbox?: number;
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

export type TaskRequestData = {
  type: string;
};

export type InitiateSyncResponse = {
  links: {
    status: string;
  };
  sync: SyncTask;
  id: string;
};

export type SandboxType = {
  name: string;
  dependsOn: Array<string>;
  pushToProductionEnabled: boolean;
  isBeta: boolean;
  diffEnabled: boolean;
  groupType: string;
  syncMandatory: boolean;
};

export type FetchTypesResponse = {
  results: Array<SandboxType>;
};
