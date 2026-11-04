(() => {
  const settings = document.currentScript.dataset;
  // A local preview of a production build must not report production traffic.
  if (location.origin !== settings.siteOrigin || !location.pathname.startsWith(settings.siteBase)) return;
  if (window.sieblyDocsAnalytics) return;

  const sdks = JSON.parse(settings.sdkCatalogue || '[]');
  const events = Object.freeze({ copy: 'content_copy', select: 'content_select', navigate: 'navigation_click', search: 'docs_search', notFound: 'page_not_found' });
  const parameterKeys = new Set(['content_group', 'page_location', 'page_path', 'page_family', 'exchange', 'section_id', 'content_id', 'content_type', 'copy_result', 'selection_type', 'option_id', 'destination_type', 'destination_host', 'destination_path', 'destination_id', 'search_result', 'search_result_count', 'search_result_position']);
  const copyTimers = new WeakMap();
  let current;
  let lastMissingPath;
  let searchModal;
  let searchRevision = 0;
  let reportedRevision = -1;
  let searchTimer;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const clean = (parameters) => Object.fromEntries(Object.entries(parameters)
    .filter(([key, value]) => parameterKeys.has(key) && value !== undefined)
    .map(([key, value]) => [key, typeof value === 'string' && !['page_location', 'page_path'].includes(key) ? value.slice(0, 100) : value]));
  const send = (event, parameters = {}, context = current) => {
    try { window.gtag('event', event, { ...clean({ ...context, ...parameters }), send_to: settings.measurementId }); }
    catch { /* Analytics must not interrupt the visitor's action. */ }
  };
  const urlFor = (value) => {
    try { return new URL(value, location.href); } catch { return null; }
  };
  // The canonical page URL omits queries. Preserve the documented acquisition
  // fields separately so sanitization does not turn campaign visits into Direct.
  const campaign = Object.fromEntries([
    ['utm_source', 'campaign_source'], ['utm_medium', 'campaign_medium'],
    ['utm_campaign', 'campaign_name'], ['utm_id', 'campaign_id'],
    ['utm_content', 'campaign_content'], ['utm_term', 'campaign_term'],
  ].flatMap(([query, field]) => {
    const value = new URL(location.href).searchParams.get(query);
    return value ? [[field, value]] : [];
  }));
  const sdkFor = (url) => url?.origin === settings.siteOrigin
    ? sdks.find(({ id }) => url.pathname.startsWith(`${settings.siteBase}${id}/`))
    : undefined;
  function contextFor(value, missing = false) {
    const url = urlFor(value);
    if (!url || url.origin !== settings.siteOrigin || !url.pathname.startsWith(settings.siteBase)) return null;
    const sdk = sdkFor(url);
    const relative = sdk ? url.pathname.slice(`${settings.siteBase}${sdk.id}/`.length) : '';
    const family = missing ? 'docs_not_found'
      : !sdk ? 'docs_portal'
      : /^(api\/|reference(?:\.html)?$)/.test(relative) ? 'docs_reference'
      : /^compatibility(?:\.html)?$/.test(relative) ? 'docs_compatibility'
      : /^getting-started(?:\.html)?$/.test(relative) ? 'docs_quickstart'
      : /^(?:index\.html)?$/.test(relative) ? 'docs_overview'
      : 'docs_guide';
    return { content_group: 'Documentation', page_location: `${url.origin}${url.pathname}`, page_path: url.pathname, page_family: family, exchange: sdk?.id || 'all' };
  }
  function beforeNavigate(href) {
    const next = contextFor(href);
    if (!next) return;
    // Custom parameters must be configured on the stream. Google's documented
    // SPA update merges context without sending another initial pageview.
    // Keep interaction context on the rendered source until pageReady: the
    // VitePress window-capture router runs before our document-capture click.
    try { window.gtag('config', settings.measurementId, { ...clean(next), update: true }); } catch { /* Keep navigation working. */ }
  }
  function pageReady(missing = false) {
    const notFound = missing || Boolean(document.querySelector('[data-docs-not-found], .NotFound'));
    current = contextFor(location.href, notFound);
    if (!current) return;
    try { window.gtag('config', settings.measurementId, { ...clean(current), update: true }); } catch { /* Keep rendering working. */ }
    if (notFound && lastMissingPath !== current.page_path) {
      lastMissingPath = current.page_path;
      send(events.notFound);
    } else if (!notFound) lastMissingPath = undefined;
  }
  const sectionFor = (source) => {
    if (source.closest('.VPLocalSearchBox')) return 'search';
    if (source.closest('header, .VPNav')) return 'header';
    if (source.closest('footer, .VPFooter')) return 'footer';
    if (source.closest('.VPSidebar')) return 'sidebar';
    if (source.closest('.VPDocAside')) return 'outline';
    const headings = [...document.querySelectorAll('.vp-doc :is(h2,h3,h4)[id]')];
    return headings.filter((heading) => heading.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1)?.id || 'main';
  };
  const identityFor = (source) => {
    const block = source.closest('div[class*="language-"]');
    const section = sectionFor(source);
    if (!block) {
      const group = source.closest('.vp-code-group');
      if (!group) return section;
      const groups = [...document.querySelectorAll('.vp-code-group')].filter((entry) => sectionFor(entry) === section);
      return `${section}:group-${groups.indexOf(group) + 1}`;
    }
    const blocks = [...document.querySelectorAll('.vp-doc div[class*="language-"]')].filter((entry) => sectionFor(entry) === section);
    return `${section}:code-${blocks.indexOf(block) + 1}`;
  };
  const interaction = (source) => ({ section_id: sectionFor(source), content_id: identityFor(source) });
  function destination(link) {
    const url = urlFor(link.getAttribute('href'));
    if (!url) return null;
    if (['mailto:', 'tel:'].includes(url.protocol)) return { destination_type: 'contact' };
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const docs = url.origin === settings.siteOrigin && url.pathname.startsWith(settings.siteBase);
    const website = url.hostname === 'siebly.io' || url.hostname === 'www.siebly.io';
    let type = 'external';
    const sdk = sdkFor(url) || sdks.find((entry) => [entry.repository, `https://www.npmjs.com/package/${entry.packageName}`].some((value) => {
      const known = urlFor(value);
      return known && url.origin === known.origin && (url.pathname === known.pathname || url.pathname.startsWith(`${known.pathname}/`));
    }));
    if (docs) {
      type = url.pathname === current.page_path && url.hash ? 'section'
        : sdk ? contextFor(url.href).page_family === 'docs_reference' ? 'sdk_reference' : 'docs_guide'
        : 'docs_portal';
    } else if (website) {
      type = /\/tutorial\/?$/.test(url.pathname) ? 'sdk_tutorial'
        : url.pathname.startsWith('/examples') ? 'example'
        : url.pathname.startsWith('/support') ? 'support'
        : url.pathname.startsWith('/sdk/') ? 'sdk_guide'
        : 'internal';
    } else if (sdk) type = url.hostname === 'www.npmjs.com' ? 'npm' : 'github';
    else if (url.hostname === 'github.com') type = 'github';
    const parameters = {
      destination_type: type,
      destination_host: url.hostname,
      ...(docs || website || sdk ? { destination_path: url.pathname } : {}),
    };
    if (type === 'section') {
      let id;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { return null; }
      if (!document.getElementById(id)) return null;
      parameters.destination_id = id;
    } else if (docs && url.hash) {
      // These fragments come from authored links or VitePress's generated
      // result index, never the visitor's search input.
      try {
        const id = decodeURIComponent(url.hash.slice(1));
        if (/^[\p{L}\p{N}_:.~-]+$/u.test(id)) parameters.destination_id = id;
      } catch { /* Ignore a malformed anchor while retaining its destination. */ }
    }
    return parameters;
  }
  function searchState() {
    const modal = document.querySelector('.VPLocalSearchBox');
    if (modal !== searchModal) {
      searchModal = modal;
      searchRevision += 1;
      reportedRevision = -1;
    }
    if (!modal || !modal.querySelector('#localsearch-input')?.value.trim()) return null;
    const results = [...modal.querySelectorAll('a.result')];
    if (!results.length && !modal.querySelector('.no-results')) return null;
    return { modal, results };
  }
  function reportSearch() {
    const state = searchState();
    if (!state || searchRevision === reportedRevision) return;
    reportedRevision = searchRevision;
    send(events.search, { section_id: 'search', search_result: state.results.length ? 'results' : 'no_results', search_result_count: state.results.length });
  }
  const scheduleSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(reportSearch, 600);
  };
  function selectSearch(link) {
    const state = searchState();
    if (!state) return;
    reportSearch();
    const target = destination(link);
    if (!target) return;
    send(events.select, { ...interaction(link), ...target, selection_type: 'search_result', search_result_position: state.results.indexOf(link) + 1 });
  }
  function navigate(link) {
    const target = destination(link);
    if (!target) return;
    const sdk = sdkFor(urlFor(link.getAttribute('href')));
    if (sdk && sdk.id !== current.exchange) send(events.select, { ...interaction(link), selection_type: 'exchange', option_id: sdk.id });
    if (link.closest('.VPLocalSearchBox')) selectSearch(link);
    send(events.navigate, { ...interaction(link), ...target });
  }
  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* Try the browser's older copy mechanism. */ }
    }
    const focused = document.activeElement;
    const selection = document.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index)) : [];
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    Object.assign(input.style, { position: 'absolute', left: '-9999px', fontSize: '12pt' });
    document.body.appendChild(input);
    let succeeded = false;
    try { input.select(); succeeded = document.execCommand('copy'); }
    catch { /* Report the clipboard failure without breaking the button. */ }
    finally {
      input.remove();
      if (selection) { selection.removeAllRanges(); ranges.forEach((range) => selection.addRange(range)); }
      focused?.focus();
    }
    return succeeded;
  }
  async function copy(button) {
    const block = button.parentElement;
    const pre = block?.querySelector('pre');
    if (!pre) return;
    const clone = pre.cloneNode(true);
    clone.querySelectorAll('.vp-copy-ignore, .diff.remove').forEach((node) => node.remove());
    let text = clone.textContent || '';
    if (/language-(shellscript|shell|bash|sh|zsh)/.test(block.className)) text = text.replace(/^ *(\$|>) /gm, '').trim();
    const parameters = { ...interaction(button), content_type: /^(?:npm (?:install|i)|pnpm add|yarn add|bun add)\s/m.test(text) ? 'install_command' : 'code' };
    // Capture the source before an asynchronous clipboard write or navigation.
    const context = { ...current };
    let succeeded = false;
    try { succeeded = await writeClipboard(text); } catch { /* Preserve the result when the browser denies copying. */ }
    if (succeeded) {
      button.classList.add('copied');
      clearTimeout(copyTimers.get(button));
      copyTimers.set(button, setTimeout(() => { button.classList.remove('copied'); button.blur(); copyTimers.delete(button); }, 2000));
    }
    send(events.copy, { ...parameters, copy_result: succeeded ? 'success' : 'failure' }, context);
  }
  function click(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('.vp-doc div[class*="language-"] > button.copy');
    if (button && event.type === 'click') {
      // The default VitePress handler does not expose its clipboard promise.
      // Own only this existing control so one operation produces one outcome.
      event.preventDefault();
      event.stopImmediatePropagation();
      void copy(button);
      return;
    }
    if (event.button !== 0 && event.button !== 1) return;
    const link = event.target.closest('a[href]');
    if (link) navigate(link);
  }
  window.sieblyDocsAnalytics = Object.freeze({ beforeNavigate, pageReady });
  // Initial HTML has already been parsed because the shared script is deferred.
  const initialMissing = Boolean(document.querySelector('[data-docs-not-found], .NotFound'));
  current = contextFor(location.href, initialMissing);
  window.gtag('js', new Date());
  // The shared stream measures browser history. Never emit manual page_view.
  window.gtag('config', settings.measurementId, { ...clean(current), ...campaign });
  pageReady(initialMissing);
  const script = document.createElement('script');
  script.id = 'siebly-google-tag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.measurementId}`;
  document.head.appendChild(script);

  document.addEventListener('click', click, true);
  document.addEventListener('auxclick', click, true);
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof Element) || !input.matches('.vp-code-group .tabs input:checked')) return;
    const group = input.closest('.vp-code-group');
    const inputs = [...group.querySelectorAll('.tabs input')];
    const label = [...group.querySelectorAll('.tabs label')].find((entry) => entry.htmlFor === input.id);
    send(events.select, { ...interaction(input), selection_type: 'code_tab', option_id: label?.dataset.title || `tab-${inputs.indexOf(input) + 1}` });
  }, true);
  document.addEventListener('input', (event) => {
    if (event.target instanceof Element && event.target.matches('#localsearch-input')) { searchRevision += 1; scheduleSearch(); }
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing || !(event.target instanceof Element) || !event.target.matches('#localsearch-input')) return;
    const modal = event.target.closest('.VPLocalSearchBox');
    const link = modal?.querySelector('a.result.selected');
    if (link) { selectSearch(link); const target = destination(link); if (target) send(events.navigate, { ...interaction(link), ...target }); }
  }, true);
  window.addEventListener('popstate', () => beforeNavigate(location.href), true);
  new MutationObserver(scheduleSearch).observe(document.body, { childList: true, subtree: true });
})();
