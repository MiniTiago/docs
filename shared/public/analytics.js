(() => {
  const settings = document.currentScript.dataset;
  // A local preview of a production build must not report production traffic.
  if (location.origin !== settings.siteOrigin || !location.pathname.startsWith(settings.siteBase)) return;
  if (document.getElementById('siebly-google-tag')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // The shared GA4 stream measures browser history changes. Sending additional
  // page_view events from the VitePress router would count each navigation twice.
  window.gtag('config', settings.measurementId, { content_group: 'Documentation' });

  const script = document.createElement('script');
  script.id = 'siebly-google-tag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.measurementId}`;
  document.head.appendChild(script);
})();
