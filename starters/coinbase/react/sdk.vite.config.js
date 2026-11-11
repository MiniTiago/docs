import { fileURLToPath } from 'node:url';

// Public market data only. Coinbase's JWT helper imports Node crypto eagerly.
// Keep credentialed calls on a Node.js server rather than bundling private keys.
const publicAuth = '\0coinbase-public-auth';
const sdkRoot = fileURLToPath(new URL('./node_modules/coinbase-api/', import.meta.url));
export default {
  // Keep SDK modules in Vite's transform pipeline so the JWT replacement also
  // applies during development. Prebundle its CommonJS browser dependencies.
  optimizeDeps: {
    exclude: ['coinbase-api'],
    include: ['events', 'coinbase-api > isomorphic-ws'],
  },
  resolve: {
    alias: {
      events: fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
    },
  },
  plugins: [{
    name: 'coinbase-public-market-data',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source.endsWith('/jwtNode.js') && importer?.startsWith(sdkRoot)) {
        return publicAuth;
      }
    },
    load(id) {
      if (id === publicAuth) {
        return `export function signJWT() { throw new Error('JWT signing is server-only in this public market-data starter.'); }
export const signWSJWT = signJWT;`;
      }
    },
  }],
};
