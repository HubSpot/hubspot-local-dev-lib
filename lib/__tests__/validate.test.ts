import fs, { Stats } from 'fs-extra';
import { validateHubl } from '../../api/validateHubl';
import { walk } from '../fs';
import { lint } from '../cms/validate';
import { LintResult, Validation } from '../../types/HublValidation';
import { HubSpotPromise } from '../../types/Http';

jest.mock('fs-extra');
jest.mock('../../api/validateHubl');
jest.mock('../fs');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedFsStat = fs.stat as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedFsReadFile = fs.readFile as jest.MockedFunction<any>;
const mockedWalk = walk as jest.MockedFunction<typeof walk>;
const mockedValidateHubl = validateHubl as jest.MockedFunction<
  typeof validateHubl
>;

const mockFsStats = jest.createMockFromModule<Stats>('fs-extra');

mockFsStats.isDirectory = jest.fn(() => true);

const mockValidation: Validation = {
  meta: {
    all_widgets: [],
    widgets_in_rich_text: [],
    editable_flex_areas: [],
    editable_layout_sections: null,
    email_style_settings: null,
    sms_flex_area: [],
    google_font_variations: null,
    custom_font_variations: [],
    has_style_tag: false,
    has_header_tag: false,
    output_html: '',
    has_menu_tag: false,
    has_theme_setting_function: false,
    template_source: '',
    attribute_defaults: null,
    template_errors: [],
    path_dependencies: [],
    theme_field_dependencies: [],
    template_type_ids: null,
    exact_path_references: [],
    required_scopes_to_render: [],
  },
  renderingErrors: [],
  html: '',
};

describe('lib/cms/validate', () => {
  const accountId = 123;
  const filePath = 'test.html';

  it('should return an empty array if directory has no files', async () => {
    mockedFsStat.mockResolvedValue(mockFsStats);
    mockedWalk.mockResolvedValue([]);

    const result = await lint(accountId, filePath);
    expect(result).toEqual([]);
  });

  it('should return the correct object if a file has no content', async () => {
    mockedFsStat.mockResolvedValue({ isDirectory: () => false });
    mockedFsReadFile.mockResolvedValue('  ');

    const result = await lint(accountId, filePath);
    expect(result).toEqual([{ file: filePath, validation: null }]);
  });

  it('should call validateHubl with the correct parameters', async () => {
    const mockSource = 'valid HUBL content';
    mockedFsStat.mockResolvedValue({ isDirectory: () => false });
    mockedFsReadFile.mockResolvedValue(mockSource);
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
    } as unknown as HubSpotPromise<Validation>);
    const result = await lint(accountId, filePath);
    expect(validateHubl).toHaveBeenCalledWith(accountId, mockSource);
    expect(result).toEqual([{ file: filePath, validation: mockValidation }]);
  });

  it('should filter out files with invalid extensions', async () => {
    const invalidFile = 'test.txt';
    mockedFsStat.mockResolvedValue({ isDirectory: () => true });
    mockedWalk.mockResolvedValue([invalidFile, filePath]);
    mockedFsReadFile.mockResolvedValue('valid HUBL content');
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
    } as unknown as HubSpotPromise<Validation>);

    const result = await lint(accountId, filePath);

    expect(result).toHaveLength(1);
    expect((result as Partial<LintResult>[])[0].file).toBe(filePath);
  });

  it('should execute callback if provided', async () => {
    const mockCallback = jest.fn();
    const mockSource = 'valid HUBL content';
    mockedFsStat.mockResolvedValue({ isDirectory: () => false });
    mockedFsReadFile.mockResolvedValue(mockSource);
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
    } as unknown as HubSpotPromise<Validation>);

    await lint(accountId, filePath, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith({
      file: filePath,
      validation: mockValidation,
    });
  });
});
