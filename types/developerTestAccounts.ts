export type DeveloperTestAccount = {
  testPortalId: number;
  parentPortalId: number;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  id: number;
};

export type FetchDeveloperTestAccountsResponse = {
  results: DeveloperTestAccount[];
  maxTestPortals: number;
};
