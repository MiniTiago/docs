---
title: "Kraken SDK authentication"
description: "Configure Kraken Spot credentials securely and verify read-only account access."
---

# Authentication

Public market data needs no API credentials. Private account queries and trading require credentials with the relevant permissions for the chosen product.

## Configure credentials

<<< @/../examples/authenticated-client.ts

Keep API credentials in a secure server-side environment, supplied through protected environment variables or a secret manager. Do not include them in source files or browser bundles. Creating a client alone does not verify access.

## Verify account access

The following example reads balances from a live Kraken Spot account. Use a Spot API key with permission to query funds. It does not place orders or transfer funds.

For local development, create a private `.env` file with your credentials. The values here are fictitious:

```dotenv
KRAKEN_API_KEY=kraken_example_key_7e2a9c # Your Spot API key
KRAKEN_API_SECRET=ZXhhbXBsZS1vbmx5LW5vdC1hLXJlYWwta2V5 # Your base64 API secret
```

Exclude `.env` from version control. Leave `KRAKENTRACE` unset because HTTP tracing can log signed requests.

Save this plain JavaScript example as `account.mjs`:

<<< @/../examples/account-state.ts{js}

With Node.js 24, run:

```sh
node --env-file=.env account.mjs
```

If the variables are already supplied by your server environment, run `node account.mjs`. A successful response prints `Account access verified.` and the number of returned balances. The balances themselves are available in `response.result`.

## Signing and permissions

The SDK signs requests and supplies the nonce. Keep requests using one API key coordinated across processes so they do not arrive with out-of-order nonces. Use separate credentials for independently running services where appropriate.

Match API permissions and IP restrictions to the operation. Private Spot WebSocket subscriptions also require the API key's WebSocket access permission; the SDK obtains and supplies the WebSocket token automatically.

[Private account updates](/guides/private-streams) · [Order validation](/guides/orders) · [Kraken authentication documentation](https://docs.kraken.com/api/docs/guides/spot-rest-auth/)
