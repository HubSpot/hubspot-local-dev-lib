export type DeveloperTestAccount = {
  testPortalId: number;
  parentPortalId: number;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
};

export type FetchDeveloperTestAccountsResponse = {
  results: DeveloperTestAccount[];
};
