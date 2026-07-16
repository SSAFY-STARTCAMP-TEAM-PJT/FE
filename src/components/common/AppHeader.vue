<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppNavigation from '@/components/common/AppNavigation.vue'
import logo from '@/assets/logo.svg'

const route = useRoute()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink :to="{ name: 'home' }" class="app-header__logo" aria-label="LocalHub 홈으로 이동">
        <img :src="logo" alt="LocalHub 로고" class="app-header__logo-image" />
        <span class="app-header__logo-text">LocalHub</span>
      </RouterLink>

      <div class="app-header__desktop-navigation">
        <AppNavigation />
      </div>

      <button
        type="button"
        class="app-header__menu-button"
        :class="{ 'app-header__menu-button--open': isMenuOpen }"
        :aria-label="isMenuOpen ? '메뉴 닫기' : '메뉴 열기'"
        aria-controls="mobile-navigation"
        :aria-expanded="isMenuOpen"
        @click="toggleMenu"
      >
        <span class="app-header__menu-line"></span>
        <span class="app-header__menu-line"></span>
        <span class="app-header__menu-line"></span>
      </button>
    </div>

    <div v-if="isMenuOpen" id="mobile-navigation" class="app-header__mobile-navigation">
      <AppNavigation mobile @navigate="closeMenu" />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  z-index: var(--z-index-header);
  top: 0;
  right: 0;
  left: 0;
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.app-header__inner {
  display: flex;
  width: 100%;
  max-width: var(--content-max-width);
  height: 100%;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
  padding: 0 var(--content-padding-mobile);
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.03em;
  text-decoration: none;
}

.app-header__logo-image {
  width: 36px;
  height: auto;
}

.app-header__logo-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.app-header__desktop-navigation {
  display: none;
}

.app-header__menu-button {
  display: flex;
  width: 40px;
  height: 40px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background-color: transparent;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.app-header__menu-button:hover {
  background-color: var(--color-surface-muted);
}

.app-header__menu-line {
  display: block;
  width: 21px;
  height: 2px;
  border-radius: var(--radius-full);
  background-color: var(--color-text-primary);
  transition:
    transform var(--transition-normal),
    opacity var(--transition-normal);
}

.app-header__menu-button--open .app-header__menu-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.app-header__menu-button--open .app-header__menu-line:nth-child(2) {
  opacity: 0;
}

.app-header__menu-button--open .app-header__menu-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.app-header__mobile-navigation {
  position: fixed;
  z-index: var(--z-index-header);
  top: var(--header-height);
  right: 0;
  left: 0;
  padding: var(--spacing-3) var(--content-padding-mobile) var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

@media (min-width: 768px) {
  .app-header__inner {
    padding: 0 var(--content-padding-tablet);
  }

  .app-header__desktop-navigation {
    display: block;
  }

  .app-header__menu-button,
  .app-header__mobile-navigation {
    display: none;
  }
}

@media (min-width: 1200px) {
  .app-header__inner {
    padding: 0 var(--content-padding-desktop);
  }
}
</style>
