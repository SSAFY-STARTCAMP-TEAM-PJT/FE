<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  locations: { type: Array, default: () => [] },
  selectedLocationId: { type: [String, Number], default: null },
  interactive: { type: Boolean, default: true },
  height: { type: String, default: '420px' },
})

const emit = defineEmits(['select-location', 'ready', 'error'])
const mapElement = ref(null)
const loading = ref(true)
const errorMessage = ref('')

let map = null
let overlays = []
let polyline = null
let resizeObserver = null

function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve)
      return
    }

    const key = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY
    if (!key) {
      reject(new Error('VITE_KAKAO_MAP_JAVASCRIPT_KEY가 설정되지 않았습니다.'))
      return
    }

    const existing = document.querySelector('script[data-kakao-map-sdk="true"]')
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(resolve), { once: true })
      existing.addEventListener('error', () => reject(new Error('Kakao Maps SDK 로드 실패')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.dataset.kakaoMapSdk = 'true'
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    script.onerror = () => reject(new Error('Kakao Maps SDK 로드 실패'))
    document.head.appendChild(script)
  })
}

function validLocations() {
  return props.locations.filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
}

function clearMapObjects() {
  overlays.forEach((overlay) => overlay.setMap(null))
  overlays = []
  polyline?.setMap(null)
  polyline = null
}

function markerHtml(location, index) {
  const selected = String(location.contentId) === String(props.selectedLocationId)
  return `
    <button class="course-map-marker${selected ? ' is-selected' : ''}" type="button" aria-label="${index + 1}번 ${location.name}">
      <span>${index + 1}</span>
      <strong>${location.shortName ?? location.name}</strong>
    </button>
  `
}

function render() {
  if (!map || !window.kakao?.maps) return
  clearMapObjects()

  const kakao = window.kakao
  const items = validLocations()
  if (!items.length) return

  const bounds = new kakao.maps.LatLngBounds()
  const path = []

  items.forEach((location, index) => {
    const position = new kakao.maps.LatLng(Number(location.latitude), Number(location.longitude))
    bounds.extend(position)
    path.push(position)

    const content = document.createElement('div')
    content.innerHTML = markerHtml(location, index)
    const button = content.firstElementChild
    button.addEventListener('click', () => {
      if (props.interactive) emit('select-location', location)
    })

    const overlay = new kakao.maps.CustomOverlay({
      map,
      position,
      content: button,
      xAnchor: 0.5,
      yAnchor: 1.15,
      zIndex: String(location.contentId) === String(props.selectedLocationId) ? 20 : 10,
    })
    overlays.push(overlay)
  })

  if (path.length > 1) {
    polyline = new kakao.maps.Polyline({
      map,
      path,
      strokeWeight: 4,
      strokeColor: '#2f7d5b',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
    })
  }

  if (items.length === 1) {
    map.setCenter(path[0])
    map.setLevel(4)
  } else {
    map.setBounds(bounds, 70, 70, 70, 70)
  }
}

function focusLocation(location) {
  if (!map || !location) return
  const position = new window.kakao.maps.LatLng(Number(location.latitude), Number(location.longitude))
  map.panTo(position)
  map.setLevel(4, { anchor: position })
}

defineExpose({ focusLocation, render })

watch(() => props.locations, async () => { await nextTick(); render() }, { deep: true })
watch(() => props.selectedLocationId, () => render())

onMounted(async () => {
  try {
    await loadSdk()
    const center = validLocations()[0] ?? { latitude: 35.1595, longitude: 129.1602 }
    map = new window.kakao.maps.Map(mapElement.value, {
      center: new window.kakao.maps.LatLng(Number(center.latitude), Number(center.longitude)),
      level: 6,
    })
    map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT)
    resizeObserver = new ResizeObserver(() => map?.relayout())
    resizeObserver.observe(mapElement.value)
    render()
    emit('ready')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '지도를 불러오지 못했습니다.'
    emit('error', errorMessage.value)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearMapObjects()
  resizeObserver?.disconnect()
  map = null
})
</script>

<template>
  <div class="course-map" :style="{ height }">
    <div ref="mapElement" class="course-map__canvas" />
    <div v-if="loading" class="course-map__state">지도를 불러오는 중입니다.</div>
    <div v-else-if="errorMessage" class="course-map__state course-map__state--error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.course-map { position: relative; width: 100%; min-height: 280px; overflow: hidden; border-radius: var(--radius-md); background: var(--color-surface-muted); }
.course-map__canvas { width: 100%; height: 100%; }
.course-map__state { position:absolute; inset:0; display:grid; place-items:center; padding:var(--spacing-5); color:var(--color-text-secondary); background:rgb(247 249 248 / 88%); text-align:center; }
.course-map__state--error { color:var(--color-error); }
:deep(.course-map-marker) { display:grid; justify-items:center; gap:4px; padding:0; color:var(--color-text-primary); background:transparent; border:0; cursor:pointer; }
:deep(.course-map-marker span) { display:grid; place-items:center; width:34px; height:34px; color:white; font-weight:700; background:var(--color-primary); border:3px solid white; border-radius:50%; box-shadow:var(--shadow-md); }
:deep(.course-map-marker strong) { max-width:120px; padding:4px 8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:12px; background:white; border:1px solid var(--color-border); border-radius:var(--radius-full); box-shadow:var(--shadow-sm); }
:deep(.course-map-marker.is-selected span) { width:42px; height:42px; background:var(--color-accent); }
:deep(.course-map-marker.is-selected strong) { color:var(--color-primary); border-color:var(--color-primary); }
</style>
