# Runnable SDK examples

Each folder is a complete project. Open its README for prerequisites and run commands, or follow the linked guide from an empty directory.

## Hyperliquid

- [Node.js / JavaScript](./hyperliquid/node/)
- [Node.js / TypeScript](./hyperliquid/typescript/)
- [React](./hyperliquid/react/)
- [Vite (plain JavaScript)](./hyperliquid/vite/)
- [Next.js](./hyperliquid/next/)
- [React Native / Expo](./hyperliquid/expo/)
- [Bun](./hyperliquid/bun/)
- [Deno](./hyperliquid/deno/)

## Bybit

- [Node.js / JavaScript](./bybit/node/)
- [Node.js / TypeScript](./bybit/typescript/)
- [React](./bybit/react/)
- [Vite (plain JavaScript)](./bybit/vite/)
- [Next.js](./bybit/next/)
- [React Native / Expo](./bybit/expo/)
- [Bun](./bybit/bun/)
- [Deno](./bybit/deno/)

## Binance

- [Node.js / JavaScript](./binance/node/)
- [Node.js / TypeScript](./binance/typescript/)
- [React](./binance/react/)
- [Vite (plain JavaScript)](./binance/vite/)
- [Next.js](./binance/next/)
- [React Native / Expo](./binance/expo/)
- [Bun](./binance/bun/)
- [Deno](./binance/deno/)

## Maintaining these examples

Edit the maintained sources in `shared/environments/`, then run `npm run starters:generate` from the repository root. Run `npm run check:starters` to check without writing files. Regeneration updates known generated files and never deletes extra files or local build output. The check reports unexpected source files and stale folders for review.
