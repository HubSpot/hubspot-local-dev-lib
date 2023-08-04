export type DeployStatusTaskLocator = {
  id: string;
  links: Array<{ status: string }>;
};

export type ProjectDeployResponse = {
  id: string;
  links: { status: string };
};
