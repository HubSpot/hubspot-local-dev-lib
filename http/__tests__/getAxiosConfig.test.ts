import { getConfig as __getConfig } from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import {
  getAxiosConfig,
  hostnameMatchesNoProxyPattern,
  shouldUseProxy,
} from '../getAxiosConfig';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
  it('disables axios built-in proxy handling', () => {
    getConfig.mockReturnValue({
      accounts: [],
    });

    const config = getAxiosConfig({ url });
    expect(config.proxy).toBe(false);
  });
});

describe('hostnameMatchesNoProxyPattern', () => {
  it('matches exact hostname', () => {
    expect(hostnameMatchesNoProxyPattern('localhost', 'localhost')).toBe(true);
    expect(
      hostnameMatchesNoProxyPattern('api.hubapi.com', 'api.hubapi.com')
    ).toBe(true);
  });

  it('matches wildcard *', () => {
    expect(hostnameMatchesNoProxyPattern('anything.com', '*')).toBe(true);
    expect(hostnameMatchesNoProxyPattern('localhost', '*')).toBe(true);
  });

  it('matches domain suffix with leading dot', () => {
    expect(hostnameMatchesNoProxyPattern('api.hubapi.com', '.hubapi.com')).toBe(
      true
    );
    expect(
      hostnameMatchesNoProxyPattern('foo.bar.hubapi.com', '.hubapi.com')
    ).toBe(true);
    expect(hostnameMatchesNoProxyPattern('hubapi.com', '.hubapi.com')).toBe(
      false
    );
  });

  it('matches domain suffix without leading dot', () => {
    expect(hostnameMatchesNoProxyPattern('api.hubapi.com', 'hubapi.com')).toBe(
      true
    );
    expect(hostnameMatchesNoProxyPattern('hubapi.com', 'hubapi.com')).toBe(
      true
    );
    expect(
      hostnameMatchesNoProxyPattern('foo.bar.hubapi.com', 'hubapi.com')
    ).toBe(true);
  });

  it('does not match partial hostnames', () => {
    expect(hostnameMatchesNoProxyPattern('nothubapi.com', 'hubapi.com')).toBe(
      false
    );
    expect(
      hostnameMatchesNoProxyPattern('api.nothubapi.com', 'hubapi.com')
    ).toBe(false);
  });

  it('is case insensitive', () => {
    expect(hostnameMatchesNoProxyPattern('API.HUBAPI.COM', 'hubapi.com')).toBe(
      true
    );
    expect(hostnameMatchesNoProxyPattern('api.hubapi.com', 'HUBAPI.COM')).toBe(
      true
    );
  });

  it('trims whitespace from pattern', () => {
    expect(hostnameMatchesNoProxyPattern('localhost', '  localhost  ')).toBe(
      true
    );
    expect(
      hostnameMatchesNoProxyPattern('api.hubapi.com', ' .hubapi.com ')
    ).toBe(true);
  });
});

describe('shouldUseProxy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns false when no proxy env vars are set', () => {
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(false);
  });

  it('returns true when HTTPS_PROXY is set', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns true when https_proxy is set', () => {
    process.env.https_proxy = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns true when HTTP_PROXY is set', () => {
    process.env.HTTP_PROXY = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns true when http_proxy is set', () => {
    process.env.http_proxy = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns true when ALL_PROXY is set', () => {
    process.env.ALL_PROXY = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns true when all_proxy is set', () => {
    process.env.all_proxy = 'http://proxy:8080';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('returns false when hostname matches NO_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '.hubapi.com';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(false);
  });

  it('returns false when hostname matches no_proxy', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.no_proxy = '.hubapi.com';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(false);
  });

  it('returns true when hostname does not match NO_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '.example.com';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(true);
  });

  it('handles multiple NO_PROXY entries', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = 'localhost,127.0.0.1,.hubapi.com';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(false);
    expect(shouldUseProxy('https://localhost')).toBe(false);
  });

  it('returns false when NO_PROXY is wildcard *', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '*';
    expect(shouldUseProxy('https://api.hubapi.com')).toBe(false);
    expect(shouldUseProxy('https://any.domain.com')).toBe(false);
  });
});

describe('getAxiosConfig proxy agents', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
    getConfig.mockReturnValue({ accounts: [] });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses standard agents when no proxy is configured', () => {
    const config = getAxiosConfig({ url });
    expect(config.httpsAgent).not.toBeInstanceOf(HttpsProxyAgent);
    expect(config.httpAgent).not.toBeInstanceOf(HttpProxyAgent);
  });

  it('uses proxy agents when HTTPS_PROXY is set', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    const config = getAxiosConfig({ url });
    expect(config.httpsAgent).toBeInstanceOf(HttpsProxyAgent);
  });

  it('uses proxy agents when HTTP_PROXY is set', () => {
    process.env.HTTP_PROXY = 'http://proxy:8080';
    const config = getAxiosConfig({ url });
    expect(config.httpsAgent).toBeInstanceOf(HttpsProxyAgent);
    expect(config.httpAgent).toBeInstanceOf(HttpProxyAgent);
  });

  it('uses standard agents when hostname matches NO_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '.hubapi.com';
    const config = getAxiosConfig({ url });
    expect(config.httpsAgent).not.toBeInstanceOf(HttpsProxyAgent);
    expect(config.httpAgent).not.toBeInstanceOf(HttpProxyAgent);
  });
});
