import { getConfig as __getConfig } from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import { getAxiosConfig } from '../getAxiosConfig';

jest.mock('../../config');

const getConfig = __getConfig as jest.MockedFunction<typeof __getConfig>;

const url = 'https://app.hubspot.com';

describe('http/getAxiosConfig', () => {
  it('constructs baseURL as expected based on environment', () => {
    getConfig.mockReturnValue({
      accounts: [],
    });

    expect(getAxiosConfig({ url })).toMatchObject({
      baseURL: 'https://api.hubapi.com',
    });
    expect(getAxiosConfig({ url, env: ENVIRONMENTS.QA })).toMatchObject({
      baseURL: 'https://api.hubapiqa.com',
    });
  });
  it('supports httpUseLocalhost config option to construct baseURL for local HTTP services', () => {
    getConfig.mockReturnValue({
      httpUseLocalhost: true,
      accounts: [],
    });

    expect(getAxiosConfig({ url })).toMatchObject({
      baseURL: 'https://local.hubapi.com',
    });
    expect(getAxiosConfig({ url, env: ENVIRONMENTS.QA })).toMatchObject({
      baseURL: 'https://local.hubapiqa.com',
    });
  });
});
