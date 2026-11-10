---
title: "Coinbase SDK authentication"
description: "Configure CDP keys for Advanced Trade and distinguish other Coinbase credential types."
---

# Authentication

The SDK signs requests for you. Keep secrets on your server, grant only the permissions the application needs, and use IP restrictions where available. Never put private keys into browser bundles, source control or logs.

## Advanced Trade credentials

Use a CDP API key name and its private key, not an account password. An ECDSA key is the straightforward choice for Advanced Trade. Preserve the complete PEM, including its header, footer and newlines.

Set `COINBASE_API_KEY` and `COINBASE_API_SECRET` in your environment, then save this as `authenticated-client.ts`:

<<< @/../examples/authenticated-client.ts

The REST client also accepts `cdpApiKey: { name, privateKey }`, matching the exported CDP JSON fields. This is a REST option; `WebsocketClient` expects `apiKey` and `apiSecret` separately. The REST client normalizes literal `\n` sequences in the secret. The WebSocket client does not; the private-stream example normalizes these explicitly before passing the key.

The signer supports ECDSA PEM and supported base64 Ed25519 formats. That does not establish that every Coinbase product or endpoint accepts both key types. Use the key type required by the API family; do not infer support from successful local signing.

## Run authenticated examples

Create a private `.env` file, exclude it from source control, and add your key name and complete private key:

```dotenv
COINBASE_API_KEY=organizations/your-organization/apiKeys/your-key
COINBASE_API_SECRET="your-full-PEM-private-key-with-\n-line-breaks"
```

Use actual credentials in your local file, never in shared code. The values above are placeholders. In the actual local value, retain the complete original PEM header, footer and line breaks, using escaped `\n` where needed. For examples with the local `authenticated-client.js` import, install TypeScript and compile both files into a separate output directory:

```sh
npm install --save-dev typescript @types/node
npx tsc authenticated-client.ts account-state.ts --module nodenext --target es2022 --outDir compiled
node --env-file=.env compiled/account-state.js
```

For the preview, include `preview-order.ts` in that compile command and run `compiled/preview-order.js`. Standalone stream examples can run directly with Node.js 24 and `node --env-file=.env private-stream.ts`.

## Verify read access

Save this as `account-state.ts` alongside `authenticated-client.ts`, then use the compile and run commands above:

<<< @/../examples/account-state.ts

Check the returned permissions before enabling trading. `getAccounts()` is paginated: follow `cursor` while `has_next` is true when loading all accounts. Never assume one page represents the whole account.

## Keep product credentials separate

This setup is for Advanced Trade. For another product's keys and account identifiers, follow its [own authentication guide](/products). An API passphrase is not needed by this client.

## Troubleshooting signing

Check the full key name, private-key format, permissions, environment and system clock. Advanced Trade JWT lifetime defaults to 120 seconds; increasing it is not a substitute for correcting clock drift. If credentials are accidentally exposed, revoke and replace them.

[Configuration](/guides/configuration) · [Private streams](/guides/private-streams) · [API families](/products)
