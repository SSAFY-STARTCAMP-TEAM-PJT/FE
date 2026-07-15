<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PostForm from '@/components/post/PostForm.vue'
import { locations } from '@/data/locationData'

const router = useRouter()
const isSubmitting = ref(false)

async function createPost(formData) {
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
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('게시글 등록에 실패했습니다.')
    const createdPost = await response.json()
    router.push(`/posts/${createdPost.id}`)
    */

    console.log('게시글 등록:', payload)
    window.alert('게시글이 등록되었습니다.')
    router.push('/posts')
  } catch (error) {
    console.error(error)
    window.alert(error instanceof Error ? error.message : '게시글 등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PostForm
    mode="create"
    :locations="locations"
    :loading="isSubmitting"
    @submit="createPost"
    @cancel="router.push('/posts')"
  />
</template>
