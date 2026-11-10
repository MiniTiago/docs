---
title: "Coinbase SDK runtime setup"
description: "Choose a Node.js, browser, framework or mobile project for Coinbase Advanced Trade."
---

# Runtime setup

Choose a project for your application. Each guide starts from an empty directory and includes the files, installation commands and a public Advanced Trade price example.

## Server-side JavaScript and TypeScript

- [Node.js / JavaScript](/environments/node): ES modules and CommonJS.
- [Node.js / TypeScript](/environments/typescript): a typed project with build and run commands.
- [Next.js](/environments/next): a Node.js Route Handler that keeps SDK calls on the server.
- [Bun](/environments/bun): npm dependencies and Bun scripts.
- [Deno](/environments/deno): npm dependencies and explicit runtime permissions.

Keep account credentials and authenticated requests on your server. The [authentication guide](/guides/authentication) explains CDP keys and account reads.

## Browser applications

The [React](/environments/react) and [Vite](/environments/vite) projects use public market data. Their configuration supplies EventEmitter and excludes the SDK's Node-only JWT signer. Keep that configuration with the examples. Never put private keys in a browser bundle.

REST access in a browser depends on Coinbase's CORS policy. If a request is blocked by CORS, call the SDK through a server route instead. A Vite development proxy is not a production server route.

## React Native and Expo

The [Expo guide](/environments/expo) includes the Metro resolver, public-auth helper and required polyfills. Keep those files together. The project uses public market data; authenticated operations belong on your server.

## Streaming lifecycle

Command-line streaming examples run until Ctrl+C. Browser and mobile examples expose a Stop control and clean up when their view is removed. Let the SDK reconnect after a connection loss; a reopened connection does not by itself restore application account state.

[WebSocket subscriptions](/guides/websockets) · [Private account updates](/guides/private-streams) · [Production usage](/guides/production)
