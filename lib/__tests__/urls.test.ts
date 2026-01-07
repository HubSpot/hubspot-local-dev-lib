import { getHubSpotApiOrigin } from '../urls.js';

describe('lib/urls', () => {
  describe('getHubSpotApiOrigin()', () => {
    // Suggestion taken from stack overflow https://stackoverflow.com/a/48042799
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('gets qa url', () => {
      const url = getHubSpotApiOrigin('qa', false);

      expect(url).toBe('https://api.hubapiqa.com');
    });

    it('gets prod url', () => {
      const url = getHubSpotApiOrigin('prod', false);

      expect(url).toBe('https://api.hubapi.com');
    });

    it('gets qa local url', () => {
      const url = getHubSpotApiOrigin('qa', true);

      expect(url).toBe('https://local.hubapiqa.com');
    });

    it('gets prod local url', () => {
      const url = getHubSpotApiOrigin('prod', true);

      expect(url).toBe('https://local.hubapi.com');
    });

    it('gets qa override url', () => {
      process.env.HUBAPI_DOMAIN_OVERRIDE = 'api.hubspot';
      const url = getHubSpotApiOrigin('qa', false);

      expect(url).toBe('https://api.hubspotqa.com');
    });

    it('gets prod override url', () => {
      process.env.HUBAPI_DOMAIN_OVERRIDE = 'api.hubspot';
      const url = getHubSpotApiOrigin('prod', false);

      expect(url).toBe('https://api.hubspot.com');
    });

    it('ignores local argument when using override', () => {
      process.env.HUBAPI_DOMAIN_OVERRIDE = 'api.hubspot';
      const url = getHubSpotApiOrigin('qa', true);

      expect(url).toBe('https://api.hubspotqa.com');
    });
  });
});
