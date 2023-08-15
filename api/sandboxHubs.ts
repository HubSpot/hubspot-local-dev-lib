import axios from 'axios';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';
import { SandboxHubData } from '../types/Sandbox';

const SANDBOX_HUBS_API_PATH = 'sandbox-hubs/v1/self';

export async function fetchSandboxHubData(
  accessToken: string,
  portalId: number,
  env: Environment = ENVIRONMENTS.PROD
): Promise<SandboxHubData> {
  const axiosConfig = getAxiosConfig({
    env,
    url: `${SANDBOX_HUBS_API_PATH}`,
    params: { portalId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data } = await axios<SandboxHubData>(reqWithToken);

  return data;
}
