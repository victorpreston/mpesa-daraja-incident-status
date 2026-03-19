import { DarajaEndpoint } from './types';

const ENDPOINT_MAP: Array<[string, DarajaEndpoint]> = [
  ['stkpush', 'stk-push'],
  ['accountbalance', 'account-balance'],
  ['transactionstatus', 'transaction-status'],
  ['reversal', 'reversal'],
  ['b2c', 'b2c'],
  ['c2b', 'c2b'],
  ['oauth', 'oauth'],
];

export function detectEndpoint(url: string): DarajaEndpoint {
  const lower = url.toLowerCase();
  for (const [pattern, name] of ENDPOINT_MAP) {
    if (lower.includes(pattern)) return name;
  }
  return 'unknown';
}

export function isSafaricomUrl(url: string): boolean {
  return url.includes('safaricom.co.ke');
}

export function detectEnvironment(url: string): 'sandbox' | 'production' {
  return url.includes('sandbox') ? 'sandbox' : 'production';
}
