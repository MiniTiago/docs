import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode><App /></StrictMode>);
const stop = () => root.unmount();
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener('pagehide', stop);
  stop();
});
