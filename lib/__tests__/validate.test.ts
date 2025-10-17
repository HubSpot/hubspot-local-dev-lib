/* eslint-disable @typescript-eslint/no-explicit-any */
import fs, { Stats } from 'fs-extra';
import { validateHubl } from '../../api/validateHubl.js';
import { walk } from '../fs.js';
import { lint } from '../cms/validate.js';
import { LintResult, Validation } from '../../types/HublValidation.js';
import { vi } from 'vitest';

vi.mock('fs-extra');
vi.mock('../../api/validateHubl');
vi.mock('../fs');

const mockedFsStat = vi.mocked(fs.stat);
const mockedFsReadFile = vi.mocked(fs.readFile);
const mockedWalk = vi.mocked(walk);
const mockedValidateHubl = vi.mocked(validateHubl);

const mockFsStats = {
  isDirectory: vi.fn(() => true),
} as unknown as Stats;

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
    mockedFsStat.mockResolvedValue(mockFsStats as any);
    mockedWalk.mockResolvedValue([]);

    const result = await lint(accountId, filePath);
    expect(result).toEqual([]);
  });

  it('should return the correct object if a file has no content', async () => {
    mockedFsStat.mockResolvedValue({ isDirectory: () => false } as any);
    mockedFsReadFile.mockResolvedValue('  ' as any);

    const result = await lint(accountId, filePath);
    expect(result).toEqual([{ file: filePath, validation: null }]);
  });

  it('should call validateHubl with the correct parameters', async () => {
    const mockSource = 'valid HUBL content';
    mockedFsStat.mockResolvedValue({ isDirectory: () => false } as any);
    mockedFsReadFile.mockResolvedValue(mockSource as any);
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
      status: 200,
      statusText: 'OK',
      headers: {} as any,
      config: { headers: {} } as any,
    });
    const result = await lint(accountId, filePath);
    expect(validateHubl).toHaveBeenCalledWith(accountId, mockSource);
    expect(result).toEqual([{ file: filePath, validation: mockValidation }]);
  });

  it('should filter out files with invalid extensions', async () => {
    const invalidFile = 'test.txt';
    mockedFsStat.mockResolvedValue({ isDirectory: () => true } as any);
    mockedWalk.mockResolvedValue([invalidFile, filePath]);
    mockedFsReadFile.mockResolvedValue('valid HUBL content' as any);
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
      status: 200,
      statusText: 'OK',
      headers: {} as any,
      config: { headers: {} } as any,
    });

    const result = await lint(accountId, filePath);

    expect(result).toHaveLength(1);
    expect((result as Partial<LintResult>[])[0].file).toBe(filePath);
  });

  it('should execute callback if provided', async () => {
    const mockCallback = vi.fn();
    const mockSource = 'valid HUBL content';
    mockedFsStat.mockResolvedValue({ isDirectory: () => false } as any);
    mockedFsReadFile.mockResolvedValue(mockSource as any);
    mockedValidateHubl.mockResolvedValue({
      data: mockValidation,
      status: 200,
      statusText: 'OK',
      headers: {} as any,
      config: { headers: {} } as any,
    });

    await lint(accountId, filePath, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith({
      file: filePath,
      validation: mockValidation,
    });
  });
});
