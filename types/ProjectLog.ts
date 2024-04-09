export type ProjectLog = {
  lineNumber: number;
  logLevel: string;
  message: string;
  pipelineStepId: number;
  pipelineSubstepId?: string;
  pipelineSubstepName?: string;
  timestamp: number;
};
