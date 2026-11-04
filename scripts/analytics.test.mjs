import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { analyticsAttributes } from '../shared/site-services.mjs';

const script = await readFile(new URL('../shared/public/analytics.js', import.meta.url), 'utf8');
const siteUrl = 'https://sieblyio.github.io/docs/';

function browser(url) {
  const attributes = analyticsAttributes(siteUrl, true);
  const scripts = [];
  const window = { dataLayer: [['existing-event']] };
  const context = vm.createContext({
    window,
    location: new URL(url),
    document: {
      currentScript: { dataset: {
        measurementId: attributes['data-measurement-id'],
        siteOrigin: attributes['data-site-origin'],
        siteBase: attributes['data-site-base'],
      } },
      getElementById: (id) => scripts.find((entry) => entry.id === id),
      createElement: () => ({}),
      head: { appendChild: (entry) => scripts.push(entry) },
    },
  });
  return { scripts, window, run: () => vm.runInContext(script, context) };
}

test('production pages initialize the shared Analytics stream once without waiting for input', () => {
  for (const page of ['', 'bybit/', 'binance/api/index.html', 'hyperliquid/clients.html', '404.html']) {
    const app = browser(siteUrl + page);
    app.run();
    app.run();
    assert.equal(app.scripts.length, 1);
    assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-KQWZYX9C7R');
    assert.equal(app.scripts[0].async, true);
    assert.equal(app.window.dataLayer[0][0], 'existing-event');
    const config = app.window.dataLayer.filter((entry) => entry[0] === 'config');
    assert.equal(config.length, 1);
    assert.equal(config[0][1], 'G-KQWZYX9C7R');
    assert.equal(config[0][2].content_group, 'Documentation');
    assert.equal(config[0][2].send_page_view, undefined);
    assert.equal(app.window.dataLayer.some((entry) => entry[0] === 'event'), false);
  }
});

test('preview builds omit the tag and production builds served locally do not collect traffic', () => {
  assert.equal(analyticsAttributes(siteUrl, false), undefined);
  for (const url of ['http://localhost:4173/docs/', 'https://preview.example/docs/', 'https://sieblyio.github.io/other/']) {
    const app = browser(url);
    app.run();
    assert.equal(app.scripts.length, 0);
    assert.equal(app.window.gtag, undefined);
  }
});
