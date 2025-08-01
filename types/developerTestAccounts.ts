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

export type CreateDeveloperTestAccountV3Response = {
  id: number;
  accountName: string;
};

export type FetchDeveloperTestAccountsResponse = {
  results: DeveloperTestAccount[];
  maxTestPortals: number;
};

export type AccountLevel = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type DeveloperTestAccountConfig = {
  accountName: string;
  description?: string;
  marketingLevel?: AccountLevel;
  opsLevel?: AccountLevel;
  serviceLevel?: AccountLevel;
  salesLevel?: AccountLevel;
  contentLevel?: AccountLevel;
};

export type InstallOauthAppIntoDeveloperTestAccountResponse = {
  authCodes: Array<{
    developerQualifiedSymbol: {
      projectName: string;
      developerSymbol: string;
    };
    authCode: string;
  }>;
};

export type TestPortalStatusResponse = {
  status: 'IN_PROGRESS' | 'SUCCESS';
};

export type GenerateDeveloperTestAccountPersonalAccessKeyResponse = {
  personalAccessKey: string;
};
