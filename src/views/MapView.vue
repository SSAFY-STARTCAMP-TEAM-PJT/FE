<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import KakaoTravelMap from '@/components/map/KakaoTravelMap.vue'
import MapFilterBar from '@/components/map/MapFilterBar.vue'
import MapSidePanel from '@/components/map/MapSidePanel.vue'
import { getLocations, getRelatedPosts } from '@/services/locationService'
import { findNearbyLocations } from '@/utils/geo'

const router = useRouter()

const mapComponent = ref(null)

const allLocations = ref([])
const visibleLocationIds = ref([])

const searchKeyword = ref('')
const selectedCategory = ref('전체')
const selectedLocation = ref(null)
const focusLocation = ref(null)

const relatedPosts = ref([])

const locationsLoading = ref(false)
const postsLoading = ref(false)
const pageError = ref('')

let relatedPostsRequestId = 0

const normalizedSearchKeyword = computed(() =>
  searchKeyword.value.trim().toLocaleLowerCase('ko-KR'),
)

const searchAndCategoryFilteredLocations = computed(() => {
  return allLocations.value.filter((location) => {
    const matchesCategory =
      selectedCategory.value === '전체' || location.category === selectedCategory.value

    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearchKeyword.value) {
      return true
    }

    const searchableText = [location.name, location.address, location.region]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ko-KR')

    return searchableText.includes(normalizedSearchKeyword.value)
  })
})

const visibleLocations = computed(() => {
  const visibleIdSet = new Set(visibleLocationIds.value.map(String))

  return searchAndCategoryFilteredLocations.value.filter((location) =>
    visibleIdSet.has(String(location.id)),
  )
})

const nearbyLocations = computed(() => {
  return findNearbyLocations(selectedLocation.value, allLocations.value, 5)
})

const hasActiveFilter = computed(() => {
  return searchKeyword.value.length > 0 || selectedCategory.value !== '전체'
})

const selectedLocationId = computed(() => selectedLocation.value?.id ?? null)

onMounted(() => {
  loadLocations()
})

watch(searchAndCategoryFilteredLocations, async (filteredLocations) => {
  if (
    selectedLocation.value &&
    !filteredLocations.some((location) => String(location.id) === String(selectedLocation.value.id))
  ) {
    closeDetail()
  }

  if (filteredLocations.length === 1) {
    focusLocation.value = {
      ...filteredLocations[0],
    }
  }
})

async function loadLocations() {
  locationsLoading.value = true
  pageError.value = ''

  try {
    const locations = await getLocations()

    allLocations.value = locations.filter(
      (location) => Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
    )

    visibleLocationIds.value = allLocations.value.map((location) => String(location.id))
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : '여행지 정보를 불러오지 못했습니다.'
  } finally {
    locationsLoading.value = false
  }
}

function handleSearch(keyword) {
  searchKeyword.value = keyword

  const searchResults = searchAndCategoryFilteredLocations.value

  if (searchResults.length === 1) {
    focusLocation.value = {
      ...searchResults[0],
    }
  }
}

function handleCategoryChange(category) {
  selectedCategory.value = category

  const filteredLocations = searchAndCategoryFilteredLocations.value

  if (filteredLocations.length === 1) {
    focusLocation.value = {
      ...filteredLocations[0],
    }
  }
}

function resetFilters() {
  searchKeyword.value = ''
  selectedCategory.value = '전체'
  closeDetail()

  requestAnimationFrame(() => {
    mapComponent.value?.fitLocations(allLocations.value)
  })
}

function handleBoundsChange(locationIds) {
  visibleLocationIds.value = locationIds
}

async function selectLocation(location) {
  selectedLocation.value = location
  focusLocation.value = {
    ...location,
  }

  await loadRelatedPosts(location)
}

async function selectNearbyLocation(location) {
  await selectLocation(location)
}

function closeDetail() {
  selectedLocation.value = null
  relatedPosts.value = []
}

async function loadRelatedPosts(location) {
  const requestId = ++relatedPostsRequestId

  postsLoading.value = true
  relatedPosts.value = []

  try {
    const posts = await getRelatedPosts(location.contentId ?? location.id)

    if (requestId !== relatedPostsRequestId) {
      return
    }

    relatedPosts.value = posts.slice(0, 3)
  } catch (error) {
    if (requestId !== relatedPostsRequestId) {
      return
    }

    relatedPosts.value = []
    console.error('관련 게시글 조회 실패:', error)
  } finally {
    if (requestId === relatedPostsRequestId) {
      postsLoading.value = false
    }
  }
}

