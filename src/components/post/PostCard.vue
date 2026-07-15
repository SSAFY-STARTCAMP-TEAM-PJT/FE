<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  locationName: {
    type: String,
    default: '미정',
  },
})
</script>

<template>
  <article class="post-card">
    <h2>{{ title }}</h2>
    <p>{{ content }}</p>
    <span class="location">장소: {{ locationName }}</span>
  </article>
</template>

<style scoped>
.post-card {
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
}

.location {
  display: inline-block;
  margin-top: 0.75rem;
  color: #6b7280;
  font-size: 0.95rem;
}
</style>
