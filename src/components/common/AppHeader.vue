<script setup>
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const navItems = [
  { name: 'Home', to: { name: 'home' } },
  { name: 'Posts', to: { name: 'posts' } },
  { name: 'Map', to: { name: 'map' } },
]
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <router-link :to="{ name: 'home' }" class="brand-link">
        {{ appStore.appTitle }}
      </router-link>
    </div>

    <nav class="nav-links" aria-label="Primary navigation">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="nav-link"
        active-class="nav-link--active"
      >
        {{ item.name }}
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.brand-link {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
}

.nav-link--active {
  color: #2563eb;
}
</style>
