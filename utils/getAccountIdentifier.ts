type Account = {
  portalId?: number;
  accountId?: number;
};

export function getAccountIdentifier(account: Account): number | undefined {
  if (Object.hasOwn(account, 'portalId')) {
    return account.portalId;
  } else if (Object.hasOwn(account, 'accountId')) {
    return account.accountId;
  }
}
