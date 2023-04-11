import { ENVIRONMENTS } from '../constants/environments';

function getEnvUrlString(env?: string): string {
  if (typeof env !== 'string') {
    return '';
  }

  return env.toLowerCase() === ENVIRONMENTS.QA ? ENVIRONMENTS.QA : '';
}

export const getHubSpotWebsiteOrigin = (env: string) =>
  `https://app.hubspot${getEnvUrlString(env)}.com`;

export function getHubSpotApiOrigin(
  env?: string,
  useLocalHost?: boolean
): string {
  let domain = process.env.HUBAPI_DOMAIN_OVERRIDE;

  if (!domain || typeof domain !== 'string') {
    domain = `${useLocalHost ? 'local' : 'api'}.hubapi${getEnvUrlString(env)}`;
  }
  return `https://${domain}.com`;
}
