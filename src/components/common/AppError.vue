<script setup>
defineProps({
  title: {
    type: String,
    default: '정보를 불러오지 못했습니다.',
  },

  message: {
    type: String,
    default: '잠시 후 다시 시도해주세요.',
  },

  retryText: {
    type: String,
    default: '다시 시도',
  },

  showRetry: {
    type: Boolean,
    default: true,
  },

  compact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['retry'])
</script>

<template>
  <section class="error-state" :class="{ 'error-state--compact': compact }" role="alert">
    <div class="error-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path
          d="M12 9v4m0 4h.01M10.3 3.8 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.8a2 2 0 0 0-3.4 0Z"
        />
      </svg>
    </div>

    <div class="error-content">
      <strong class="error-title">{{ title }}</strong>
      <p class="error-message">{{ message }}</p>

      <button v-if="showRetry" type="button" class="retry-button" @click="$emit('retry')">
        {{ retryText }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.error-state {
  display: flex;
  width: min(100%, 520px);
  margin-inline: auto;
  padding: var(--spacing-6);
  border: 1px solid rgb(220 90 90 / 22%);
  border-radius: var(--radius-lg);
  background-color: rgb(220 90 90 / 5%);
  gap: var(--spacing-4);
}

.error-state--compact {
  width: 100%;
  padding: var(--spacing-4);
}

.error-icon {
  display: grid;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: rgb(220 90 90 / 12%);
  color: var(--color-error);
  place-items: center;
}

.error-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.error-content {
  min-width: 0;
}

.error-title {
  display: block;
  margin-bottom: var(--spacing-1);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.error-message {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.retry-button {
  margin-top: var(--spacing-4);
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-error);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.retry-button:hover {
  background-color: rgb(220 90 90 / 8%);
}

@media (max-width: 767px) {
  .error-state {
    padding: var(--spacing-4);
  }

  .error-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
