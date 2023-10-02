export type RequestLighthouseScoreResponse = {
  desktopId: number;
  mobileId: number;
};

export type GetLighthouseScoreResponse = {
  portalId: number;
  themePath: string;
  status: string;
  scores: [
    {
      accessibilityScore: number;
      bestPracticesScore: number;
      performanceScore: number;
      pwaScore: number;
      seoScore: number;
      runWarnings: Array<string>;
      auditDetails: null; //TODO
      emulatedFormFactor: string;
      templatePath: string | null;
      link: string | null;
    },
  ];
  failedTemplatePaths: Array<string>;
  error: Error | null;
};
