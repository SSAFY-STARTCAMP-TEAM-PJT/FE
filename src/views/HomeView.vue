<script setup>
import { onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { fetchHealthCheck } from '@/services/api'

const appStore = useAppStore()
const health = ref(null)

onMounted(async () => {
  appStore.setAppTitle('StartCamp Map App')
  health.value = await fetchHealthCheck()
})
</script>

<template>
  <section class="view-card">
    <h1>홈</h1>
    <p>Vue 3 Composition API 기반 기본 구조가 준비되었습니다.</p>
    <p v-if="health" class="status">{{ health.message }}</p>
  </section>
</template>

<style scoped>
.view-card {
  display: grid;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.status {
  color: #2563eb;
  font-weight: 600;
}
</style>
