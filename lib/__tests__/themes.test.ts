import findup from 'findup-sync';
import { getHubSpotWebsiteOrigin } from '../urls';
import { getThemeJSONPath, getThemePreviewUrl } from '../cms/themes'; // Adjust the path to your module
import { getEnv } from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';

jest.mock('findup-sync');
jest.mock('../urls');
jest.mock('../../config');
jest.mock('../../constants/environments', () => ({
  ENVIRONMENTS: {
    PROD: 'https://prod.hubspot.com',
    QA: 'https://qa.hubspot.com',
  },
}));

const mockedFindup = findup as jest.MockedFunction<typeof findup>;
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>;
const mockedGetHubSpotWebsiteOrigin =
  getHubSpotWebsiteOrigin as jest.MockedFunction<
    typeof getHubSpotWebsiteOrigin
  >;

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
    mockedFindup.mockReturnValue('/path/to/theme.json');
    mockedGetEnv.mockReturnValue('prod');
    mockedGetHubSpotWebsiteOrigin.mockReturnValue('https://prod.hubspot.com');

    const result = getThemePreviewUrl('/path/to/file', 12345);

    expect(getEnv).toHaveBeenCalledWith(12345);
    expect(getHubSpotWebsiteOrigin).toHaveBeenCalledWith(ENVIRONMENTS.PROD);
    expect(result).toBe(
      'https://prod.hubspot.com/theme-previewer/12345/edit/to'
    );
  });

  it('should return the correct theme preview URL for QA environment', () => {
    mockedFindup.mockReturnValue('/path/to/theme.json');
    mockedGetEnv.mockReturnValue('qa');
    mockedGetHubSpotWebsiteOrigin.mockReturnValue('https://qa.hubspot.com');

    const result = getThemePreviewUrl('/path/to/file', 12345);

    expect(getEnv).toHaveBeenCalledWith(12345);
    expect(getHubSpotWebsiteOrigin).toHaveBeenCalledWith(ENVIRONMENTS.QA);
    expect(result).toBe('https://qa.hubspot.com/theme-previewer/12345/edit/to');
  });

  it('should return undefined if theme.json is not found', () => {
    mockedFindup.mockReturnValue(null);

    const result = getThemePreviewUrl('/invalid/path', 12345);

    expect(result).toBeUndefined();
  });
});
