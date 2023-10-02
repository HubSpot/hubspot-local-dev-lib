export interface CLIOptions {
  silenceErrors?: boolean;
  useEnv?: boolean;
}

export type WriteConfigOptions = {
  path?: string;
  source?: string;
};
