import {fileURLToPath} from 'node:url';

export default {
  resolve: {
    alias: {
      events: fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
    },
  },
};
