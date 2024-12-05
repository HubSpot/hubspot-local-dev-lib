export type Check = {
  check: string;
  status: string;
  title: string;
  documentationLink: string;
  message: string | null;
  description: string;
  line: number | null;
  file: string;
};

export interface ValidationError {
  validationRequestId: number;
  failureReasonType: string;
  context: string;
}

export type GetValidationResultsResponse = {
  validationRequestId: number;
  assetPath: string;
  assetType: string;
  results: {
    REQUIRED: { status: string; results: Array<Check> };
    RECOMMENDED: { status: string; results: Array<Check> };
  };
  errors: Array<ValidationError>;
  requestedAt: string;
};
