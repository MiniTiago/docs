import { readPrice, watchPrice } from './price.js';

const showError = error => { document.querySelector('#error').textContent = error.message || String(error); };
readPrice().then(price => { document.querySelector('#rest').textContent = price; }).catch(showError);
const stop = watchPrice(price => { document.querySelector('#live').textContent = price; }, showError);
document.querySelector('#stop').addEventListener('click', () => {
  stop();
  document.querySelector('#live').textContent = 'Stopped';
});
window.addEventListener('pagehide', stop, { once: true });
if (import.meta.hot) import.meta.hot.dispose(stop);
