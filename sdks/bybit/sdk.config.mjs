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
    },
    {
      "client": "RestClientV5",
      "method": "getWalletBalance",
      "example": "account-state.ts",
      "guide": "/guides/authentication#verify-account-access",
      "title": "Verify Testnet account access"
    },
    {
      "client": "RestClientV5",
      "method": "submitOrder",
      "guide": "/guides/orders",
      "title": "Place and cancel a Testnet order"
    },
    {
      "client": "RestClientV5",
      "method": "getActiveOrders",
      "guide": "/guides/orders",
      "title": "Manage a Testnet order"
    },
    {
      "client": "RestClientV5",
      "method": "getHistoricOrders",
      "guide": "/guides/orders",
      "title": "Manage a Testnet order"
    },
    {
      "client": "RestClientV5",
      "method": "cancelOrder",
      "guide": "/guides/orders",
      "title": "Manage a Testnet order"
    },
    {
      "client": "WebsocketClient",
      "method": "subscribeV5",
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
