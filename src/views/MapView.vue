<script setup>
import { onMounted, ref } from 'vue'
import LocationCard from '@/components/location/LocationCard.vue'
import { useKakaoMap } from '@/composables/useKakaoMap'

const mapContainer = ref(null)
const { loadMap } = useKakaoMap()

onMounted(() => {
  if (mapContainer.value) {
    loadMap(mapContainer.value)
  }
})
</script>

<template>
  <section class="view-card">
    <h1>지도</h1>
    <LocationCard title="현재 위치" description="카카오 지도 API가 연결될 자리입니다." />
    <div ref="mapContainer" class="map-placeholder" />
  </section>
</template>

<style scoped>
.view-card {
  display: grid;
  gap: 1rem;
}

.map-placeholder {
  min-height: 320px;
  border: 1px dashed #9ca3af;
  border-radius: 12px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}
</style>
