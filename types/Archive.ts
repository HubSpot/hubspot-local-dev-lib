export interface Collision {
  dest: string;
  src: string;
  collisions: string[];
}

export type ZipData = {
  extractDir: string;
  tmpDir: string;
};

export type CopySourceToDestOptions = {
  sourceDir?: string | string[];
  includesRootDir?: boolean;
  hideLogs?: boolean;
  handleCollision?: (collision: Collision) => void | Promise<void>;
};
