export type FetchThemesResponse = {
  limit: number;
  offset: number;
  total: number;
  totalHubSpotThemes: number;
  totalUsedThemes: number;
  objects: Array<{
    theme: {
      path: string;
    };
  }>;
};

export type FetchBuiltinMappingResponse = {
  [key: string]: string;
};
