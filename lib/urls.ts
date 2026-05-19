import { ENVIRONMENTS } from '../constants/environments.js';
import { HUBSPOT_HUBLETS } from '../constants/hublets.js';
import { Hublet } from '../types/Accounts.js';

function getEnvUrlString(env?: string): string {
  if (typeof env !== 'string') {
    return '';
  }

  return env.toLowerCase() === ENVIRONMENTS.QA ? ENVIRONMENTS.QA : '';
}

function getHubletSubdomain(prefix: 'api' | 'app', hublet?: Hublet): string {
  if (!hublet) {
    return prefix;
  }

  if (prefix === 'app' && hublet === HUBSPOT_HUBLETS.NA1) {
    return prefix;
  }

  return `${prefix}-${hublet}`;
}

export const getHubSpotWebsiteOrigin = (env: string, hublet?: Hublet) =>
  `https://${getHubletSubdomain('app', hublet)}.hubspot${getEnvUrlString(
    env
  )}.com`;

export function getHubSpotApiOrigin(
  env?: string,
  useLocalHost?: boolean,
  hublet?: Hublet
): string {
  let domain;
  const domainOverride = process.env.HUBAPI_DOMAIN_OVERRIDE;
  if (domainOverride && typeof domainOverride === 'string') {
    domain = `${domainOverride}${getEnvUrlString(env)}`;
  }
  if (!domain || typeof domain !== 'string') {
    const subdomain = useLocalHost
      ? 'local'
      : getHubletSubdomain('api', hublet);
    domain = `${subdomain}.hubapi${getEnvUrlString(env)}`;
  }
  return `https://${domain}.com`;
}
