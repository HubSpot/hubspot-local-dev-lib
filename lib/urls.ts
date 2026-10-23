import { ENVIRONMENTS } from '../constants/environments.js';
import { getConfigAccountEnvironment } from '../config/index.js';

const DEFAULT_HUBLET = 'na1';
const HUBLET_PATTERN = /^[a-z]{2}\d+$/;

function getEnvUrlString(env?: string): string {
  if (typeof env !== 'string') {
    return '';
  }

  return env.toLowerCase() === ENVIRONMENTS.QA ? ENVIRONMENTS.QA : '';
}

export const getHubSpotWebsiteOrigin = (env: string) =>
  `https://app.hubspot${getEnvUrlString(env)}.com`;

export function getHubSpotWebsiteOriginByAccountId(accountId: number): string {
  return getHubSpotWebsiteOrigin(
    getConfigAccountEnvironment(accountId) === ENVIRONMENTS.QA
      ? ENVIRONMENTS.QA
      : ENVIRONMENTS.PROD
  );
}

function getApiSubdomain(env?: string, hublet?: string): string {
  if (
    getEnvUrlString(env) !== ENVIRONMENTS.QA ||
    !hublet ||
    hublet === DEFAULT_HUBLET ||
    !HUBLET_PATTERN.test(hublet)
  ) {
    return 'api';
  }

  return `api-${hublet}`;
}

export function getHubSpotApiOrigin(
  env?: string,
  useLocalHost?: boolean,
  hublet?: string
): string {
  let domain;
  const domainOverride = process.env.HUBAPI_DOMAIN_OVERRIDE;
  if (domainOverride && typeof domainOverride === 'string') {
    domain = `${domainOverride}${getEnvUrlString(env)}`;
  }
  if (!domain || typeof domain !== 'string') {
    const subdomain = useLocalHost ? 'local' : getApiSubdomain(env, hublet);
    domain = `${subdomain}.hubapi${getEnvUrlString(env)}`;
  }
  return `https://${domain}.com`;
}
