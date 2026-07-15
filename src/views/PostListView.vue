<script setup>
import PostCard from '@/components/post/PostCard.vue'

const posts = [
  {
    title: '추천 포스트 1',
    content: 'FastAPI와 연동할 기본 포스트 카드입니다.',
    locationName: '강남역',
  },
  {
    title: '추천 포스트 2',
    content: '카카오 지도와 연결할 수 있는 구조를 구성했습니다.',
    locationName: '홍대입구',
  },
]
</script>

<template>
  <section class="view-card">
    <h1>포스트 목록</h1>
    <div class="post-grid">
      <PostCard
        v-for="post in posts"
        :key="post.title"
        :title="post.title"
        :content="post.content"
        :location-name="post.locationName"
      />
    </div>
  </section>
</template>

<style scoped>
.view-card {
  display: grid;
  gap: 1rem;
}

.post-grid {
  display: grid;
  gap: 1rem;
}
</style>
