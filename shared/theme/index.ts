import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import DocsContext from './DocsContext.vue';
import RelatedGuide from './RelatedGuide.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'sidebar-nav-before': () => h(DocsContext),
    'doc-after': () => h(RelatedGuide),
  }),
};
