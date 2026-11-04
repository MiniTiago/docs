import path from 'node:path';
import { sourceCommentMarkup } from './markdown.mjs';
import { analyticsAttributes } from './site-services.mjs';

export default function siteConfig(data, docs) {
  const { sdk, siteUrl, originUrl, indexable, catalogue } = data;
  const site = new URL(siteUrl);
  const analytics = analyticsAttributes(originUrl, indexable, catalogue);
  const groups = [
    { text: 'Getting started', items: [
      { text: 'Introduction', link: '/' }, { text: 'Quickstart', link: '/getting-started' }, { text: 'Clients', link: '/clients' },
      { text: 'Runtime compatibility', link: '/compatibility' },
    ] },
    { text: 'Environments', items: [
      { text: 'Bun', link: '/environments/bun' },
      { text: 'Deno', link: '/environments/deno' },
      { text: 'Vite and browser', link: '/environments/vite' },
      { text: 'Next.js server', link: '/environments/next' },
      { text: 'React Native and Expo', link: '/environments/expo' },
    ] },
    { text: 'Guides', items: [
      { text: 'Market data', link: '/guides/market-data' },
      { text: 'WebSocket subscriptions', link: '/guides/websockets' },
      { text: 'Authentication', link: '/guides/authentication' },
    ] },
    { text: 'Using the SDK', items: [
      { text: 'Configuration', link: '/guides/configuration' }, { text: 'Error handling', link: '/guides/errors' },
      { text: 'Production usage', link: '/guides/production' }, { text: 'Troubleshooting', link: '/guides/troubleshooting' },
    ] },
    { text: 'API reference', items: [
      { text: 'Overview', link: '/reference' },
      ...sdk.clients.map((name) => ({ text: name, link: `/api/classes/${name}` })),
      { text: 'All exports', link: '/api/' },
    ] },
    { text: 'Resources', items: [
      { text: `${sdk.name} tutorial`, link: sdk.tutorial }, { text: 'Siebly SDKs', link: 'https://siebly.io/' },
      { text: 'GitHub repository', link: sdk.repository },
    ] },
  ];
  const pageUrl = (relative) => new URL(relative.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html'), site).href;
  return {
    title: `${sdk.name} SDK`, titleTemplate: ':title | Siebly Docs',
    description: `JavaScript and TypeScript documentation for the Siebly ${sdk.name} SDK.`,
    lang: 'en-GB', base: site.pathname,
    // GitHub Pages serves actual .html files. Do not rely on a fallback rewrite.
    cleanUrls: false, lastUpdated: false, srcExclude: ['**/typedoc-sidebar.json'],
    markdown: { config: sourceCommentMarkup },
    sitemap: indexable ? { hostname: site.origin, transformItems: (items) => items
      .filter((item) => !item.url.endsWith('404.html'))
      .map((item) => ({ ...item, url: new URL(item.url.replace(/^\//, ''), site).href })) } : undefined,
    head: [
      ...(analytics ? [['script', analytics]] : []),
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${site.pathname}favicon.svg` }],
      ['meta', { name: 'robots', content: indexable ? 'index,follow' : 'noindex,nofollow' }],
      ['meta', { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' }],
      ['meta', { name: 'theme-color', content: '#050505', media: '(prefers-color-scheme: dark)' }],
    ],
    themeConfig: {
      sdk, siteTitle: false,
      logo: { light: '/brand/siebly-wordmark-light.svg', dark: '/brand/siebly-wordmark-dark.svg', alt: 'Siebly documentation home', width: 98, height: 28 },
      nav: [
        { text: 'Documentation', link: '/', activeMatch: '^/(?!api|reference)' },
        { text: 'API reference', link: '/reference', activeMatch: '^/(api|reference)' },
        { text: 'SDKs', items: [
          { text: 'All SDKs', link: originUrl, target: '_self' },
          ...catalogue.map((entry) => ({ text: entry.name, link: new URL(`${entry.id}/`, originUrl).href, target: '_self' })),
        ] },
        { text: 'Siebly.io', link: sdk.website },
      ],
      // Full symbol catalogues live in All exports and search. Repeating every
      // type in every page's sidebar makes large SDK output grow quadratically.
      sidebar: groups,
      search: { provider: 'local', options: { detailedView: true } },
      socialLinks: [{ icon: 'github', link: sdk.repository }],
      outline: { level: [2, 3], label: 'On this page' },
      docFooter: { prev: 'Previous', next: 'Next' },
      footer: { message: 'Built by Siebly. Open source SDKs for exchange APIs.', copyright: sdk.license ? `${sdk.license} licensed SDK` : undefined },
    },
    transformPageData(page) {
      if (page.relativePath.startsWith('api/')) {
        const symbol = path.basename(page.relativePath, '.md');
        page.description = symbol === 'index'
          ? `Public clients, request parameters, responses and event types exported by ${sdk.packageName}.`
          : `${symbol} in the Siebly ${sdk.name} JavaScript and TypeScript SDK. Types and method signatures for version ${sdk.version}.`;
        page.frontmatter.pageClass = 'api-page';
      }
    },
    transformHead({ pageData }) {
      if (pageData.relativePath === '404.md') return [];
      const url = pageUrl(pageData.relativePath);
      const head = [
        ['meta', { property: 'og:title', content: pageData.title }],
        ['meta', { property: 'og:description', content: pageData.description }],
        ['meta', { property: 'og:type', content: 'article' }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { name: 'twitter:card', content: 'summary' }],
      ];
      if (indexable) head.push(
        ['link', { rel: 'canonical', href: url }],
        ['script', { type: 'application/ld+json' }, JSON.stringify({
          '@context': 'https://schema.org', '@type': 'TechArticle', headline: pageData.title,
          description: pageData.description, url,
          author: { '@type': 'Organization', name: 'Siebly', url: 'https://siebly.io/' },
          about: { '@type': 'SoftwareApplication', name: sdk.packageName, softwareVersion: sdk.version, applicationCategory: 'DeveloperApplication' },
        }).replace(/</g, '\\u003c')],
      );
      return head;
    },
  };
}
