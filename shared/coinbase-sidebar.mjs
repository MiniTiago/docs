// Coinbase keeps the default path focused on Advanced Trade. Other product
// landing pages and REST classes show only their own family’s references.
export function coinbaseSidebar(sdk, groups) {
  const guideGroup = groups.find(group => group.items?.some(item => item.link === '/guides/market-data'));
  guideGroup.text = 'Advanced Trade';
  const setups = groups.find(group => group.items?.some(item => item.link === '/environments/node'));
  delete setups.collapsed;
  setups.text = 'Frameworks and runtimes (Advanced Trade)';
  const resources = groups.find(group => group.text === 'Resources');
  resources.items.find(item => item.link === '/compatibility').text = 'Runtime setup';
  const reference = groups.find(group => group.text === 'API reference');
  reference.items = [
    { text: 'Advanced Trade reference', link: '/reference' },
    { text: 'CBAdvancedTradeClient', link: '/api/classes/CBAdvancedTradeClient' },
    { text: 'Advanced Trade WebSocket subscriptions', link: '/api/classes/WebsocketClient' },
    { text: 'All SDK exports', link: '/api/' },
  ];
  const products = {
    text: 'Other Coinbase products', collapsed: true,
    items: [
      { text: 'Choose a product', link: '/products' },
      ...sdk.productGroups.map(product => ({ text: product.text, link: `/products/${product.slug}` })),
    ],
  };
  groups.splice(2, 0, products);
  const sidebar = { '/': groups };
  for (const product of sdk.productGroups) {
    const productSidebar = [
      { text: 'Coinbase products', items: [
        { text: 'Advanced Trade', link: '/' },
        { text: 'Choose another product', link: '/products' },
      ] },
      { text: product.text, items: [
        { text: 'Overview and setup', link: `/products/${product.slug}` },
        ...product.guides.map(([text, anchor]) => ({ text, link: `/products/${product.slug}#${anchor}` })),
      ] },
      { text: 'API reference', items: [
        ...product.clients.map(name => ({ text: name, link: `/api/classes/${name}` })),
        ...(product.slug === 'commerce' || product.slug === 'app' ? [] : [
          { text: 'Shared WebSocket client', link: '/api/classes/WebsocketClient' },
        ]),
      ] },
      { text: 'SDK resources', items: [
        { text: 'Node.js proxy configuration', link: '/guides/proxies' },
        { text: 'Advanced Trade runtime examples', link: '/compatibility' },
        { text: 'npm package', link: `https://www.npmjs.com/package/${sdk.packageName}` },
        { text: 'GitHub repository', link: sdk.repository },
      ] },
    ];
    sidebar[`/products/${product.slug}`] = productSidebar;
    for (const name of product.clients) sidebar[`/api/classes/${name}`] = productSidebar;
  }
  return sidebar;
}
