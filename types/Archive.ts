export type ZipData = {
  extractDir: string;
  tmpDir: string;
};

export type CopySourceToDestOptions = {
  sourceDir?: string | string[];
  includesRootDir?: boolean;
  hideLogs?: boolean;
};
