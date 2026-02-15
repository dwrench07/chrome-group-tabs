export function getRegisteredDomain(hostname) {
  if (!hostname) return 'unknown';
  // treat IPv4 as domain
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname;
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  // small list of common 2nd-level TLDs; will replace with PSL later
  const secondLevelTLDs = new Set(['co.uk','com.au','co.jp','co.kr','gov.uk','ac.uk']);
  const lastTwo = parts.slice(-2).join('.');
  const lastThree = parts.slice(-3).join('.');
  if (secondLevelTLDs.has(lastTwo)) return lastThree;
  return lastTwo;
}
