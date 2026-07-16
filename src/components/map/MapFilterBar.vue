<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  searchKeyword: {
    type: String,
    default: '',
  },
  selectedCategory: {
    type: String,
    default: '전체',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['search', 'update:selectedCategory', 'reset'])

const categories = [
  '전체',
  '관광지',
  '문화시설',
  '축제공연행사',
  '여행코스',
  '레포츠',
  '숙박',
  '쇼핑',
  // '음식점',
]

const keywordInput = ref(props.searchKeyword)

watch(
  () => props.searchKeyword,
  (newKeyword) => {
    keywordInput.value = newKeyword
  },
)

function submitSearch() {
  emit('search', keywordInput.value.trim())
}

function selectCategory(category) {
  emit('update:selectedCategory', category)
}

function resetFilters() {
  keywordInput.value = ''
  emit('reset')
}
</script>

<template>
  <section class="map-filter" aria-label="여행지 검색 및 카테고리 필터">
    <form class="map-filter__search" @submit.prevent="submitSearch">
      <label class="sr-only" for="location-search"> 여행지 검색 </label>

      <input
        id="location-search"
        v-model="keywordInput"
        class="map-filter__input"
        type="search"
        placeholder="여행지 이름 또는 지역을 검색하세요"
        autocomplete="off"
        :disabled="loading"
      />

      <button class="map-filter__search-button" type="submit" :disabled="loading">검색</button>

      <button
        class="map-filter__reset-button"
        type="button"
        :disabled="loading"
        @click="resetFilters"
      >
        필터 초기화
      </button>
    </form>

    <div class="map-filter__categories" role="group" aria-label="여행지 카테고리">
      <button
        v-for="category in categories"
        :key="category"
        class="map-filter__category"
        :class="{
          'map-filter__category--active': selectedCategory === category,
        }"
        type="button"
        :aria-pressed="selectedCategory === category"
        :disabled="loading"
        @click="selectCategory(category)"
      >
        {{ category }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.map-filter {
  display: grid;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.map-filter__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--spacing-2);
}

.map-filter__input {
  min-width: 0;
  height: 44px;
  padding: 0 var(--spacing-4);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.map-filter__input:hover {
  border-color: var(--color-primary);
}

.map-filter__input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(47 125 91 / 12%);
}

.map-filter__search-button,
.map-filter__reset-button {
  height: 44px;
  padding: 0 var(--spacing-5);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.map-filter__search-button {
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.map-filter__search-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.map-filter__reset-button {
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
}

.map-filter__reset-button:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.map-filter__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.map-filter__category {
  min-height: 38px;
  padding: 0 var(--spacing-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-surface-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
}

.map-filter__category:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.map-filter__category--active {
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
}

.map-filter__category--active:hover:not(:disabled) {
  color: var(--color-text-inverse);
  background-color: var(--color-primary-hover);
}

@media (max-width: 640px) {
  .map-filter {
    padding: var(--spacing-4);
  }

  .map-filter__search {
    grid-template-columns: 1fr 1fr;
  }

  .map-filter__input {
    grid-column: 1 / -1;
  }

  .map-filter__search-button,
  .map-filter__reset-button {
    width: 100%;
    padding-inline: var(--spacing-3);
  }

  .map-filter__categories {
    flex-wrap: nowrap;
    padding-bottom: var(--spacing-1);
    overflow-x: auto;
  }

  .map-filter__category {
    flex: 0 0 auto;
  }
}
</style>
