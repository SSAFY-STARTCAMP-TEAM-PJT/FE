<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CourseKakaoMap from '@/components/map/CourseKakaoMap.vue'
import { deletePost as deletePostRequest, getPost } from '@/services/posts'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)
const post = ref(null)
const selectedPlaceId = ref(null)
const isLoading = ref(true)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const deletePassword = ref('')
const deleteErrorMessage = ref('')

const selectedPlace = computed(
  () =>
    post.value?.locations.find(
      (item) => String(item.contentId) === String(selectedPlaceId.value),
    ) ??
    post.value?.locations[0] ??
    null,
)
const formattedCreatedAt = computed(() => {
  if (!post.value?.createdAt) return ''
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(post.value.createdAt))
    .replaceAll(' ', '')
})

async function fetchPost() {
  isLoading.value = true
  try {
    post.value = await getPost(route.params.postId)
    selectedPlaceId.value = post.value.locations[0]?.contentId ?? null
  } catch (error) {
    window.alert(
      error instanceof Error ? error.message : '게시글을 불러오는 중 오류가 발생했습니다.',
    )
    await router.replace('/posts')
  } finally {
    isLoading.value = false
  }
}

async function selectPlace(location) {
  const contentId = typeof location === 'object' ? location.contentId : location
  selectedPlaceId.value = contentId
  await nextTick()
  mapRef.value?.focusLocation(selectedPlace.value)
}

