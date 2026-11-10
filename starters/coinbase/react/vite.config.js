import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sdkConfig from './sdk.vite.config.js';

export default mergeConfig(sdkConfig, {
  plugins: [react()],
});
