export default {
  name: 'Coinbase',
  sourceDirectory: 'coinbase-api',
  packageName: 'coinbase-api',
  entryPoint: 'src/index.ts',
  tsconfig: 'tsconfig.json',
  compatibilityPage: 'authored',
  clients: [
    'CBAdvancedTradeClient',
    'CBAdvancedTradeGlobalClient',
    'CBAppClient',
    'CBCommerceClient',
    'CBExchangeClient',
    'CBInternationalClient',
    'CBPrimeClient',
    'WebsocketClient',
    'WebsocketAPIClient',
  ],
  website: 'https://siebly.io/sdk/coinbase/javascript',
  tutorial: 'https://siebly.io/sdk/coinbase/javascript/tutorial',
  repository: 'https://github.com/sieblyio/coinbase-api',
  referenceHelp: [
    { client: 'CBAdvancedTradeClient', method: 'getPublicProduct', guide: '/getting-started', title: 'Read an Advanced Trade public price' },
    { client: 'CBAdvancedTradeClient', method: 'getPublicProductBook', guide: '/guides/market-data', title: 'Read the public order book' },
    { client: 'CBAdvancedTradeClient', method: 'getAccounts', guide: '/guides/authentication', title: 'Read authenticated account balances' },
    { client: 'CBAdvancedTradeClient', method: 'getApiKeyPermissions', guide: '/guides/authentication', title: 'Check API key permissions' },
    ...['previewOrder', 'submitOrder', 'getOrder', 'getOrders', 'getFills', 'cancelOrders'].map(method => ({
      client: 'CBAdvancedTradeClient', method, guide: '/guides/orders', title: 'Order management',
    })),
    { client: 'WebsocketClient', method: 'subscribe', guide: '/guides/websockets', title: 'Advanced Trade subscriptions' },
    { client: 'CBAdvancedTradeGlobalClient', method: 'getInstruments', guide: '/products/global', title: 'Advanced Trade Global market data' },
    { client: 'WebsocketAPIClient', method: 'getTime', guide: '/products/global', title: 'Advanced Trade Global WebSocket API' },
  ],
  referenceDescriptions: {
    CBCommerceClient: 'REST client for Coinbase Commerce charges and checkouts.',
  },
  referenceExcludeProperties: ['affiliate_promotion_fee', 'referrer_id'],
  guides: [
    { text: 'Order management', link: '/guides/orders' },
    { text: 'Private account updates', link: '/guides/private-streams' },
  ],
  productGroups: [
    {
      text: 'Advanced Trade Global', slug: 'global', clients: ['CBAdvancedTradeGlobalClient', 'WebsocketAPIClient'],
      guides: [
        ['Public REST', 'market-data'], ['Public subscriptions', 'public-streams'],
        ['Account state and orders', 'orders'], ['Private account updates', 'private-streams'],
        ['WebSocket API', 'ws-api'], ['Errors and recovery', 'errors'],
      ],
    },
    {
      text: 'Exchange', slug: 'exchange', clients: ['CBExchangeClient'],
      guides: [
        ['Public REST', 'market-data'], ['Public subscriptions', 'public-streams'],
        ['Authentication', 'authentication'], ['Account state', 'account-state'],
        ['Order management', 'orders'], ['Private account updates', 'private-streams'], ['Sandbox', 'environments'],
      ],
    },
    {
      text: 'International Exchange', slug: 'international', clients: ['CBInternationalClient'],
      guides: [
        ['Public REST', 'market-data'], ['Authentication', 'authentication'],
        ['Market subscriptions', 'public-streams'], ['Account state', 'account-state'],
        ['Order management', 'orders'], ['Sandbox', 'environments'],
      ],
    },
    {
      text: 'Prime', slug: 'prime', clients: ['CBPrimeClient'],
      guides: [
        ['Authentication', 'authentication'], ['Account state', 'account-state'],
        ['Market subscriptions', 'public-streams'], ['Order management', 'orders'], ['Custody', 'custody'],
      ],
    },
    {
      text: 'App', slug: 'app', clients: ['CBAppClient'],
      guides: [
        ['Public prices', 'market-data'], ['Authentication', 'authentication'], ['Account state', 'account-state'],
        ['Transactions', 'transactions'], ['Transfers', 'transfers'],
      ],
    },
    {
      text: 'Commerce', slug: 'commerce', clients: ['CBCommerceClient'],
      guides: [
        ['Authentication', 'authentication'], ['Read charges', 'charges'], ['Payment state', 'payment-state'],
        ['Payment events', 'events'], ['Create payments', 'payments'],
      ],
    },
  ],
};
