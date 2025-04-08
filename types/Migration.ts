import { ValueOf } from './Utils';
import { ProjectStandardError } from './Project';

export const MIGRATION_STATUS = {
  BUILDING: 'BUILDING',
  FAILURE: 'FAILURE',
  PREPARING: 'PREPARING',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  IN_PROGRESS: 'IN_PROGRESS',
  INPUT_REQUIRED: 'INPUT_REQUIRED',
} as const;

export type MigrateAppResponse = {
  id: number;
  status: ValueOf<typeof MIGRATION_STATUS>;
};

export type CloneAppResponse = {
  exportId: number;
  status: ValueOf<typeof MIGRATION_STATUS>;
};

export type PollAppResponse = {
  id: number;
  project?: { id: number; name: string; buildId: number; deployId: number };
  error: ProjectStandardError | null;
  status: ValueOf<typeof MIGRATION_STATUS>;
};

export interface MigrationBaseStatus {
  id: number;
}

export interface MigrationInProgress extends MigrationBaseStatus {
  status: typeof MIGRATION_STATUS.IN_PROGRESS;
}

export interface MigrationInputRequired extends MigrationBaseStatus {
  status: typeof MIGRATION_STATUS.INPUT_REQUIRED;
  componentsRequiringUids: Record<
    string,
    {
      componentType: string;
      componentHint: string;
    }
  >;
}

export interface MigrationSuccess extends MigrationBaseStatus {
  status: typeof MIGRATION_STATUS.SUCCESS;
  buildId: number;
}

export interface MigrationFailed extends MigrationBaseStatus {
  status: typeof MIGRATION_STATUS.FAILURE;
  projectErrorsDetail?: string;
  componentErrorDetails: Record<string, string>;
}

export type MigrationStatus =
  | MigrationInProgress
  | MigrationInputRequired
  | MigrationSuccess
  | MigrationFailed;
