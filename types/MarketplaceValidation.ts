type Check = {
  check: string;
  status: string;
  title: string;
  documentationLink: string;
  message: string | null;
  description: string;
  line: number | null;
  file: string;
};

export type GetValidationResultsResponse = {
  validationRequestId: number;
  assetPath: string;
  assetType: string;
  results: {
    REQUIRED: { status: string; results: Array<Check> };
    RECOMMENDED: { status: string; results: Array<Check> };
  };
  errors: Array<Error>;
  requestedAt: string;
};
