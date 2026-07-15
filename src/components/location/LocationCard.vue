<script setup>
defineProps({
  title: {
    type: String,
    default: '위치 정보',
  },
  description: {
    type: String,
    default: '위치 설명이 여기에 표시됩니다.',
  },
})
</script>

<template>
  <section class="location-card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </section>
</template>

<style scoped>
.location-card {
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
}
</style>
