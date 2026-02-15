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

// Format domain for tab group display (domain without extension, first letter capitalized)
export function formatDomainForDisplay(domain) {
  if (domain === 'unknown') return 'Unknown';
  // Extract the domain part (before the TLD)
  const parts = domain.split('.');
  if (parts.length === 0) return domain;
  // Take the first part and capitalize
  const mainPart = parts[0];
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1).toLowerCase();
}
