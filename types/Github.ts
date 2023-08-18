type GithubAuthor = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
};

export type GithubReleaseData = {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: GithubAuthor;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Array<object>;
  tarball_url: string;
  zipball_url: string;
  body: string;
  mentions_count: number;
};

export type GithubRepoFile = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

export interface GithubSourceData {
  branch: string;
  owner: string;
  repositoryName: string;
  source: string;
}
