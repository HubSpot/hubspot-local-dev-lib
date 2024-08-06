export type RequestPortsData = {
  instanceId: string;
  port?: number;
};

export type NetError = Error & {
  code: string;
};

export type ListenCallback = (error: NetError | null, port: number) => void;

export type ServerPortMap = {
  [instanceId: string]: number;
};
