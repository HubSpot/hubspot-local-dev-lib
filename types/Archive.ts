export type ZipData = {
  extractDir: string;
  tmpDir: string;
};

export type CopySourceToDestOptions = {
  sourceDir?: string;
  includesRootDir?: boolean;
  hideLogs?: boolean;
};
