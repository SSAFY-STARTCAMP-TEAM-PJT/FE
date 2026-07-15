<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PostForm from '@/components/post/PostForm.vue'

const router = useRouter()
const isSubmitting = ref(false)

const locations = ref([
  {
    contentId: '126508',
    name: '해운대 해수욕장',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    address: '부산광역시 해운대구 해운대해변로 264',
  },
  {
    contentId: '126509',
    name: '동백섬',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    address: '부산광역시 해운대구 우동',
  },
  {
    contentId: '126510',
    name: '광안리 해수욕장',
    category: 'ATTRACTION',
    categoryLabel: '관광지',
    address: '부산광역시 수영구 광안해변로 219',
  },
  {
    contentId: '126511',
    name: '해운대 전통시장',
    category: 'RESTAURANT',
    categoryLabel: '맛집',
    address: '부산광역시 해운대구 구남로41번길 22-1',
  },
  {
    contentId: '126512',
    name: '부산시립미술관',
    category: 'CULTURE',
    categoryLabel: '문화',
    address: '부산광역시 해운대구 APEC로 58',
  },
])

const createPost = async (formData) => {
  if (isSubmitting.value) {
    return
  }

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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('게시글 등록에 실패했습니다.')
    }

    const createdPost = await response.json()
    router.push(`/posts/${createdPost.id}`)
    */

    console.log('게시글 등록:', payload)

    window.alert('게시글이 등록되었습니다.')
    router.push('/posts')
  } catch (error) {
    console.error(error)
    window.alert('게시글 등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const cancelCreate = () => {
  router.push('/posts')
}
</script>

<template>
  <PostForm
    mode="create"
    :locations="locations"
    :loading="isSubmitting"
    @submit="createPost"
    @cancel="cancelCreate"
  />
</template>
