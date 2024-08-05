export type FetchThemesResponse = {
  objects: Array<{
    theme: {
      path: string;
    };
  }>;
};

export type FetchBuiltinMappingResponse = {
  [key: string]: string;
};
