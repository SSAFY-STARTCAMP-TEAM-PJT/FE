<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import KakaoTravelMap from '@/components/map/KakaoTravelMap.vue'
import MapFilterBar from '@/components/map/MapFilterBar.vue'
import MapSidePanel from '@/components/map/MapSidePanel.vue'
import {
  containsLocationBounds,
  expandLocationBounds,
  filterLocationsByBounds,
  getCachedMapLocations,
  setCachedMapLocations,
} from '@/services/locationMapCache'
import { getLocation, getLocations, getNearbyLocations } from '@/services/locationService'
import { getPosts } from '@/services/posts'

const LOCATION_LIMIT = 500
const LOCATION_REQUEST_DELAY = 300

const route = useRoute()
const router = useRouter()
const mapComponent = ref(null)

const allLocations = ref([])
const searchKeyword = ref(typeof route.query.query === 'string' ? route.query.query : '')
const selectedCategory = ref(
  typeof route.query.category === 'string' ? route.query.category : '전체',
)
const selectedLocation = ref(null)
const focusLocation = ref(null)
const viewportBounds = ref(null)
const relatedPosts = ref([])
const nearbyLocations = ref([])
const locationsLoading = ref(false)
const hasLoadedLocations = ref(false)
const postsLoading = ref(false)
const pageError = ref('')
const isLocationLimitReached = ref(false)

let locationRequestTimer = null
let activeLocationRequest = null
let locationContextRequestId = 0

const visibleLocations = computed(() => allLocations.value)
const hasActiveFilter = computed(
  () => searchKeyword.value.length > 0 || selectedCategory.value !== '전체',
)
const selectedLocationId = computed(() => selectedLocation.value?.id ?? null)
const initialLocationsLoading = computed(() => locationsLoading.value && !hasLoadedLocations.value)
const locationsRefreshing = computed(() => locationsLoading.value && hasLoadedLocations.value)

function getLocationFilters() {
  return {
    category: selectedCategory.value === '전체' ? '' : selectedCategory.value,
    query: searchKeyword.value.trim(),
  }
}

function getRouteQuery(overrides = {}) {
  const query = {
    query: searchKeyword.value || undefined,
    category: selectedCategory.value !== '전체' ? selectedCategory.value : undefined,
    placeId: route.query.placeId || undefined,
    ...overrides,
  }

  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined))
}

async function replaceRouteQuery(overrides = {}) {
  await router.replace({ path: '/map', query: getRouteQuery(overrides) })
}

function handleMapReady(bounds) {
  if (bounds) {
    viewportBounds.value = bounds
    scheduleLocationLoad()
  }
}

function handleViewportChange(bounds) {
  viewportBounds.value = bounds

  if (searchKeyword.value.trim()) return

  scheduleLocationLoad()
}

function scheduleLocationLoad() {
  if (!viewportBounds.value) return

  window.clearTimeout(locationRequestTimer)
  locationRequestTimer = window.setTimeout(loadLocations, LOCATION_REQUEST_DELAY)
}

async function loadLocations() {
  if (!viewportBounds.value) return

  const requestedViewport = { ...viewportBounds.value }
  const { category, query } = getLocationFilters()
  const cachedResult = getCachedMapLocations({
    category,
    query,
    bounds: requestedViewport,
  })

  if (cachedResult) {
    activeLocationRequest?.controller.abort()
    activeLocationRequest = null
    locationsLoading.value = false
    pageError.value = ''
    applyLocations(cachedResult.locations, {
      limitReached: cachedResult.limitReached,
      query,
    })
    return
  }

  const requestBounds = query ? null : expandLocationBounds(requestedViewport)

  if (
    activeLocationRequest &&
    activeLocationRequest.category === category &&
    activeLocationRequest.query === query &&
    (query || containsLocationBounds(activeLocationRequest.requestBounds, requestedViewport))
  ) {
    return
  }

  activeLocationRequest?.controller.abort()
  const controller = new AbortController()
  const request = {
    category,
    query,
    requestBounds,
    requestedViewport,
    controller,
  }
  activeLocationRequest = request
  locationsLoading.value = true
  pageError.value = ''

  try {
    const locations = await getLocations({
      category,
      query,
      bounds: requestBounds,
      limit: LOCATION_LIMIT,
      signal: controller.signal,
      showLoading: false,
    })

    const validLocations = locations.filter(
      (location) => Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
    )
    const limitReached = locations.length === LOCATION_LIMIT
    const cacheBounds = limitReached ? requestedViewport : requestBounds

    setCachedMapLocations({
      category,
      query,
      bounds: cacheBounds,
      locations: validLocations,
      limitReached,
    })

    if (activeLocationRequest === request) {
      const locationsForCurrentViewport = query
        ? validLocations
        : filterLocationsByBounds(validLocations, viewportBounds.value)

      applyLocations(locationsForCurrentViewport, { limitReached, query })
    }
  } catch (error) {
    if (error?.name !== 'AbortError' && activeLocationRequest === request) {
      pageError.value =
        error instanceof Error ? error.message : '여행지 정보를 불러오지 못했습니다.'
    }
  } finally {
    if (activeLocationRequest === request) {
      activeLocationRequest = null
      locationsLoading.value = false
    }
  }
}

