export type DeveloperTestAccount = {
  id: number;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
};

export type FetchTestAccountsResponse = {
  results: DeveloperTestAccount[];
};
