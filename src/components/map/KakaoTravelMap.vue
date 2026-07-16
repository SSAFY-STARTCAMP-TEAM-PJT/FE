<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  locations: {
    type: Array,
    default: () => [],
  },
  selectedLocationId: {
    type: [String, Number],
    default: null,
  },
  focusLocation: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select-location', 'viewport-change', 'map-ready', 'load-error'])

const mapContainer = ref(null)
const isMapLoading = ref(true)
const mapError = ref('')
const isLocating = ref(false)
const locationError = ref('')

let map = null
let markers = []
let currentLocationOverlay = null
let idleListener = null
let resizeObserver = null
let isUnmounted = false

const DEFAULT_CENTER = {
  latitude: 37.5666,
  longitude: 126.9784,
}

function loadKakaoMapSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve)
      return
    }

    const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY

    if (!appKey) {
      reject(new Error('VITE_KAKAO_MAP_JAVASCRIPT_KEY가 설정되지 않았습니다.'))
      return
    }

    const existingScript = document.querySelector('script[data-kakao-map-sdk="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.kakao.maps.load(resolve)
      })

      existingScript.addEventListener('error', () => {
        reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'))
      })

      return
    }

    const script = document.createElement('script')

    script.dataset.kakaoMapSdk = 'true'
    script.async = true
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js` +
      `?appkey=${encodeURIComponent(appKey)}` +
      `&autoload=false`

    script.addEventListener('load', () => {
      window.kakao.maps.load(resolve)
    })

    script.addEventListener('error', () => {
      reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'))
    })

    document.head.appendChild(script)
  })
}

function isValidLocation(location) {
  return Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
}

function createMap() {
  const kakao = window.kakao

  map = new kakao.maps.Map(mapContainer.value, {
    center: new kakao.maps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
    level: 4,
  })

  map.setMaxLevel(12)
  map.setMinLevel(1)

  const zoomControl = new kakao.maps.ZoomControl()
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT)

  const mapTypeControl = new kakao.maps.MapTypeControl()
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT)

  idleListener = () => {
    emitViewportChange()
  }

  kakao.maps.event.addListener(map, 'idle', idleListener)

  resizeObserver = new ResizeObserver(() => {
    if (!map) {
      return
    }

    map.relayout()
  })

  resizeObserver.observe(mapContainer.value)

  const bounds = getViewportBounds()

  emit('map-ready', bounds)
  emit('viewport-change', bounds)
}

function clearMarkers() {
  markers.forEach(({ marker }) => {
    marker.setMap(null)
  })

  markers = []
}

function createMarkerContent(location, isSelected) {
  const button = document.createElement('button')
  const label = document.createElement('strong')
  const pin = document.createElement('span')

  button.type = 'button'
  button.className = `travel-map-marker${isSelected ? ' is-selected' : ''}`
  button.setAttribute(
    'aria-label',
    isSelected ? `선택된 여행지: ${location.name}` : `여행지 선택: ${location.name}`,
  )

  label.className = 'travel-map-marker__label'
  label.textContent = location.name
  pin.className = 'travel-map-marker__pin'
  pin.setAttribute('aria-hidden', 'true')

  button.append(label, pin)
  button.addEventListener('click', () => {
    emit('select-location', location)
  })

  return button
}

function renderMarkers() {
  if (!map || !window.kakao?.maps) {
    return
  }

  clearMarkers()

  const kakao = window.kakao
  const validLocations = props.locations.filter(isValidLocation)

  validLocations.forEach((location) => {
    const position = new kakao.maps.LatLng(Number(location.latitude), Number(location.longitude))

    const isSelected = String(location.id) === String(props.selectedLocationId)

    const marker = new kakao.maps.CustomOverlay({
      map,
      position,
      content: createMarkerContent(location, isSelected),
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: isSelected ? 10 : 1,
    })

    markers.push({
      location,
      marker,
      position,
    })
  })
}

function getViewportBounds() {
  if (!map) {
    return null
  }

  const bounds = map.getBounds()
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()

  return {
    minLat: southWest.getLat(),
    maxLat: northEast.getLat(),
    minLng: southWest.getLng(),
    maxLng: northEast.getLng(),
  }
}

function emitViewportChange() {
  const bounds = getViewportBounds()

  if (bounds) {
    emit('viewport-change', bounds)
  }
}

function moveToLocation(location, options = {}) {
  if (!map || !isValidLocation(location)) {
    return
  }

  const kakao = window.kakao
  const targetPosition = new kakao.maps.LatLng(
    Number(location.latitude),
    Number(location.longitude),
  )

  if (Number.isFinite(options.level)) {
    map.setLevel(options.level)
  }

  if (options.immediate) {
    map.setCenter(targetPosition)
  } else {
    map.panTo(targetPosition)
  }
}

function getGeolocationErrorMessage(error) {
  if (error?.code === error?.PERMISSION_DENIED) {
    return '위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해 주세요.'
  }

  if (error?.code === error?.POSITION_UNAVAILABLE) {
    return '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (error?.code === error?.TIMEOUT) {
    return '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
  }

  return '현재 위치를 불러오지 못했습니다.'
}

function showCurrentLocation(position) {
  if (!map || !window.kakao?.maps) {
    return
  }

  currentLocationOverlay?.setMap(null)

  const markerElement = document.createElement('div')
  markerElement.className = 'travel-map__current-position'
  markerElement.setAttribute('aria-hidden', 'true')

  currentLocationOverlay = new window.kakao.maps.CustomOverlay({
    map,
    position,
    content: markerElement,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: 20,
  })
}

function moveToCurrentLocation() {
  if (!map || isLocating.value) {
    return
  }

  if (!navigator.geolocation) {
    locationError.value = '이 브라우저에서는 현재 위치 기능을 지원하지 않습니다.'
    return
  }

  isLocating.value = true
  locationError.value = ''

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (isUnmounted || !map) {
        return
      }

      const position = new window.kakao.maps.LatLng(coords.latitude, coords.longitude)

      showCurrentLocation(position)

      if (map.getLevel() > 4) {
        map.setLevel(4)
      }

      map.panTo(position)
      isLocating.value = false
    },
    (error) => {
      if (isUnmounted) {
        return
      }

      locationError.value = getGeolocationErrorMessage(error)
      isLocating.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    },
  )
}

function fitLocations(locations) {
  if (!map || !window.kakao?.maps) {
    return
  }

  const validLocations = locations.filter(isValidLocation)

  if (validLocations.length === 0) {
    return
  }

  if (validLocations.length === 1) {
    moveToLocation(validLocations[0], {
      level: 3,
    })
    return
  }

  const kakao = window.kakao
  const bounds = new kakao.maps.LatLngBounds()

  validLocations.forEach((location) => {
    bounds.extend(new kakao.maps.LatLng(Number(location.latitude), Number(location.longitude)))
  })

  map.setBounds(bounds, 60, 60, 60, 60)
}

defineExpose({
  moveToLocation,
  fitLocations,
  relayout() {
    if (!map) {
      return
    }

    map.relayout()
  },
  getViewportBounds,
})

watch(
  () => props.locations,
  async () => {
    await nextTick()
    renderMarkers()
  },
  {
    deep: true,
  },
)

watch(
  () => props.selectedLocationId,
  () => {
    renderMarkers()
  },
)

watch(
  () => props.focusLocation,
  (location) => {
    if (!location) {
      return
    }

    moveToLocation(location, {
      level: 3,
    })
  },
)

onMounted(async () => {
  try {
    await loadKakaoMapSdk()
    createMap()
    renderMarkers()

    if (props.focusLocation) {
      moveToLocation(props.focusLocation, { immediate: true, level: 3 })
    }
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '지도를 불러오지 못했습니다.'

    emit('load-error', mapError.value)
  } finally {
    isMapLoading.value = false
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  clearMarkers()
  currentLocationOverlay?.setMap(null)

  if (map && idleListener && window.kakao?.maps) {
    window.kakao.maps.event.removeListener(map, 'idle', idleListener)
  }

  resizeObserver?.disconnect()

  map = null
  currentLocationOverlay = null
  idleListener = null
  resizeObserver = null
})
</script>

<template>
  <section class="travel-map" aria-label="여행지 지도">
    <div ref="mapContainer" class="travel-map__canvas" />

    <button
      v-if="!isMapLoading && !mapError"
      class="travel-map__location-button"
      type="button"
      :disabled="isLocating"
      :aria-label="isLocating ? '현재 위치 확인 중' : '내 위치로 지도 이동'"
      :title="isLocating ? '현재 위치 확인 중' : '내 위치로 이동'"
      @click="moveToCurrentLocation"
    >
      <span
        v-if="isLocating"
        class="travel-map__location-spinner"
        aria-hidden="true"
      />
      <svg v-else aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <circle cx="12" cy="12" r="7" />
      </svg>
      <span>{{ isLocating ? '위치 확인 중' : '내 위치' }}</span>
    </button>

    <p v-if="locationError" class="travel-map__location-error" role="alert">
      {{ locationError }}
    </p>

    <div v-if="isMapLoading" class="travel-map__state">
      <span class="travel-map__spinner" />
      <p>지도를 불러오는 중입니다.</p>
    </div>

    <div v-else-if="mapError" class="travel-map__state travel-map__state--error">
      <strong>지도를 표시할 수 없습니다.</strong>
      <p>{{ mapError }}</p>
    </div>
  </section>
</template>

<style scoped>
.travel-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-surface-muted);
}

.travel-map__canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.travel-map__location-button {
  position: absolute;
  bottom: var(--spacing-4);
  left: var(--spacing-4);
  z-index: var(--z-index-map-control);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  min-height: 44px;
  padding: 0 var(--spacing-4);
  color: var(--color-text-primary);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.travel-map__location-button:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  box-shadow: var(--shadow-lg);
}

.travel-map__location-button:focus-visible {
  outline: 3px solid rgb(47 125 91 / 25%);
  outline-offset: 2px;
}

.travel-map__location-button:disabled {
  color: var(--color-text-muted);
  cursor: wait;
}

.travel-map__location-button svg,
.travel-map__location-spinner {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.travel-map__location-button svg {
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.travel-map__location-spinner {
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: map-spin 700ms linear infinite;
}

.travel-map__location-error {
  position: absolute;
  bottom: 72px;
  left: var(--spacing-4);
  z-index: var(--z-index-map-control);
  max-width: min(360px, calc(100% - var(--spacing-8)));
  margin: 0;
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  background-color: var(--color-surface);
  border: 1px solid rgb(220 90 90 / 30%);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.travel-map :deep(.travel-map__current-position) {
  width: 18px;
  height: 18px;
  background-color: var(--color-secondary);
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  box-shadow:
    0 0 0 2px var(--color-secondary),
    0 2px 8px rgb(31 41 51 / 30%);
}

.travel-map__state {
  position: absolute;
  inset: 0;
  z-index: var(--z-index-map-control);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  color: var(--color-text-secondary);
  text-align: center;
  background-color: rgb(247 249 248 / 88%);
}

.travel-map__state p {
  margin: 0;
}

.travel-map__state--error {
  color: var(--color-error);
}

.travel-map__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: map-spin 700ms linear infinite;
}

:deep(.travel-map-marker) {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  transform-origin: 50% 100%;
}

:deep(.travel-map-marker__label) {
  max-width: 150px;
  margin-bottom: 7px;
  padding: 5px 10px;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: rgb(255 255 255 / 96%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

:deep(.travel-map-marker__pin) {
  position: relative;
  display: block;
  width: 30px;
  height: 30px;
  background-color: var(--color-primary);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  box-shadow: 0 3px 8px rgb(15 44 32 / 30%);
  transform: rotate(-45deg);
  transition:
    width var(--transition-fast),
    height var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

:deep(.travel-map-marker__pin::after) {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 9px;
  height: 9px;
  background-color: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  content: '';
}

:deep(.travel-map-marker:hover .travel-map-marker__label),
:deep(.travel-map-marker:focus-visible .travel-map-marker__label),
:deep(.travel-map-marker.is-selected .travel-map-marker__label) {
  opacity: 1;
  transform: translateY(0);
}

:deep(.travel-map-marker.is-selected .travel-map-marker__label) {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  border-color: var(--color-primary);
}

:deep(.travel-map-marker.is-selected .travel-map-marker__pin) {
  width: 42px;
  height: 42px;
  background-color: var(--color-accent);
  box-shadow:
    0 4px 12px rgb(15 44 32 / 35%),
    0 0 0 7px rgb(245 158 66 / 24%);
}

:deep(.travel-map-marker.is-selected .travel-map-marker__pin::after) {
  width: 12px;
  height: 12px;
}

:deep(.travel-map-marker:focus-visible) {
  outline: 3px solid rgb(47 125 91 / 35%);
  outline-offset: 4px;
}

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
