type ServerlessFunction = {
  portalId: number;
  id: number;
  serverlessFunctionId: number;
  route: string;
  rawAssetPath: string;
  method: string;
  configHash: number;
  secretNames: Array<string>;
  created: number;
  updated: number;
  deletedAt: number;
  deployId: number;
  projectName: string | null;
  authorFullName: string | null;
  createdById: number | null;
  updatedById: number | null;
  appId: number | null;
  subbuildId: number | null;
  deployed: boolean;
  deployedNullable: boolean;
};

export type GetRoutesResponse = {
  objects: Array<ServerlessFunction>;
  total: number;
  limit: number;
  offset: number;
  message: string | null;
  totalCount: number;
};

export type GetBuildStatusResponse = {
  status: string;
  buildStartedAt: number;
  updateCutoff?: number;
  cdnUrl?: string;
  buildTime?: number;
  userId: number;
  deployId: number;
};

export type FunctionConfig = {
  runtime: string;
  version: string;
  environment: object;
  secrets: Array<string>;
  endpoints: {
    [key: string]: {
      method: string;
      file: string;
    };
  };
};

export type FunctionConfigInfo = {
  endpointPath: string;
  endpointMethod: string;
  functionFile: string;
};

export type FunctionInfo = {
  functionsFolder: string;
  filename: string;
  endpointPath: string;
  endpointMethod: string;
};

export type FunctionOptions = {
  allowExistingFile?: boolean;
};

export type FunctionLog = {
  id: string;
  executionTime: number;
  log: string;
  error: {
    message: string;
    type: string;
    stackTrace: string[][];
  };
  status: string;
  createdAt: number;
  memory: string;
};

export type GetFunctionLogsResponse = {
  results: FunctionLog[];
  paging: {
    next: {
      after: string;
      link: string;
    };
    prev: {
      before: string;
      link: string;
    };
  };
};
