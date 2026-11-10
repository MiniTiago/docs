import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
let disposed = false;

function render(pageActive) {
  root.render(
    <StrictMode>
      <App pageActive={pageActive} />
    </StrictMode>,
  );
}

function dispose() {
  if (disposed) {
    return;
  }

  disposed = true;
  window.removeEventListener('pagehide', hide);
  window.removeEventListener('pageshow', show);
  root.unmount();
}

function hide(event) {
  if (event.persisted) {
    // Finish effect cleanup before the browser freezes this page.
    // Keep App mounted so its Stop/Start choice survives restoration.
    flushSync(() => render(false));
  } else {
    dispose();
  }
}

function show(event) {
  if (event.persisted && !disposed) {
    render(true);
  }
}

render(true);
window.addEventListener('pagehide', hide);
window.addEventListener('pageshow', show);

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
