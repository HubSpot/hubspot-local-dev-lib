type App = {
  id: number;
  name: string;
  description?: string;
  portalId: number;
  updatedAt: number;
  createdAt: number;
  clientId: string;
  iconUrl?: string;
  archived: boolean;
  ownerId?: number;
  isUserLevel: boolean;
  isBusinessUnitEnabled: boolean;
  isFeatured: boolean;
  isInternal: boolean;
  documentationUrl?: string;
  supportUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  extensionIconUrl?: string;
  isAdvancedScopesSettingEnabled: boolean;
};

export type FetchAppsResponse = {
  results: Array<App>;
};
