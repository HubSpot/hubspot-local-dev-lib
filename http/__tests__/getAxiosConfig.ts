import { getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded } from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import { getAxiosConfig } from '../getAxiosConfig';

jest.mock('../../config');

const getAndLoadConfigIfNeeded =
  __getAndLoadConfigIfNeeded as jest.MockedFunction<
    typeof __getAndLoadConfigIfNeeded
  >;

const url = 'https://app.hubspot.com';

describe('getAxiosConfig', () => {
  it('constructs baseURL as expected based on environment', () => {
    getAndLoadConfigIfNeeded.mockReturnValue({
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
    getAndLoadConfigIfNeeded.mockReturnValue({
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
