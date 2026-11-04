import {fileURLToPath} from 'node:url';

const utilDirectory = fileURLToPath(new URL('./node_modules/binance/lib/util/', import.meta.url));

export default {
  resolve: {
    alias: {
      events: fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
    },
  },
  plugins: [{
    name: 'binance-browser-support',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './node-support' && importer?.startsWith(utilDirectory)) {
        return utilDirectory + 'browser-support.js';
      }
    },
  }],
};
