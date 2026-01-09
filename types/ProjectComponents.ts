export type DeployStatusTaskLocator = {
  id: string;
  links: Array<{ status: string }>;
};

export type ProjectStandardError = {
  status: string;
  id?: string;
  category: string;
  subCategory?: string;
  message?: string;
  errors?: Array<{
    message: string;
    in?: string;
    code?: string;
    subcateogy?: string;
    context: object;
  }>;
  context: object;
  links: { [key: string]: string };
};
