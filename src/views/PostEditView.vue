<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostForm from '@/components/post/PostForm.vue'
import { locations, mockPost } from '@/data/locationData'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const isSubmitting = ref(false)
const post = ref(null)

async function fetchPost() {
  isLoading.value = true
  try {
    /*
    const response = await fetch(`/api/posts/${route.params.postId}`)
    if (response.status === 404) {
      window.alert('존재하지 않는 게시글입니다.')
      router.replace('/posts')
      return
    }
    if (!response.ok) throw new Error('게시글 조회에 실패했습니다.')
    post.value = await response.json()
    */
    console.log('수정 게시글 ID:', route.params.postId)
    post.value = { ...mockPost, locations: mockPost.locations.map((item) => ({ ...item })) }
  } catch (error) {
    console.error(error)
    window.alert('게시글을 불러오는 중 오류가 발생했습니다.')
    router.replace('/posts')
  } finally {
    isLoading.value = false
  }
}

async function updatePost(formData) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const payload = {
      category: formData.category,
      title: formData.title,
      content: formData.content,
      password: formData.password,
      locationIds: formData.locationIds,
    }

    /*
    const response = await fetch(`/api/posts/${route.params.postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (response.status === 403) {
      window.alert('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!response.ok) throw new Error('게시글 수정에 실패했습니다.')
    */

    console.log('게시글 수정:', payload)
    window.alert('게시글이 수정되었습니다.')
    router.push(`/posts/${route.params.postId}`)
  } catch (error) {
    console.error(error)
    window.alert(error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchPost)
</script>

<template>
  <div v-if="isLoading" class="loading">게시글을 불러오고 있습니다.</div>
  <PostForm
    v-else-if="post"
    mode="edit"
    :initial-post="post"
    :locations="locations"
    :loading="isSubmitting"
    @submit="updatePost"
    @cancel="router.push(`/posts/${route.params.postId}`)"
  />
</template>

<style scoped>
.loading{display:grid;place-items:center;min-height:calc(100vh - var(--header-height));color:var(--color-text-secondary)}
</style>
