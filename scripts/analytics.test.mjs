import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { analyticsAttributes } from '../shared/site-services.mjs';
import { catalogue } from './context.mjs';

const script = await readFile(new URL('../shared/public/analytics.js', import.meta.url), 'utf8');
const siteUrl = 'https://sieblyio.github.io/docs/';
const sdks = await catalogue();

class Element {
  constructor(properties = {}) { Object.assign(this, properties); }
  closest(selector) { return this.parents?.[selector] || null; }
  matches(selector) { return this.selectors?.includes(selector) || false; }
  getAttribute(key) { return this.attributes?.[key] ?? null; }
  querySelector(selector) { return this.one?.[selector] || null; }
  querySelectorAll(selector) { return this.many?.[selector] || []; }
}
function browser(url, { missing = false, clipboard, fallback = false } = {}) {
  const attributes = analyticsAttributes(siteUrl, true, sdks);
  const scripts = [];
  const listeners = new Map();
  const timers = new Map();
  const many = {};
  const one = {};
  const location = new URL(url);
  let timer = 0;
  let fallbackCopies = 0;
  const window = { dataLayer: [['existing-event']], addEventListener: (type, handler) => listeners.set(`window:${type}`, handler) };
  const document = {
    currentScript: { dataset: {
      measurementId: attributes['data-measurement-id'],
      siteOrigin: attributes['data-site-origin'],
      siteBase: attributes['data-site-base'],
      sdkCatalogue: attributes['data-sdk-catalogue'],
    } },
    getElementById: (id) => scripts.find((entry) => entry.id === id) || one[id],
    createElement: () => ({ style: {}, setAttribute() {}, select() {}, remove() {} }),
    querySelector: (selector) => selector === '[data-docs-not-found], .NotFound' && missing ? {} : one[selector] || null,
    querySelectorAll: (selector) => many[selector] || [],
    head: { appendChild: (entry) => scripts.push(entry) },
    body: { appendChild() {} },
    getSelection: () => null,
    execCommand: () => { fallbackCopies += 1; return fallback; },
    addEventListener: (type, handler) => listeners.set(type, handler),
  };
  const context = vm.createContext({ window, document, location, URL, Element, Node: { DOCUMENT_POSITION_FOLLOWING: 4 }, navigator: { clipboard },
    MutationObserver: class { constructor(handler) { this.handler = handler; } observe() {} },
    setTimeout: (handler) => { timers.set(++timer, handler); return timer; }, clearTimeout: (id) => timers.delete(id),
  });
  return { scripts, window, document, location, one, many, listeners, get fallbackCopies() { return fallbackCopies; },
    run: () => vm.runInContext(script, context),
    events: (name) => window.dataLayer.filter((entry) => entry[0] === 'event' && (!name || entry[1] === name)).map((entry) => ({ name: entry[1], parameters: entry[2] })),
    dispatch: (type, target, details = {}) => listeners.get(type)?.({ target, type, button: 0, preventDefault() {}, stopImmediatePropagation() {}, ...details }),
    flush: async () => { const pending = [...timers.values()]; timers.clear(); pending.forEach((handler) => handler()); await new Promise(setImmediate); },
  };
}

test('production pages initialize once, with catalogue-derived page context and no manual pageviews', () => {
  for (const [page, exchange, family] of [
    ['', 'all', 'docs_portal'], ['bybit/', 'bybit', 'docs_overview'], ['binance/api/index.html', 'binance', 'docs_reference'],
    ['hyperliquid/clients.html', 'hyperliquid', 'docs_guide'], ['bybit/getting-started.html', 'bybit', 'docs_quickstart'], ['bybit/compatibility.html', 'bybit', 'docs_compatibility'],
  ]) {
    const app = browser(siteUrl + page + '?private=not-sent#secret');
    app.run(); app.run();
    assert.equal(app.scripts.length, 1);
    assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-KQWZYX9C7R');
    assert.equal(app.scripts[0].async, true);
    assert.equal(app.window.dataLayer[0][0], 'existing-event');
    const configs = app.window.dataLayer.filter((entry) => entry[0] === 'config');
    assert.equal(configs.filter((entry) => !entry[2].update).length, 1);
    assert.equal(configs[0][2].send_page_view, undefined);
    const context = configs[0][2];
    assert.equal(context.exchange, exchange);
    assert.equal(context.page_family, family);
    assert.equal(context.page_location, siteUrl + page);
    assert.equal(app.events().length, 0);
  }
});

