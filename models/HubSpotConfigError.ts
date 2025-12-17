import {
  HUBSPOT_CONFIG_ERROR_TYPES,
  HUBSPOT_CONFIG_OPERATIONS,
} from '../constants/config.js';
import {
  HubSpotConfigErrorType,
  HubSpotConfigOperation,
} from '../types/Config.js';
import { i18n } from '../utils/lang.js';

const NAME = 'HubSpotConfigError';

const OPERATION_TEXT = {
  [HUBSPOT_CONFIG_OPERATIONS.READ]: 'reading',
  [HUBSPOT_CONFIG_OPERATIONS.WRITE]: 'writing to',
  [HUBSPOT_CONFIG_OPERATIONS.DELETE]: 'deleting',
};

function isEnvironmentError(type: HubSpotConfigErrorType): boolean {
  return type === HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ENVIRONMENT_VARIABLES;
}

export class HubSpotConfigError extends Error {
  public type: HubSpotConfigErrorType;
  public operation: HubSpotConfigOperation;

  constructor(
    message: string | undefined,
    type: HubSpotConfigErrorType,
    operation: HubSpotConfigOperation,
    options?: ErrorOptions
  ) {
    const configType = isEnvironmentError(type)
      ? 'environment variables'
      : 'file';

    const operationText = OPERATION_TEXT[operation];

    const withBaseMessage = i18n('models.HubSpotConfigError.baseMessage', {
      configType,
      message: message ? `: ${message}` : '',
      operation: operationText,
    });

    super(withBaseMessage, options);
    this.name = NAME;
    this.type = type;
    this.operation = operation;
  }
}
