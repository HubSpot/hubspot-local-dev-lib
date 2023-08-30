export type HublValidationOptions = {
  is_available_for_new_content?: boolean;
  template_type?: string;
  template_path?: string;
  module_path?: string;
};

export type HubLValidationError = {
  reason: string;
  message: string;
  lineno: number;
  startPosition: number;
  categoryErrors: {
    fullName?: string;
    path?: string;
  };
  category: string;
  severity?: string;
};

export type LintResult = {
  file: string;
  validation: Validation;
};

export type Validation = {
  meta: {
    all_widgets: Array<string>;
    widgets_in_rich_text: Array<string>;
    editable_flex_areas: Array<string>;
    editable_layout_sections: { key: string } | null;
    email_style_settings: { key: string } | null;
    sms_flex_area: Array<string>;
    google_font_variations: { key: string } | null;
    custom_font_variations: Array<string>;
    has_style_tag: boolean;
    has_header_tag: boolean;
    output_html: string;
    has_menu_tag: boolean;
    has_theme_setting_function: boolean;
    template_source: string;
    attribute_defaults?: { key: string } | null;
    template_errors: Array<HubLValidationError>;
    path_dependencies: Array<string>;
    theme_field_dependencies: Array<string>;
    template_type_ids?: { key: string } | null;
    exact_path_references: Array<string>;
    required_scopes_to_render: Array<string>;
  };
  renderingErrors: Array<HubLValidationError>;
  html: string;
};