test('preview builds and wrong production paths do not initialize or install listeners', () => {
  assert.equal(analyticsAttributes(siteUrl, false), undefined);
  for (const url of ['http://localhost:4173/docs/', 'https://preview.example/docs/', 'https://sieblyio.github.io/other/']) {
    const app = browser(url); app.run();
    assert.equal(app.scripts.length, 0);
    assert.equal(app.window.gtag, undefined);
    assert.equal(app.listeners.size, 0);
  }
});

test('campaign acquisition survives canonical URL sanitization without arbitrary query values', () => {
  const app = browser(siteUrl + 'bybit/?utm_source=release-notes&utm_medium=email&utm_campaign=sdk-docs&utm_id=launch-1&utm_content=header&utm_term=websocket&private=do-not-send');
  app.run();
  const config = app.window.dataLayer.find((entry) => entry[0] === 'config' && !entry[2].update)[2];
  assert.equal(config.page_location, siteUrl + 'bybit/');
  assert.equal(config.campaign_source, 'release-notes');
  assert.equal(config.campaign_medium, 'email');
  assert.equal(config.campaign_name, 'sdk-docs');
  assert.equal(config.campaign_id, 'launch-1');
  assert.equal(config.campaign_content, 'header');
  assert.equal(config.campaign_term, 'websocket');
  assert.equal(JSON.stringify(app.window.dataLayer).includes('do-not-send'), false);
});

test('router and back navigation change automatic pageview context without emitting page_view', () => {
  const app = browser(siteUrl + 'bybit/'); app.run();
  app.window.sieblyDocsAnalytics.beforeNavigate(siteUrl + 'binance/api/classes/MainClient.html?secret=removed');
  assert.equal(app.window.dataLayer.at(-1)[2].exchange, 'binance');
  assert.equal(app.window.dataLayer.at(-1)[2].page_family, 'docs_reference');
  assert.equal(app.window.dataLayer.at(-1)[2].update, true);
  app.location.href = siteUrl + 'hyperliquid/getting-started.html';
  app.listeners.get('window:popstate')();
  assert.equal(app.window.dataLayer.at(-1)[2].exchange, 'hyperliquid');
  assert.equal(app.events('page_view').length, 0);
});

test('missing pages record each missing arrival once and use the not-found page category', () => {
  const app = browser(siteUrl + 'bybit/missing.html?secret=removed', { missing: true }); app.run();
  app.window.sieblyDocsAnalytics.pageReady(true);
  assert.equal(app.events('page_not_found').length, 1);
  assert.equal(app.events()[0].parameters.page_family, 'docs_not_found');
  assert.equal(app.events()[0].parameters.page_path, '/docs/bybit/missing.html');
  assert.equal(app.events()[0].parameters.send_to, 'G-KQWZYX9C7R');
});

test('navigation records SDK choice and sanitized destination without exposing contact or query data', () => {
  const app = browser(siteUrl); app.run();
  const card = new Element({ attributes: { href: siteUrl + 'bybit/?token=secret#unused' } });
  card.parents = { 'a[href]': card };
  app.dispatch('auxclick', card, { button: 1 });
  assert.equal(app.events('content_select')[0].parameters.option_id, 'bybit');
  assert.equal(app.events('navigation_click')[0].parameters.destination_path, '/docs/bybit/');
  const contact = new Element({ attributes: { href: 'mailto:secret@example.com' } }); contact.parents = { 'a[href]': contact };
  app.dispatch('click', contact);
  assert.equal(app.events('navigation_click').at(-1).parameters.destination_type, 'contact');
  assert.equal(JSON.stringify(app.events()).includes('secret'), false);
});

