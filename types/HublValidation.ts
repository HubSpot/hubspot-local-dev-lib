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
};
