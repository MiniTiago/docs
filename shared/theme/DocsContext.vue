<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';
const { theme } = useData();
const data = computed(() => theme.value.sdk);
</script>

<template>
  <div class="sdk-context">
    <strong>{{ data.name }} SDK</strong>
    <span class="version-badge">v{{ data.version }}</span>
  </div>
</template>