test('a router history update keeps click attribution on the source until the next page renders', () => {
  const app = browser(siteUrl + 'bybit/'); app.run();
  const link = new Element({ attributes: { href: siteUrl + 'bybit/getting-started.html' } });
  link.parents = { 'a[href]': link };
  app.window.sieblyDocsAnalytics.beforeNavigate(link.attributes.href);
  app.dispatch('click', link);
  const navigation = app.events('navigation_click')[0].parameters;
  assert.equal(navigation.page_path, '/docs/bybit/');
  assert.equal(navigation.destination_path, '/docs/bybit/getting-started.html');
  app.location.href = link.attributes.href;
  app.window.sieblyDocsAnalytics.pageReady();
  app.dispatch('click', link);
  assert.equal(app.events('navigation_click').at(-1).parameters.page_path, '/docs/bybit/getting-started.html');
});

function codeButton(app, text) {
  const clone = new Element({ textContent: text });
  const pre = { cloneNode: () => clone };
  const block = new Element({ className: 'language-sh', one: { pre } });
  const classes = new Set();
  const button = new Element({ parentElement: block, classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) }, blur() {} });
  button.parents = { '.vp-doc div[class*="language-"] > button.copy': button, 'div[class*="language-"]': block };
  app.many['.vp-doc div[class*="language-"]'] = [block];
  return { button, classes };
}

test('copy reports the actual asynchronous result, preserves source context and excludes copied text', async () => {
  let resolveCopy;
  const app = browser(siteUrl + 'bybit/', { clipboard: { writeText: () => new Promise((resolve) => { resolveCopy = resolve; }) } }); app.run();
  const { button, classes } = codeButton(app, 'npm install bybit-api');
  app.dispatch('click', button);
  assert.equal(app.events('content_copy').length, 0);
  app.window.sieblyDocsAnalytics.beforeNavigate(siteUrl + 'binance/');
  resolveCopy(); await new Promise(setImmediate);
  const copy = app.events('content_copy')[0].parameters;
  assert.equal(copy.copy_result, 'success');
  assert.equal(copy.content_type, 'install_command');
  assert.equal(copy.exchange, 'bybit');
  assert.equal(classes.has('copied'), true);
  assert.equal(JSON.stringify(copy).includes('npm install'), false);
});

test('copy rejects a failed fallback and provider errors cannot break successful copying', async () => {
  const app = browser(siteUrl + 'bybit/', { clipboard: { writeText: async () => { throw new Error('Denied'); } } }); app.run();
  const failed = codeButton(app, 'private code text');
  app.dispatch('click', failed.button); await new Promise(setImmediate);
  assert.equal(app.fallbackCopies, 1);
  assert.equal(app.events('content_copy')[0].parameters.copy_result, 'failure');
  assert.equal(failed.classes.has('copied'), false);
  const success = browser(siteUrl + 'bybit/', { clipboard: { writeText: async () => {} } }); success.run();
  const copied = codeButton(success, 'private code text');
  success.window.gtag = () => { throw new Error('Provider failed'); };
  success.dispatch('click', copied.button); await new Promise(setImmediate);
  assert.equal(copied.classes.has('copied'), true);
});

test('settled searches report zero-results and keyboard selection flushes pending search without terms', async () => {
  const app = browser(siteUrl + 'bybit/'); app.run();
  const input = new Element({ value: 'a private search term', selectors: ['#localsearch-input'] });
  const modal = new Element({ one: { '#localsearch-input': input, '.no-results': {} } });
  app.one['.VPLocalSearchBox'] = modal;
  app.dispatch('input', input); await app.flush();
  assert.equal(app.events('docs_search')[0].parameters.search_result, 'no_results');
  app.dispatch('input', input);
  const link = new Element({ attributes: { href: siteUrl + 'bybit/api/classes/RestClientV5.html#method' } });
  link.parents = { '.VPLocalSearchBox': modal };
  modal.one['.no-results'] = null;
  modal.one['a.result.selected'] = link;
  modal.many = { 'a.result': [link] };
  input.parents = { '.VPLocalSearchBox': modal };
  app.dispatch('keydown', input, { key: 'Enter' });
  assert.equal(app.events('docs_search').at(-1).parameters.search_result_count, 1);
  assert.equal(app.events('content_select')[0].parameters.selection_type, 'search_result');
  assert.equal(app.events('content_select')[0].parameters.search_result_position, 1);
  await app.flush();
  assert.equal(app.events('docs_search').length, 2);
  assert.equal(JSON.stringify(app.events()).includes('private search'), false);
});
