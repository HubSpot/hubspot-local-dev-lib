import findup from 'findup-sync';
import { vi, MockedFunction } from 'vitest';
import { getHubSpotWebsiteOriginByAccountId } from '../urls.js';
import { getThemeJSONPath, getThemePreviewUrl } from '../cms/themes.js';

vi.mock('findup-sync');
vi.mock('../urls');

const mockedFindup = findup as MockedFunction<typeof findup>;
const mockedGetBaseUrl = getHubSpotWebsiteOriginByAccountId as MockedFunction<typeof getHubSpotWebsiteOriginByAccountId>;

describe('lib/cms/themes', () => {
  describe('getThemeJSONPath', () => {
    it('should return the theme.json path if found', () => {
      mockedFindup.mockReturnValue('/path/to/theme.json');

      const result = getThemeJSONPath('/some/path');

      expect(findup).toHaveBeenCalledWith('theme.json', {
        cwd: '/some/path',
        nocase: true,
      });
      expect(result).toBe('/path/to/theme.json');
    });

    it('should return null if theme.json is not found', () => {
      mockedFindup.mockReturnValue(null);

      const result = getThemeJSONPath('/some/path');

      expect(findup).toHaveBeenCalledWith('theme.json', {
        cwd: '/some/path',
        nocase: true,
      });
      expect(result).toBeNull();
    });
  });

  describe('getThemePreviewUrl', () => {
    it('should return the correct theme preview URL for PROD environment', () => {
      mockedFindup.mockReturnValue('/src/my-theme/theme.json');
      mockedGetBaseUrl.mockReturnValue('https://app.hubspot.com');

      const result = getThemePreviewUrl('/path/to/file', 12345);

      expect(getHubSpotWebsiteOriginByAccountId).toHaveBeenCalledWith(12345);
      expect(result).toBe(
        'https://app.hubspot.com/theme-previewer/12345/edit/my-theme'
      );
    });

    it('should return the correct theme preview URL for QA environment', () => {
      mockedFindup.mockReturnValue('/src/my-theme/theme.json');
      mockedGetBaseUrl.mockReturnValue('https://app.hubspotqa.com');

      const result = getThemePreviewUrl('/path/to/file', 12345);

      expect(getHubSpotWebsiteOriginByAccountId).toHaveBeenCalledWith(12345);
      expect(result).toBe(
        'https://app.hubspotqa.com/theme-previewer/12345/edit/my-theme'
      );
    });

    it('should return undefined if theme.json is not found', () => {
      mockedFindup.mockReturnValue(null);

      const result = getThemePreviewUrl('/invalid/path', 12345);

      expect(result).toBeUndefined();
    });
  });
});