function applyLocations(locations, { limitReached, query }) {
  const nextLocations = [...locations]

  if (
    selectedLocation.value &&
    !nextLocations.some((location) => String(location.id) === String(selectedLocation.value.id))
  ) {
    nextLocations.push(selectedLocation.value)
  }

  allLocations.value = nextLocations
  isLocationLimitReached.value = limitReached
  hasLoadedLocations.value = true

  if (query && nextLocations.length === 1) {
    focusLocation.value = { ...nextLocations[0] }
  }
}

function retryLocations() {
  loadLocations()
}

async function handleSearch(keyword) {
  searchKeyword.value = keyword
  await replaceRouteQuery({ query: keyword || undefined })
  scheduleLocationLoad()
}

async function handleCategoryChange(category) {
  selectedCategory.value = category
  await replaceRouteQuery({ category: category === '전체' ? undefined : category })
  scheduleLocationLoad()
}

async function resetFilters() {
  searchKeyword.value = ''
  selectedCategory.value = '전체'
  selectedLocation.value = null
  relatedPosts.value = []
  nearbyLocations.value = []
  await router.replace({ path: '/map' })
  scheduleLocationLoad()
}

async function loadLocationContext(location) {
  const requestId = ++locationContextRequestId
  postsLoading.value = true
  relatedPosts.value = []
  nearbyLocations.value = []

  try {
    const [postsResult, nearbyResult] = await Promise.all([
      getPosts({ placeId: location.contentId, page: 1, size: 3 }),
      getNearbyLocations(location.contentId, { limit: 5 }),
    ])

    if (requestId !== locationContextRequestId) return

    relatedPosts.value = postsResult.items
    nearbyLocations.value = nearbyResult
  } catch (error) {
    if (requestId === locationContextRequestId) {
      console.error('여행지 관련 정보 조회 실패:', error)
    }
  } finally {
    if (requestId === locationContextRequestId) {
      postsLoading.value = false
    }
  }
}

async function selectLocation(location) {
  selectedLocation.value = location
  focusLocation.value = { ...location }
  await loadLocationContext(location)

  if (String(route.query.placeId ?? '') !== String(location.contentId)) {
    await replaceRouteQuery({ placeId: location.contentId })
  }
}

async function selectNearbyLocation(location) {
  await selectLocation(location)
}

async function closeDetail() {
  locationContextRequestId += 1
  selectedLocation.value = null
  relatedPosts.value = []
  nearbyLocations.value = []
  await replaceRouteQuery({ placeId: undefined })
}

async function loadRouteLocation(placeId) {
  if (!placeId) return
  if (String(selectedLocation.value?.contentId ?? '') === String(placeId)) return

  try {
    const location = await getLocation(placeId)
    selectedLocation.value = location
    focusLocation.value = { ...location }

    if (!allLocations.value.some((item) => item.id === location.id)) {
      allLocations.value = [...allLocations.value, location]
    }

    await loadLocationContext(location)
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '선택한 여행지를 불러오지 못했습니다.'
  }
}

function createCourse(location) {
  router.push({ path: '/posts/create', query: { placeId: location.contentId } })
}

function openPost(post) {
  router.push(`/posts/${post.id}`)
}

function openAllPosts(location) {
  router.push({ path: '/posts', query: { placeId: location.contentId } })
}

watch(
  () => [route.query.query, route.query.category],
  ([query, category]) => {
    searchKeyword.value = typeof query === 'string' ? query : ''
    selectedCategory.value = typeof category === 'string' ? category : '전체'
  },
)

watch(
  () => route.query.placeId,
  (placeId) => loadRouteLocation(typeof placeId === 'string' ? placeId : ''),
  { immediate: true },
)

onBeforeUnmount(() => {
  window.clearTimeout(locationRequestTimer)
  activeLocationRequest?.controller.abort()
  locationContextRequestId += 1
})
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
        :loading="initialLocationsLoading"
        @search="handleSearch"
        @update:selected-category="handleCategoryChange"
        @reset="resetFilters"
      />

      <p v-if="isLocationLimitReached" class="map-view__limit-notice" role="status">
        이 영역에는 여행지가 많습니다. 지도를 확대하면 더 정확한 결과를 볼 수 있습니다.
      </p>

      <div v-if="pageError" class="map-view__error" role="alert">
        <div>
          <strong>여행지 정보를 불러오지 못했습니다.</strong>
          <p>{{ pageError }}</p>
        </div>

        <button type="button" @click="retryLocations">다시 시도</button>
      </div>

      <section class="map-view__workspace">
        <KakaoTravelMap
          ref="mapComponent"
          :locations="allLocations"
          :selected-location-id="selectedLocationId"
          :focus-location="focusLocation"
          @select-location="selectLocation"
          @map-ready="handleMapReady"
          @viewport-change="handleViewportChange"
        />

        <MapSidePanel
          :selected-location="selectedLocation"
          :visible-locations="visibleLocations"
          :related-posts="relatedPosts"
          :nearby-locations="nearbyLocations"
          :locations-loading="initialLocationsLoading"
          :locations-refreshing="locationsRefreshing"
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
  grid-template-rows: minmax(0, 1fr);
  height: clamp(620px, 70dvh, 720px);
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

.map-view__limit-notice {
  margin: 0;
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  background-color: var(--color-secondary-light);
  border: 1px solid var(--color-border-light);
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
    grid-template-rows: 460px 420px;
    height: 880px;
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

  .map-view__workspace {
    grid-template-rows: 390px 420px;
    height: 810px;
  }

  :deep(.map-filter) {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}
</style>
