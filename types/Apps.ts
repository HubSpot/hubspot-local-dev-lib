export type PublicAppInstallationData = {
  appId: number;
  isInstalledWithScopeGroups: boolean;
  previouslyAuthorizedScopeGroups: Array<{
    id: number;
    name: string;
  }>;
};
