import { fetchScopeAuthorizationData } from '../../api/localDevAuth.js';
import { ScopeGroupAuthorization } from '../../types/Accounts.js';

export async function authorizedScopesForPortalAndUser(
  accountId: number
): Promise<Array<ScopeGroupAuthorization>> {
  return (await fetchScopeAuthorizationData(accountId)).data.results;
}