function createCourse(location) {
  router.push({
    path: '/posts/new',
    query: {
      locationId: location.contentId ?? location.id,
    },
  })
}

function openPost(post) {
  router.push(`/posts/${post.id}`)
}

function openAllPosts(location) {
  router.push({
    path: '/posts',
    query: {
      locationId: location.contentId ?? location.id,
      locationName: location.name,
    },
  })
}
</script>

<template>
  <main class="map-view">
    <div class="container map-view__container">
      <header class="map-view__header">
        <div>
          <p class="map-view__eyebrow">LocalHub</p>

          <h1 class="map-view__title">여행지 지도</h1>

          <p class="map-view__description">
            지도에서 지역 여행지를 탐색하고 주변 여행지를 함께 확인해 보세요.
          </p>
        </div>
      </header>

      <MapFilterBar
        :search-keyword="searchKeyword"
        :selected-category="selectedCategory"
        :loading="locationsLoading"
        @search="handleSearch"
        @update:selected-category="handleCategoryChange"
        @reset="resetFilters"
      />

      <div v-if="pageError" class="map-view__error" role="alert">
        <div>
          <strong>여행지 정보를 불러오지 못했습니다.</strong>
          <p>{{ pageError }}</p>
        </div>

        <button type="button" @click="loadLocations">다시 시도</button>
      </div>

      <section v-else class="map-view__workspace">
        <KakaoTravelMap
          ref="mapComponent"
          :locations="searchAndCategoryFilteredLocations"
          :selected-location-id="selectedLocationId"
          :focus-location="focusLocation"
          @select-location="selectLocation"
          @bounds-change="handleBoundsChange"
        />

        <MapSidePanel
          :selected-location="selectedLocation"
          :visible-locations="visibleLocations"
          :related-posts="relatedPosts"
          :nearby-locations="nearbyLocations"
          :locations-loading="locationsLoading"
          :posts-loading="postsLoading"
          :has-active-filter="hasActiveFilter"
          @select-location="selectLocation"
          @close-detail="closeDetail"
          @select-nearby="selectNearbyLocation"
          @create-course="createCourse"
          @open-post="openPost"
          @open-all-posts="openAllPosts"
        />
      </section>
    </div>
  </main>
</template>

<style scoped>
.map-view {
  min-height: calc(100vh - var(--header-height));
  padding: var(--spacing-8) 0 var(--spacing-12);
  background-color: var(--color-background);
}

.map-view__container {
  display: grid;
  gap: var(--spacing-5);
}

.map-view__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--spacing-6);
}

.map-view__eyebrow {
  margin: 0 0 var(--spacing-1);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.map-view__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  line-height: 1.25;
}

.map-view__description {
  margin: var(--spacing-2) 0 0;
  color: var(--color-text-secondary);
}

.map-view__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  min-height: 620px;
  overflow: hidden;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.map-view__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  color: var(--color-error);
  background-color: rgb(220 90 90 / 8%);
  border: 1px solid rgb(220 90 90 / 20%);
  border-radius: var(--radius-md);
}

.map-view__error strong {
  display: block;
}

.map-view__error p {
  margin: var(--spacing-1) 0 0;
  font-size: var(--font-size-sm);
}

.map-view__error button {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 var(--spacing-4);
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-surface);
  border: 1px solid rgb(220 90 90 / 30%);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.map-view__error button:hover {
  background-color: rgb(220 90 90 / 8%);
}

@media (max-width: 900px) {
  .map-view {
    padding-top: var(--spacing-6);
  }

  .map-view__workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .map-view {
    padding-top: var(--spacing-5);
  }

  .map-view__container {
    gap: var(--spacing-4);
    padding-inline: 0;
  }

  .map-view__header {
    padding-inline: var(--content-padding-mobile);
  }

  .map-view__title {
    font-size: var(--font-size-2xl);
  }

  .map-view__description {
    font-size: var(--font-size-sm);
  }

  .map-view__workspace,
  .map-view__error {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  :deep(.map-filter) {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}
</style>
