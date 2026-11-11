export default {
  name: 'Kraken',
  sourceDirectory: 'kraken-api',
  packageName: '@siebly/kraken-api',
  entryPoint: 'src/index.ts',
  tsconfig: 'tsconfig.json',
  clients: [
    'SpotClient',
    'DerivativesClient',
    'WebsocketClient',
    'WebsocketAPIClient',
  ],
  website: 'https://siebly.io/sdk/kraken/javascript',
  tutorial: 'https://siebly.io/sdk/kraken/javascript/tutorial',
  repository: 'https://github.com/sieblyio/kraken-api',
  referenceHelp: [
    {
      client: 'SpotClient',
      method: 'getTicker',
      example: 'first-call.ts',
      guide: '/getting-started',
      title: 'Read a public ticker',
    },
    {
      client: 'SpotClient',
      method: 'getOrderBook',
      example: 'order-book.ts',
      guide: '/guides/market-data',
      title: 'Read an order book',
    },
    {
      client: 'DerivativesClient',
      method: 'getTickers',
      example: 'futures-market-data.ts',
      guide: '/guides/market-data',
      title: 'Read Futures tickers',
    },
    {
      client: 'SpotClient',
      method: 'getAccountBalance',
      example: 'account-state.ts',
      guide: '/guides/authentication',
      title: 'Read account balances',
    },
    {
      client: 'SpotClient',
      method: 'submitOrder',
      guide: '/guides/orders',
      title: 'Order management',
    },
    {
      client: 'WebsocketClient',
      method: 'subscribe',
      example: 'stream.ts',
      guide: '/guides/websockets',
      title: 'Subscribe to market data',
    },
    {
      client: 'WebsocketClient',
      method: 'closeAll',
      guide: '/guides/production#shut-down-cleanly',
      title: 'Shut down cleanly',
    },
  ],
  guides: [
    {
      text: 'Order management',
      link: '/guides/orders',
    },
    {
      text: 'Private account updates (WebSocket)',
      link: '/guides/private-streams',
    },
    {
      text: 'WebSocket API requests',
      link: '/guides/websocket-api',
    },
  ],
  referenceExclude: [
    'src/AffiliateClient.ts',
    'src/types/request/affiliate.types.ts',
    'src/types/response/affiliate.types.ts',
  ],
};
