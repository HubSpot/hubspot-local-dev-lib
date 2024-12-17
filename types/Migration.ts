import { ValueOf } from './Utils';
import { ProjectStandardError } from './Project';

export const MIGRATION_STATUS = {
  BUILDING: 'BUILDING',
  FAILURE: 'FAILURE',
  PREPARING: 'PREPARING',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
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
