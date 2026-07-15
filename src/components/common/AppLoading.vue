<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const { isLoading } = storeToRefs(uiStore)
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-fade">
      <div
        v-if="isLoading"
        class="loading-overlay"
        role="status"
        aria-live="polite"
        aria-label="데이터를 불러오는 중입니다."
      >
        <div class="loading-content">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span class="loading-text">불러오는 중...</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  z-index: var(--z-index-toast);
  display: grid;
  background-color: rgb(247 249 248 / 72%);
  backdrop-filter: blur(2px);
  inset: 0;
  place-items: center;
}

.loading-content {
  display: flex;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  gap: var(--spacing-3);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: loading-spin 700ms linear infinite;
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity var(--transition-normal);
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
