export default {
  "name": "Bybit",
  "sourceDirectory": "bybit-api",
  "packageName": "bybit-api",
  "entryPoint": "src/index.ts",
  "tsconfig": "tsconfig.build.json",
  "clients": [
    "RestClientV5",
    "WebsocketClient",
    "WebsocketAPIClient"
  ],
  "website": "https://siebly.io/sdk/bybit/javascript",
  "tutorial": "https://siebly.io/sdk/bybit/javascript/tutorial",
  "repository": "https://github.com/sieblyio/bybit-api",
  "referenceHelp": [
    {
      "client": "RestClientV5",
      "method": "getTickers",
      "example": "first-call.ts",
      "guide": "/getting-started",
      "title": "Quickstart"
    },
    {
      "client": "RestClientV5",
      "method": "getOrderbook",
      "example": "order-book.ts",
      "guide": "/guides/market-data",
      "title": "Read an order book"
    },
    {
      "client": "WebsocketClient",
      "method": "subscribeV5",
      "example": "stream.ts",
      "guide": "/guides/websockets",
      "title": "Subscribe to market data"
    },
    {
      "client": "WebsocketClient",
      "method": "closeAll",
      "guide": "/guides/production#shut-down-cleanly",
      "title": "Shut down cleanly"
    }
  ]
};