function openDeleteModal() {
  deletePassword.value = ''
  deleteErrorMessage.value = ''
  isDeleteModalOpen.value = true
}
function closeDeleteModal() {
  if (isDeleting.value) return
  isDeleteModalOpen.value = false
}
async function deletePost() {
  if (!deletePassword.value.trim()) {
    deleteErrorMessage.value = '비밀번호를 입력해 주세요.'
    return
  }
  isDeleting.value = true
  deleteErrorMessage.value = ''
  try {
    await deletePostRequest(route.params.postId, deletePassword.value)
    window.alert('게시글이 삭제되었습니다.')
    await router.push('/posts')
  } catch (error) {
    deleteErrorMessage.value =
      error instanceof Error ? error.message : '게시글을 삭제하지 못했습니다.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(fetchPost)
</script>

<template>
  <main class="detail-view">
    <div class="container">
      <div v-if="isLoading" class="page-state">게시글을 불러오고 있습니다.</div>

      <article v-else-if="post" class="post-detail">
        <header class="post-header">
          <div>
            <p class="eyebrow">LOCAL COURSE</p>
            <h1>{{ post.title }}</h1>
            <div class="meta">
              <span>{{ post.categoryLabel }}</span
              ><i>·</i><time :datetime="post.createdAt">{{ formattedCreatedAt }}</time>
            </div>
          </div>
          <div class="header-actions">
            <button type="button" @click="router.push(`/posts/${route.params.postId}/edit`)">
              수정</button
            ><button type="button" class="danger" @click="openDeleteModal">삭제</button>
          </div>
        </header>

        <section class="section content">
          <h2 class="sr-only">게시글 내용</h2>
          <p>{{ post.content }}</p>
        </section>

        <section class="section">
          <header class="section-header">
            <div>
              <p class="eyebrow">COURSE MAP</p>
              <h2>여행 코스 지도</h2>
            </div>
            <p>마커나 코스 목록을 선택하면 해당 장소로 이동합니다.</p>
          </header>
          <CourseKakaoMap
            ref="mapRef"
            :locations="post.locations"
            :selected-location-id="selectedPlaceId"
            height="520px"
            @select-location="selectPlace"
          />
        </section>

        <section class="section">
          <header class="section-header">
            <div>
              <p class="eyebrow">ITINERARY</p>
              <h2>코스 순서</h2>
            </div>
            <strong>총 {{ post.locations.length }}곳</strong>
          </header>
          <ol class="course-list">
            <li
              v-for="(location, index) in post.locations"
              :key="location.contentId"
              :class="{ selected: String(location.contentId) === String(selectedPlaceId) }"
            >
              <button type="button" @click="selectPlace(location)">
                <b>{{ index + 1 }}</b
                ><span
                  ><strong>{{ location.name }}</strong
                  ><small>{{ location.address }}</small></span
                ><i>›</i>
              </button>
            </li>
          </ol>
        </section>

        <section v-if="selectedPlace" class="section">
          <header class="section-header">
            <div>
              <p class="eyebrow">SELECTED PLACE</p>
              <h2>선택 여행지 정보</h2>
            </div>
          </header>
          <div class="place-card">
            <div class="place-icon">
              <img
                v-if="selectedPlace.thumbnailImageUrl"
                class="place-thumbnail"
                :src="selectedPlace.thumbnailImageUrl"
                :alt="`${selectedPlace.name} 이미지`"
              />
              <template v-else>⌖</template>
            </div>
            <div>
              <span class="category">{{ selectedPlace.categoryLabel }}</span>
              <h3>{{ selectedPlace.name }}</h3>
              <p>{{ selectedPlace.address }}</p>
              <p>{{ selectedPlace.description }}</p>
              <div class="place-actions">
                <button
                  type="button"
                  class="primary"
                  @click="
                    router.push({ path: '/map', query: { placeId: selectedPlace.contentId } })
                  "
                >
                  지도에서 보기</button
                ><button
                  type="button"
                  @click="
                    router.push({ path: '/posts', query: { placeId: selectedPlace.contentId } })
                  "
                >
                  관련 게시글 보기
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer class="footer">
          <button type="button" @click="router.push('/posts')">목록으로</button>
        </footer>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="isDeleteModalOpen" class="overlay" @click.self="closeDeleteModal">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <header>
            <div>
              <p class="eyebrow">DELETE POST</p>
              <h2 id="delete-title">게시글 삭제</h2>
            </div>
            <button type="button" :disabled="isDeleting" @click="closeDeleteModal">×</button>
          </header>
          <p>게시글 작성 시 설정한 비밀번호를 입력해 주세요. 삭제한 게시글은 복구할 수 없습니다.</p>
          <form @submit.prevent="deletePost">
            <label
              >수정·삭제용 비밀번호<input
                v-model="deletePassword"
                type="password"
                maxlength="20"
                autocomplete="current-password"
                autofocus /></label
            ><small v-if="deleteErrorMessage">{{ deleteErrorMessage }}</small>
            <div>
              <button type="button" :disabled="isDeleting" @click="closeDeleteModal">취소</button
              ><button type="submit" class="danger-fill" :disabled="isDeleting">
                {{ isDeleting ? '삭제 중...' : '삭제하기' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.detail-view {
  min-height: calc(100vh - var(--header-height));
  padding: var(--spacing-8) 0 var(--spacing-16);
}
.page-state {
  display: grid;
  place-items: center;
  min-height: 480px;
  color: var(--color-text-secondary);
}
.post-detail {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.post-header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-5);
  padding: var(--spacing-6);
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
}
.post-header h1 {
  margin: 0;
  font-size: var(--font-size-3xl);
}
.eyebrow {
  margin: 0 0 var(--spacing-2);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
}
.meta {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  color: var(--color-text-secondary);
}
.meta span {
  color: var(--color-primary);
  font-weight: 600;
}
.header-actions,
.place-actions {
  display: flex;
  gap: var(--spacing-2);
}
.header-actions button {
  max-height: 40px;
  margin-top: auto;
}
button {
  min-height: 40px;
  padding: 0 var(--spacing-4);
  color: var(--color-text-secondary);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.danger {
  color: var(--color-error);
  border-color: rgb(220 90 90 / 35%);
}
.section {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border-light);
}
.content p {
  margin: 0;
  line-height: 1.9;
  white-space: pre-wrap;
}
.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}
.section-header h2,
.section-header p {
  margin: 0;
}
.section-header > p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.course-list {
  display: grid;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.course-list li {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}
.course-list li.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}
.course-list button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  height: auto;
  padding: var(--spacing-3);
  text-align: left;
  background: transparent;
  border: 0;
}
.course-list b {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: white;
  background: var(--color-primary);
  border-radius: 50%;
}
.course-list span {
  display: grid;
  gap: 3px;
}
.course-list small {
  color: var(--color-text-secondary);
}
.place-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-5);
  padding: var(--spacing-5);
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.place-icon {
  display: grid;
  place-items: center;
  overflow: hidden;
  min-height: 120px;
  color: var(--color-primary);
  font-size: 40px;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
}
.place-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.place-card h3 {
  margin: var(--spacing-1) 0;
  font-size: var(--font-size-xl);
}
.place-card p {
  color: var(--color-text-secondary);
}
.category {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.primary {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.footer {
  padding: var(--spacing-5);
  text-align: right;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-modal);
  display: grid;
  place-items: center;
  padding: var(--spacing-4);
  background: var(--color-overlay);
}
.modal {
  width: min(100%, 460px);
  padding: var(--spacing-6);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.modal header {
  display: flex;
  justify-content: space-between;
}
.modal h2 {
  margin: 0;
}
.modal form,
.modal label {
  display: grid;
  gap: var(--spacing-2);
}
.modal input {
  height: 46px;
  padding: 0 var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.modal small {
  color: var(--color-error);
}
.modal form > div {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}
.danger-fill {
  color: white;
  background: var(--color-error);
  border-color: var(--color-error);
}
@media (max-width: 700px) {
  .post-header,
  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .place-card {
    grid-template-columns: 1fr;
  }
  .header-actions,
  .place-actions {
    width: 100%;
  }
  .header-actions button,
  .place-actions button {
    flex: 1;
  }
}
</style>
