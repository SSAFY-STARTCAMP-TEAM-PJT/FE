<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostForm from '@/components/post/PostForm.vue'

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const isSubmitting = ref(false)
const post = ref(null)

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

const mockPost = {
  id: 12,
  category: 'COURSE',
  title: '부산 하루 여행 코스',
  content: '해운대부터 광안리까지 이동하는 하루 여행 코스입니다.',
  locations: [
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
  ],
}

const fetchPost = async () => {
  isLoading.value = true

  try {
    /*
    const response = await fetch(`/api/posts/${route.params.postId}`)

    if (response.status === 404) {
      window.alert('존재하지 않는 게시글입니다.')
      router.replace('/posts')
      return
    }

    if (!response.ok) {
      throw new Error('게시글 조회에 실패했습니다.')
    }

    post.value = await response.json()
    */

    console.log('수정할 게시글 ID:', route.params.postId)

    post.value = mockPost
  } catch (error) {
    console.error(error)
    window.alert('게시글을 불러오는 중 오류가 발생했습니다.')
    router.replace('/posts')
  } finally {
    isLoading.value = false
  }
}

const updatePost = async (formData) => {
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
    const response = await fetch(
      `/api/posts/${route.params.postId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )

    if (response.status === 403) {
      window.alert('비밀번호가 일치하지 않습니다.')
      return
    }

    if (response.status === 404) {
      window.alert('존재하지 않는 게시글입니다.')
      router.replace('/posts')
      return
    }

    if (!response.ok) {
      throw new Error('게시글 수정에 실패했습니다.')
    }
    */

    console.log('게시글 수정:', payload)

    window.alert('게시글이 수정되었습니다.')
    router.push(`/posts/${route.params.postId}`)
  } catch (error) {
    console.error(error)
    window.alert('게시글 수정 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  router.push(`/posts/${route.params.postId}`)
}

onMounted(fetchPost)
</script>

<template>
  <div v-if="isLoading" class="edit-loading">게시글을 불러오고 있습니다.</div>
  <PostForm
    mode="edit"
    :initial-post="post"
    :locations="locations"
    :loading="isSubmitting"
    @submit="updatePost"
    @cancel="cancelEdit"
  />
</template>

<style scoped>
.edit-loading {
  display: flex;
  min-height: calc(100vh - var(--header-height));
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}
</style>
