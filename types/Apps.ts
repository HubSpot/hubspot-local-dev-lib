export type PublicAppInstallationData = {
  appId: number;
  isInstalledWithScopeGroups: boolean;
  previouslyAuthorizedScopeGroups: Array<{
    id: number;
    name: string;
  }>;
};

export type PublicAppDeveloperTestAccountInstallData = {
  testPortalInstalls: Array<{
    portalId: number;
    accountName: string;
  }>;
  testPortalInstallCount: string;
};

export type PublicApInstallCounts = {
  uniquePortalInstallCount: number;
  uniqueUserInstallCount: number;
  uniqueBusinessUnitInstallCount: number;
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
  publicApplicationInstallCounts: PublicApInstallCounts;
  redirectUrls: Array<string>;
  scopeGroupIds: Array<number>;
  requiredScopeInfo?: Array<{ id: number; name: string }>;
  additionalScopeGroupIds: Array<number>;
  additionalScopeInfo?: Array<{ id: number; name: string }>;
  optionalScopeGroupIds: Array<number>;
  optionalScopeInfo?: Array<{ id: number; name: string }>;
  projectId: number | null;
  sourceId: string | null;
  providerInfo?: {
    domain: string;
    isVerified: boolean;
  };
  listingInfo?: {
    listingUrl: string;
    isCertified: boolean;
    isPublished: boolean;
    hasDraft: boolean;
    inReview: boolean;
  };
  allowedExternalUrls: Array<string>;
  preventProjectMigrations?: boolean;
};
