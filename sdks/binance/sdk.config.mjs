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
      "title": "Place and cancel a Testnet order"
    },
    {
      "client": "MainClient",
      "method": "getOrder",
      "guide": "/guides/orders",
      "title": "Query and cancel a Testnet order"
    },
    {
      "client": "MainClient",
      "method": "cancelOrder",
      "guide": "/guides/orders",
      "title": "Query and cancel a Testnet order"
    },
    {
      "client": "WebsocketAPIClient",
      "method": "subscribeUserDataStream",
      "guide": "/guides/private-streams",
      "title": "Receive private order updates"
    }
  ],
  "guides": [
    {
      "text": "Place and cancel an order",
      "link": "/guides/orders"
    },
    {
      "text": "Private order updates",
      "link": "/guides/private-streams"
    }
  ]
};
