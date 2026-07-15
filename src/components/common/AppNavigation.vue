<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['navigate'])

const handleRouteClick = () => {
  emit('navigate')
}
</script>

<template>
  <nav class="app-navigation" :class="{ 'app-navigation--mobile': mobile }" aria-label="주요 메뉴">
    <RouterLink :to="{ name: 'home' }" class="app-navigation__link" @click="handleRouteClick">
      홈
    </RouterLink>

    <RouterLink :to="{ name: 'map' }" class="app-navigation__link" @click="handleRouteClick">
      지도
    </RouterLink>

    <RouterLink :to="{ name: 'post-list' }" class="app-navigation__link" @click="handleRouteClick">
      게시판
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-navigation {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.app-navigation__link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-decoration: none;
  transition:
    color var(--transition-normal),
    background-color var(--transition-normal);
}

.app-navigation__link:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.app-navigation__link.router-link-exact-active {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.app-navigation--mobile {
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-1);
}

.app-navigation--mobile .app-navigation__link {
  width: 100%;
  min-height: 48px;
  justify-content: flex-start;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-md);
}
</style>
