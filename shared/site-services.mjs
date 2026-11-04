export const searchConsoleFile = 'google0fafc2e8f296be03.html';

export function analyticsAttributes(siteUrl, indexable) {
  if (!indexable) return undefined;
  const site = new URL(siteUrl);
  return {
    id: 'siebly-docs-analytics',
    src: `${site.pathname}analytics.js`,
    defer: '',
    'data-measurement-id': 'G-KQWZYX9C7R',
    'data-site-origin': site.origin,
    'data-site-base': site.pathname,
  };
}
