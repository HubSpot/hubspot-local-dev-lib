import { ACTIVITY_SOURCE } from '../enums/project';
import { ValueOf } from './Utils';
import { GithubSourceData } from './Github';

export interface GithubActivitySource extends GithubSourceData {
  authorEmail: string;
  authorName: string;
  branchName: string;
  branch: string;
  commitHash: string;
  committersUsername: string;
  ownerName: string;
  owner: string;
  repositoryName: string;
  type: typeof ACTIVITY_SOURCE.GITHUB_USER;
}

export type HubspotActivitySource = {
  userId?: number;
  type: ValueOf<typeof ACTIVITY_SOURCE>;
};

export type ActivitySource = GithubActivitySource | HubspotActivitySource;
