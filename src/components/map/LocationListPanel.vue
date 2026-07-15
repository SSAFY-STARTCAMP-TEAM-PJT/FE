<script setup>
defineProps({
  locations: {
    type: Array,
    default: () => [],
  },
  selectedLocationId: {
    type: [String, Number],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hasActiveFilter: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-location'])
</script>

<template>
  <section class="location-list-panel">
    <header class="location-list-panel__header">
      <p class="location-list-panel__eyebrow">현재 지도에 보이는 여행지</p>

      <h2 class="location-list-panel__count">총 {{ locations.length }}개</h2>
    </header>

    <div v-if="loading" class="location-list-panel__state">여행지를 불러오는 중입니다.</div>

    <div v-else-if="locations.length === 0" class="location-list-panel__state">
      <strong>표시할 여행지가 없습니다.</strong>

      <p v-if="hasActiveFilter">검색 조건을 변경하거나 필터를 초기화해 주세요.</p>

      <p v-else>지도를 이동하거나 축소해서 다른 지역을 확인해 주세요.</p>
    </div>

    <ul v-else class="location-list-panel__list">
      <li v-for="location in locations" :key="location.id" class="location-list-panel__item">
        <button
          class="location-list-panel__button"
          :class="{
            'location-list-panel__button--active':
              String(location.id) === String(selectedLocationId),
          }"
          type="button"
          @click="emit('select-location', location)"
        >
          <span class="location-list-panel__marker">
            <span class="sr-only">여행지:</span>
          </span>

          <span class="location-list-panel__content">
            <strong class="location-list-panel__name">
              {{ location.name }}
            </strong>

            <span class="location-list-panel__meta">
              {{ location.category }}
              <template v-if="location.region"> · {{ location.region }} </template>
            </span>

            <span class="location-list-panel__address">
              {{ location.address || '주소 정보 없음' }}
            </span>
          </span>

          <span class="location-list-panel__arrow" aria-hidden="true"> › </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.location-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.location-list-panel__header {
  flex: 0 0 auto;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border-light);
}

.location-list-panel__eyebrow {
  margin: 0 0 var(--spacing-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.location-list-panel__count {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.location-list-panel__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: var(--spacing-2);
  overflow-y: auto;
  list-style: none;
}

.location-list-panel__item + .location-list-panel__item {
  margin-top: var(--spacing-1);
}

.location-list-panel__button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-4);
  color: var(--color-text-primary);
  text-align: left;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.location-list-panel__button:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-light);
}

.location-list-panel__button--active {
  background-color: var(--color-primary-light);
  border-color: rgb(47 125 91 / 24%);
}

.location-list-panel__marker {
  width: 10px;
  height: 10px;
  margin-top: 7px;
  background-color: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(47 125 91 / 12%);
}

.location-list-panel__content {
  display: grid;
  min-width: 0;
}

.location-list-panel__name {
  overflow: hidden;
  font-size: var(--font-size-md);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.location-list-panel__meta {
  margin-top: var(--spacing-1);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.location-list-panel__address {
  margin-top: var(--spacing-1);
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.location-list-panel__arrow {
  margin-top: 1px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xl);
}

.location-list-panel__state {
  display: grid;
  flex: 1;
  align-content: center;
  justify-items: center;
  gap: var(--spacing-2);
  min-height: 260px;
  padding: var(--spacing-8);
  color: var(--color-text-secondary);
  text-align: center;
}

.location-list-panel__state strong {
  color: var(--color-text-primary);
}

.location-list-panel__state p {
  max-width: 280px;
  margin: 0;
  font-size: var(--font-size-sm);
}
</style>
