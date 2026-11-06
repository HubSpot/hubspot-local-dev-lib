export type AppSecret = {
  key: string;
  createdAt: string;
  updatedAt: string;
};

export type FetchAppSecretsResponse = {
  results: Array<AppSecret>;
};
