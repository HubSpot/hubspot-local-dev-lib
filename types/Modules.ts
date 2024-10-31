export type PathInput = {
  isLocal?: boolean;
  isHubSpot?: boolean;
  path: string;
};

export type ValidationResult = {
  id: string;
  message: string;
};

export type ModuleDefinition = {
  contentTypes: Array<string>;
  moduleLabel: string;
  reactType: boolean;
  global: boolean;
  availableForNewContent: boolean;
};
