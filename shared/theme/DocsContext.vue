<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
const { theme } = useData();
const data = computed(() => theme.value.sdk);
</script>

<template>
  <div class="sdk-context">
    <a :href="withBase('/')"><strong>{{ data.name }} SDK</strong></a>
    <span class="version-badge">v{{ data.version }}</span>
  </div>
</template>
