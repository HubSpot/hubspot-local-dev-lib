import { BaseError } from '../types/Error';

class HubSpotAuthError extends Error implements BaseError {}

export default HubSpotAuthError;
