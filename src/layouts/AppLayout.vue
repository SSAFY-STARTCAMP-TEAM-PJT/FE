<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppHeader from '@/components/common/AppHeader.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'

const route = useRoute()

const isFullWidthPage = computed(() => {
  return route.meta.fullWidth === true
})
</script>

<template>
  <div class="app-layout">
    <AppHeader />

    <main class="app-main" :class="{ 'app-main--full-width': isFullWidthPage }">
      <RouterView />
    </main>

    <ChatWidget />
    <AppLoading />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  padding-top: var(--header-height);
  background-color: var(--color-background);
}

.app-main {
  width: 100%;
  max-width: var(--content-max-width);
  min-height: calc(100vh - var(--header-height));
  margin: 0 auto;
  padding: var(--spacing-6) var(--content-padding-mobile);
}

.app-main--full-width {
  max-width: none;
  padding: 0;
}

@media (min-width: 768px) {
  .app-main {
    padding: var(--spacing-8) var(--content-padding-tablet);
  }

  .app-main--full-width {
    padding: 0;
  }
}

@media (min-width: 1200px) {
  .app-main {
    padding: var(--spacing-10) var(--content-padding-desktop);
  }

  .app-main--full-width {
    padding: 0;
  }
}
</style>
