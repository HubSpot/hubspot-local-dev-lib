export class HubSpotAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HubSpotAuthError';
  }
}
