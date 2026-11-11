export default {
  "name": "Binance",
  "sourceDirectory": "binance",
  "packageName": "binance",
  "entryPoint": "src/index.ts",
  "tsconfig": "tsconfig.json",
  "clients": [
    "MainClient",
    "USDMClient",
    "CoinMClient",
    "PortfolioClient",
    "WebsocketClient",
    "WebsocketAPIClient"
  ],
  "website": "https://siebly.io/sdk/binance/javascript",
  "tutorial": "https://siebly.io/sdk/binance/javascript/tutorial",
  "repository": "https://github.com/sieblyio/binance",
  "referenceHelp": [
    {
      "client": "MainClient",
      "method": "getSymbolPriceTicker",
      "example": "first-call.ts",
      "guide": "/getting-started",
      "title": "Quickstart"
    },
    {
      "client": "MainClient",
      "method": "getOrderBook",
      "example": "order-book.ts",
      "guide": "/guides/market-data",
      "title": "Read an order book"
    },
    {
      "client": "WebsocketClient",
      "method": "subscribeSpotSymbol24hrTicker",
      "example": "stream.ts",
      "guide": "/guides/websockets",
      "title": "Subscribe to market data"
    },
    {
      "client": "WebsocketClient",
      "method": "closeAll",
      "guide": "/guides/production#shut-down-cleanly",
      "title": "Shut down cleanly"
    },
    {
      "client": "MainClient",
      "method": "getAccountInformation",
      "example": "account-state.ts",
      "guide": "/guides/authentication#verify-account-access",
      "title": "Verify Testnet account access"
    },
    {
      "client": "MainClient",
      "method": "submitNewOrder",
      "guide": "/guides/orders",
      "title": "Order management"
    },
    {
      "client": "MainClient",
      "method": "getOrder",
      "guide": "/guides/orders",
      "title": "Manage a Testnet order"
    },
    {
      "client": "MainClient",
      "method": "cancelOrder",
      "guide": "/guides/orders",
      "title": "Manage a Testnet order"
    },
    {
      "client": "WebsocketAPIClient",
      "method": "subscribeUserDataStream",
      "guide": "/guides/private-streams",
      "title": "Receive private order updates"
    },
    {
      "client": "USDMClient",
      "method": "getAccountInformationV3",
      "example": "usdm-account.ts",
      "guide": "/guides/usdm-orders#read-account-state",
      "title": "Read futures account state"
    },
    {
      "client": "USDMClient",
      "method": "getBalanceV3",
      "example": "usdm-account.ts",
      "guide": "/guides/usdm-orders#read-account-state",
      "title": "Read futures account state"
    },
    {
      "client": "USDMClient",
      "method": "getPositionsV3",
      "example": "usdm-account.ts",
      "guide": "/guides/usdm-orders#read-account-state",
      "title": "Read futures account state"
    },
    {
      "client": "USDMClient",
      "method": "submitNewOrder",
      "guide": "/guides/usdm-orders",
      "title": "USD-M futures order management"
    },
    {
      "client": "USDMClient",
      "method": "getOrder",
      "guide": "/guides/usdm-orders",
      "title": "USD-M futures order management"
    },
    {
      "client": "USDMClient",
      "method": "cancelOrder",
      "guide": "/guides/usdm-orders",
      "title": "USD-M futures order management"
    }
  ],
  "guides": [
    {
      "text": "Order management",
      "link": "/guides/orders"
    },
    {
      "text": "USD-M futures order management",
      "link": "/guides/usdm-orders"
    },
    {
      "text": "Private account updates (WebSocket)",
      "link": "/guides/private-streams"
    },
    {
      "text": "WebSocket API requests",
      "link": "/guides/websocket-api"
    }
  ]
};
