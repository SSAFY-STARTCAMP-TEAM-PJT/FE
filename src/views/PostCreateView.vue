<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PostForm from '@/components/post/PostForm.vue'
import { getLocation } from '@/services/locationService'
import { createPost as createPostRequest } from '@/services/posts'

const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)
const isLoadingPlace = ref(false)
const initialPost = ref({ locations: [] })

async function createPost(formData) {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const createdPost = await createPostRequest(formData)
    window.alert('게시글이 등록되었습니다.')
    await router.push(`/posts/${createdPost.id}`)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '게시글 등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function loadInitialLocation() {
  const placeId = typeof route.query.placeId === 'string' ? route.query.placeId : ''
  if (!placeId) return

  isLoadingPlace.value = true

  try {
    const location = await getLocation(placeId)
    initialPost.value = { locations: [location] }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '선택한 여행지를 불러오지 못했습니다.')
  } finally {
    isLoadingPlace.value = false
  }
}

onMounted(loadInitialLocation)
</script>

<template>
  <PostForm
    v-if="!isLoadingPlace"
    mode="create"
    :initial-post="initialPost"
    :loading="isSubmitting"
    @submit="createPost"
    @cancel="router.push('/posts')"
  />
  <div v-else class="loading">선택한 여행지를 불러오고 있습니다.</div>
</template>

<style scoped>
.loading {
  display: grid;
  min-height: calc(100vh - var(--header-height));
  color: var(--color-text-secondary);
  place-items: center;
}
</style>
