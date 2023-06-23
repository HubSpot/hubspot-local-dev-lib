import http from '../../http';

export async function fetchScopeData(accountId: number, scopeGroup: string) {
  return http.get(accountId, {
    uri: `localdevauth/v1/auth/check-scopes`,
    query: {
      scopeGroup,
    },
  });
}
