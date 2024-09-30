import { GenericAccount } from '../types/Accounts';

export function getAccountIdentifier(
  account?: GenericAccount | null
): number | undefined {
  if (!account) {
    return undefined;
  } else if (Object.hasOwn(account, 'portalId')) {
    return account.portalId;
  } else if (Object.hasOwn(account, 'accountId')) {
    return account.accountId;
  }
}
