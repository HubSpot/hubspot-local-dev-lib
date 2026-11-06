export type ProjectLog = {
  lineNumber: number;
  logLevel: string;
  message: string;
  pipelineStepId: number;
  pipelineSubstepId?: string;
  pipelineSubstepName?: string;
  timestamp: number;
};

export type ProjectPipelineStage = 'BUILD' | 'DEPLOY';

export type ProjectSubstepLogs = {
  pipelineStepId: number;
  pipelineSubstepId: string;
  pipelineStage: ProjectPipelineStage;
  projectName: string;
  logs: Array<ProjectLog>;
};

export type ProjectLogsResponse = {
  pipelineStage: ProjectPipelineStage;
  pipelineStepId: number;
  projectName: string;
  logs: Array<ProjectSubstepLogs>;
};
