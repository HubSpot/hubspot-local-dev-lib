import findup from 'findup-sync';
import { vi, MockedFunction } from 'vitest';
import { getHubSpotWebsiteOrigin } from '../urls.js';
import { getThemeJSONPath, getThemePreviewUrl } from '../cms/themes.js';
import { getConfigAccountEnvironment } from '../../config/index.js';
import { ENVIRONMENTS } from '../../constants/environments.js';

vi.mock('findup-sync');
vi.mock('../urls');
vi.mock('../../config');
vi.mock('../../constants/environments', () => ({
  ENVIRONMENTS: {
    PROD: 'https://prod.hubspot.com',
    QA: 'https://qa.hubspot.com',
  },
}));

const mockedFindup = findup as MockedFunction<typeof findup>;
const mockedGetConfigAccountEnvironment =
  getConfigAccountEnvironment as MockedFunction<
    typeof getConfigAccountEnvironment
  >;
const mockedGetHubSpotWebsiteOrigin = getHubSpotWebsiteOrigin as MockedFunction<
  typeof getHubSpotWebsiteOrigin
>;

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
      mockedGetConfigAccountEnvironment.mockReturnValue('prod');
      mockedGetHubSpotWebsiteOrigin.mockReturnValue('https://prod.hubspot.com');

      const result = getThemePreviewUrl('/path/to/file', 12345);

      expect(getConfigAccountEnvironment).toHaveBeenCalledWith(12345);
      expect(getHubSpotWebsiteOrigin).toHaveBeenCalledWith(ENVIRONMENTS.PROD);
      expect(result).toBe(
        'https://prod.hubspot.com/theme-previewer/12345/edit/my-theme'
      );
    });

    it('should return the correct theme preview URL for QA environment', () => {
      mockedFindup.mockReturnValue('/src/my-theme/theme.json');
      mockedGetConfigAccountEnvironment.mockReturnValue('qa');
      mockedGetHubSpotWebsiteOrigin.mockReturnValue('https://qa.hubspot.com');

      const result = getThemePreviewUrl('/path/to/file', 12345);

      expect(getConfigAccountEnvironment).toHaveBeenCalledWith(12345);
      expect(getHubSpotWebsiteOrigin).toHaveBeenCalledWith(ENVIRONMENTS.QA);
      expect(result).toBe(
        'https://qa.hubspot.com/theme-previewer/12345/edit/my-theme'
      );
    });

    it('should return undefined if theme.json is not found', () => {
      mockedFindup.mockReturnValue(null);

      const result = getThemePreviewUrl('/invalid/path', 12345);

      expect(result).toBeUndefined();
    });
  });
});
