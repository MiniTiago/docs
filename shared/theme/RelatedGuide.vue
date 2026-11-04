<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
const { page, theme } = useData();
const sdk = computed(() => theme.value.sdk);
const usage = computed(() => page.value.relativePath.includes('Websocket')
  ? { title: 'WebSocket subscriptions', href: '/guides/websockets.html' }
  : { title: 'Client usage', href: '/clients.html' });
</script>

<template>
  <nav v-if="page.relativePath.startsWith('api/')" class="related-guide" aria-label="Related documentation">
    <strong>Related documentation</strong>
    <ul>
      <li><a :href="withBase(usage.href)">{{ usage.title }}</a></li>
      <li><a :href="withBase('/guides/errors.html')">Error handling</a></li>
      <li><a :href="withBase('/guides/troubleshooting.html')">Troubleshooting</a></li>
      <li><a :href="sdk.tutorial">{{ sdk.name }} tutorial on Siebly.io ↗</a></li>
    </ul>
  </nav>
</template>
