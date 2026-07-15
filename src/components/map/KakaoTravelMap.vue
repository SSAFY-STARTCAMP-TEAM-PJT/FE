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

const emit = defineEmits(['select-location', 'bounds-change', 'map-ready', 'load-error'])

const mapContainer = ref(null)
const isMapLoading = ref(true)
const mapError = ref('')

let map = null
let markers = []
let idleListener = null
let resizeObserver = null

const DEFAULT_CENTER = {
  latitude: 35.1595454,
  longitude: 129.1602466,
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
    level: 6,
  })

  map.setMaxLevel(12)
  map.setMinLevel(1)

  const zoomControl = new kakao.maps.ZoomControl()
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT)

  const mapTypeControl = new kakao.maps.MapTypeControl()
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT)

  idleListener = () => {
    emitVisibleLocations()
  }

  kakao.maps.event.addListener(map, 'idle', idleListener)

  resizeObserver = new ResizeObserver(() => {
    if (!map) {
      return
    }

    map.relayout()
  })

  resizeObserver.observe(mapContainer.value)

  emit('map-ready')
}

function clearMarkers() {
  markers.forEach(({ marker }) => {
    marker.setMap(null)
  })

  markers = []
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

    const marker = new kakao.maps.Marker({
      map,
      position,
      title: location.name,
      zIndex: isSelected ? 10 : 1,
    })

    kakao.maps.event.addListener(marker, 'click', () => {
      emit('select-location', location)
    })

    markers.push({
      location,
      marker,
      position,
    })
  })

  emitVisibleLocations()
}

function emitVisibleLocations() {
  if (!map) {
    return
  }

  const bounds = map.getBounds()

  const visibleLocationIds = markers
    .filter(({ position }) => bounds.contain(position))
    .map(({ location }) => String(location.id))

  emit('bounds-change', visibleLocationIds)
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

  if (options.immediate) {
    map.setCenter(targetPosition)
  } else {
    map.panTo(targetPosition)
  }

  if (Number.isFinite(options.level)) {
    map.setLevel(options.level, {
      anchor: targetPosition,
    })
  }
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
      level: 4,
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
      level: 4,
    })
  },
)

onMounted(async () => {
  try {
    await loadKakaoMapSdk()
    createMap()
    renderMarkers()
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '지도를 불러오지 못했습니다.'

    emit('load-error', mapError.value)
  } finally {
    isMapLoading.value = false
  }
})

onBeforeUnmount(() => {
  clearMarkers()

  if (map && idleListener && window.kakao?.maps) {
    window.kakao.maps.event.removeListener(map, 'idle', idleListener)
  }

  resizeObserver?.disconnect()

  map = null
  idleListener = null
  resizeObserver = null
})
</script>

<template>
  <section class="travel-map" aria-label="여행지 지도">
    <div ref="mapContainer" class="travel-map__canvas" />

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
  min-height: 620px;
  overflow: hidden;
  background-color: var(--color-surface-muted);
}

.travel-map__canvas {
  width: 100%;
  height: 100%;
  min-height: inherit;
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

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .travel-map,
  .travel-map__canvas {
    min-height: 460px;
  }
}

@media (max-width: 640px) {
  .travel-map,
  .travel-map__canvas {
    min-height: 390px;
  }
}
</style>
