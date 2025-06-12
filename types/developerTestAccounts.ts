export type DeveloperTestAccount = {
  testPortalId: number;
  parentPortalId: number;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  id: number;
};

export type CreateDeveloperTestAccountResponse = {
  id: number;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt: string;
  status: string;
  currentUserHasAccess: boolean;
  personalAccessKey: string;
};

export type FetchDeveloperTestAccountsResponse = {
  results: DeveloperTestAccount[];
  maxTestPortals: number;
};
