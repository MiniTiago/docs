import DefaultTheme from 'vitepress/theme';
import { h, nextTick } from 'vue';
import DocsContext from './DocsContext.vue';
import RelatedGuide from './RelatedGuide.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return;
    // These supported router hooks keep the shared tag's automatic history
    // pageview in the destination SDK context before pushState is called.
    router.onBeforeRouteChange = (href) => {
      window.sieblyDocsAnalytics?.beforeNavigate(href);
    };
    router.onAfterRouteChange = async () => {
      await nextTick();
      window.sieblyDocsAnalytics?.pageReady(Boolean(router.route.data.isNotFound));
    };
  },
  Layout: () => h(DefaultTheme.Layout, null, {
    'sidebar-nav-before': () => h(DocsContext),
    'doc-after': () => h(RelatedGuide),
  }),
};
