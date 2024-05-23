export type PublicAppInstallationData = {
  appId: number;
  isInstalledWithScopeGroups: boolean;
  previouslyAuthorizedScopeGroups: Array<{
    id: number;
    name: string;
  }>;
};

export type DeveloperTestAccountInstallData = {
  testPortalInstalls: Array<{
    portalId: number;
    accountName: string;
  }>;
  testPortalInstallCount: string;
};

export type PublicApp = {
  id: number;
  name: string;
  description: string;
  portalId: number;
  updatedAt: number;
  createdAt: number;
  clientId: string;
  iconUrl: string;
  archived: boolean;
  ownerId: number;
  isUserLevel: boolean;
  isBusinessUnitEnabled: boolean;
  isFeatured: boolean;
  isInternal: boolean;
  documentationUrl: string | null;
  supportUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  extensionIconUrl: string | null;
  isAdvancedScopesSettingEnabled: boolean;
  publicApplicationInstallCounts: {
    uniquePortalInstallCount: number;
    uniqueUserInstallCount: number;
    uniqueBusinessUnitInstallCount: number;
  };
  redirectUrls: Array<string>;
  scopeGroupIds: Array<number>;
  additionalScopeGroupIds: Array<number>;
  optionalScopeGroupIds: Array<number>;
  projectId: number | null;
  sourceId: string | null;
  allowedExternalUrls: Array<string>;
};
