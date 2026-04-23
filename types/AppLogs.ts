export type SystemType =
  | 'CRM_LEGACY_CARD'
  | 'CRM_EXTENSIBILITY_CARD'
  | 'WEBHOOKS'
  | 'API_CALL'
  | 'APP_SETTINGS'
  | 'UNDEFINED'
  | 'SERVERLESS_EXECUTION'
  | 'PROXY_EXECUTION'
  | 'EXTENSION_RENDER'
  | 'EXTENSION_LOG'
  | 'SERVERLESS_GATEWAY_EXECUTION'
  | 'ACCEPTANCE_TEST'
  | 'OAUTH_AUTHORIZATION';

export type ResultsOrder = 'ASC' | 'DESC';

export type SearchLogsRequest = {
  loggingSystemType?: string;
  logId?: string;
  limit?: number;
  offset?: number;
  startTime?: number;
  endTime?: number;
  errorTypes?: string[];
  resultsOrder?: ResultsOrder;
  portalId?: number;
  correlationGroupId?: string;
  traceId?: string;
  label?: string;
  cardIds?: string[];
};

export type AppLogEntry = {
  id: string;
  loggingSystemType: string;
  requestExecutionTimestamp: number;
  portalId: number;
  traceId: string;
  parentId: string;
  label: string;
  responseReceivedTimestamp: number;
  duration: number;
  errorType?: string;
  appId: number;
  [key: string]: unknown;
};

export type SearchLogsResponse = {
  results: AppLogEntry[];
  hasMore: boolean;
  offset: number;
  total: number;
};
