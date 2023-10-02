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
