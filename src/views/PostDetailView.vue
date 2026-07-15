<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const post = ref(null)
const selectedPlaceId = ref(null)

const isLoading = ref(true)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

const deletePassword = ref('')
const deleteErrorMessage = ref('')

/*
  추후 API 응답 형태 예시

  {
    id: 12,
    category: 'COURSE',
    categoryLabel: '여행 코스',
    title: '부산 하루 여행 코스',
    content: '해운대부터 광안리까지 이동하는 코스입니다.',
    createdAt: '2026-07-14T10:30:00',
    locations: [
      {
        contentId: '126508',
        name: '해운대 해수욕장',
        address: '부산광역시 해운대구 해운대해변로 264',
        categoryLabel: '관광지',
        latitude: 35.158698,
        longitude: 129.160384,
        description: '부산을 대표하는 해수욕장입니다.',
      },
    ],
  }
*/

const mockPost = {
  id: 12,
  category: 'COURSE',
  categoryLabel: '여행 코스',
  title: '부산 하루 여행 코스',
  content:
    '해운대부터 광안리까지 이동하는 하루 여행 코스입니다. 바다 풍경을 따라 산책하고 부산의 대표적인 해변을 둘러볼 수 있습니다.',
  createdAt: '2026-07-14T10:30:00',
  locations: [
    {
      contentId: '126508',
      name: '해운대 해수욕장',
      shortName: '해운대',
      address: '부산광역시 해운대구 해운대해변로 264',
      categoryLabel: '관광지',
      latitude: 35.158698,
      longitude: 129.160384,
      description:
        '부산을 대표하는 해수욕장으로 넓은 백사장과 다양한 주변 관광시설을 갖추고 있습니다.',
      nearbyLocations: [
        {
          contentId: '126509',
          name: '동백섬',
        },
        {
          contentId: '126513',
          name: '달맞이길',
        },
        {
          contentId: '126514',
          name: '블루라인파크',
        },
      ],
    },
    {
      contentId: '126509',
      name: '동백섬',
      shortName: '동백섬',
      address: '부산광역시 해운대구 우동',
      categoryLabel: '관광지',
      latitude: 35.153215,
      longitude: 129.1527,
      description: '해운대 해수욕장 인근에 위치한 산책 명소로 해안 풍경을 감상할 수 있습니다.',
      nearbyLocations: [
        {
          contentId: '126508',
          name: '해운대 해수욕장',
        },
        {
          contentId: '126515',
          name: '누리마루 APEC 하우스',
        },
        {
          contentId: '126516',
          name: '더베이101',
        },
      ],
    },
    {
      contentId: '126510',
      name: '광안리 해수욕장',
      shortName: '광안리',
      address: '부산광역시 수영구 광안해변로 219',
      categoryLabel: '관광지',
      latitude: 35.153169,
      longitude: 129.118666,
      description: '광안대교 야경과 해변 주변의 카페와 음식점을 함께 즐길 수 있는 여행지입니다.',
      nearbyLocations: [
        {
          contentId: '126517',
          name: '민락수변공원',
        },
        {
          contentId: '126518',
          name: '광안대교',
        },
        {
          contentId: '126519',
          name: '수영사적공원',
        },
      ],
    },
  ],
}

const selectedPlace = computed(() => {
  if (!post.value?.locations.length) {
    return null
  }

  return (
    post.value.locations.find((location) => location.contentId === selectedPlaceId.value) ??
    post.value.locations[0]
  )
})

const formattedCreatedAt = computed(() => {
  if (!post.value?.createdAt) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(post.value.createdAt))
    .replaceAll(' ', '')
})

const fetchPost = async () => {
  isLoading.value = true

  try {
    /*
    실제 API 연동 예시

    const response = await fetch(`/api/posts/${route.params.postId}`)

    if (!response.ok) {
      throw new Error('게시글을 불러오지 못했습니다.')
    }

    post.value = await response.json()
    */

    console.log('조회 게시글 ID:', route.params.postId)

    post.value = mockPost
    selectedPlaceId.value = mockPost.locations[0]?.contentId ?? null
  } catch (error) {
    console.error(error)
    window.alert('게시글을 불러오는 중 오류가 발생했습니다.')
    router.push('/posts')
  } finally {
    isLoading.value = false
  }
}

const selectPlace = (contentId) => {
  selectedPlaceId.value = contentId

  /*
    Kakao Map 연동 이후:
    해당 마커로 지도 중심을 이동시키거나
    지도 인포윈도우를 표시합니다.
  */
}

const moveToEdit = () => {
  router.push(`/posts/${route.params.postId}/edit`)
}

const openDeleteModal = () => {
  deletePassword.value = ''
  deleteErrorMessage.value = ''
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  if (isDeleting.value) {
    return
  }

  isDeleteModalOpen.value = false
  deletePassword.value = ''
  deleteErrorMessage.value = ''
}

const deletePost = async () => {
  if (!deletePassword.value.trim()) {
    deleteErrorMessage.value = '비밀번호를 입력해 주세요.'
    return
  }

  isDeleting.value = true
  deleteErrorMessage.value = ''

  try {
    /*
    실제 API 연동 예시

    const response = await fetch(`/api/posts/${route.params.postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: deletePassword.value,
      }),
    })

    if (response.status === 401 || response.status === 403) {
      deleteErrorMessage.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    if (!response.ok) {
      throw new Error('게시글 삭제에 실패했습니다.')
    }
    */

    const mockPassword = '1234'

    if (deletePassword.value !== mockPassword) {
      deleteErrorMessage.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    window.alert('게시글이 삭제되었습니다.')
    router.push('/posts')
  } catch (error) {
    console.error(error)
    deleteErrorMessage.value = '게시글 삭제 중 오류가 발생했습니다.'
  } finally {
    isDeleting.value = false
  }
}

const moveToMap = (placeId) => {
  router.push({
    path: '/map',
    query: {
      placeId,
    },
  })
}

const moveToRelatedPosts = (placeId) => {
  router.push({
    path: '/posts',
    query: {
      placeId,
    },
  })
}

const moveToNearbyPlace = (placeId) => {
  const courseLocation = post.value.locations.find((location) => location.contentId === placeId)

  if (courseLocation) {
    selectPlace(placeId)
    return
  }

  moveToMap(placeId)
}

const handleModalBackgroundClick = () => {
  closeDeleteModal()
}

onMounted(fetchPost)
</script>

<template>
  <main class="post-detail-view">
    <div class="container">
      <div v-if="isLoading" class="page-state">
        <span class="loading-spinner" aria-hidden="true" />
        <p>게시글을 불러오고 있습니다.</p>
      </div>

      <article v-else-if="post" class="post-detail">
        <header class="post-header">
          <div class="post-heading">
            <p class="post-eyebrow">LOCAL COURSE</p>

            <h1 class="post-title">
              {{ post.title }}
            </h1>

            <div class="post-meta">
              <span class="category-badge">
                {{ post.categoryLabel }}
              </span>

              <span aria-hidden="true">·</span>

              <time :datetime="post.createdAt">
                {{ formattedCreatedAt }}
              </time>
            </div>
          </div>

          <div class="post-actions">
            <button class="button button--secondary" type="button" @click="moveToEdit">수정</button>

            <button class="button button--danger-outline" type="button" @click="openDeleteModal">
              삭제
            </button>
          </div>
        </header>

        <section class="detail-section post-content-section">
          <h2 class="sr-only">게시글 내용</h2>

          <p class="post-content">
            {{ post.content }}
          </p>
        </section>

        <section class="detail-section">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">COURSE MAP</p>
              <h2 class="section-title">여행 코스 지도</h2>
            </div>

            <p class="section-description">마커를 선택하면 해당 여행지 정보가 표시됩니다.</p>
          </div>

          <div class="map-preview">
            <div class="map-grid" aria-hidden="true" />

            <div class="course-route">
              <template v-for="(location, index) in post.locations" :key="location.contentId">
                <button
                  class="map-marker-item"
                  :class="{
                    'map-marker-item--selected': location.contentId === selectedPlaceId,
                  }"
                  type="button"
                  :aria-label="`${index + 1}번 ${location.name} 선택`"
                  @click="selectPlace(location.contentId)"
                >
                  <span class="map-marker">
                    {{ index + 1 }}
                  </span>

                  <span class="map-marker-label">
                    {{ location.shortName }}
                  </span>
                </button>

                <span
                  v-if="index < post.locations.length - 1"
                  class="route-line"
                  aria-hidden="true"
                />
              </template>
            </div>

            <p class="map-guide">
              Kakao Map 연동 후 실제 좌표를 기준으로 번호 마커와 직선 연결선을 표시합니다.
            </p>
          </div>
        </section>

        <section class="detail-section">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">ITINERARY</p>
              <h2 class="section-title">코스 순서</h2>
            </div>

            <span class="location-count"> 총 {{ post.locations.length }}곳 </span>
          </div>

          <ol class="course-list">
            <li
              v-for="(location, index) in post.locations"
              :key="location.contentId"
              class="course-list-item"
              :class="{
                'course-list-item--selected': location.contentId === selectedPlaceId,
              }"
            >
              <button
                class="course-list-button"
                type="button"
                @click="selectPlace(location.contentId)"
              >
                <span class="course-order">
                  {{ index + 1 }}
                </span>

                <span class="course-information">
                  <strong class="course-name">
                    {{ location.name }}
                  </strong>

                  <span class="course-address">
                    {{ location.address }}
                  </span>
                </span>

                <span class="course-arrow" aria-hidden="true"> › </span>
              </button>
            </li>
          </ol>
        </section>

        <section v-if="selectedPlace" class="detail-section">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">SELECTED PLACE</p>
              <h2 class="section-title">선택 여행지 정보</h2>
            </div>
          </div>

          <div class="selected-place-card">
            <div class="selected-place-thumbnail">
              <span aria-hidden="true">⌖</span>
            </div>

            <div class="selected-place-content">
              <div class="selected-place-heading">
                <div>
                  <span class="place-category">
                    {{ selectedPlace.categoryLabel }}
                  </span>

                  <h3 class="selected-place-name">
                    {{ selectedPlace.name }}
                  </h3>
                </div>
              </div>

              <p class="selected-place-address">
                {{ selectedPlace.address }}
              </p>

              <p class="selected-place-description">
                {{ selectedPlace.description }}
              </p>

              <div class="selected-place-actions">
                <button
                  class="button button--primary"
                  type="button"
                  @click="moveToMap(selectedPlace.contentId)"
                >
                  지도에서 보기
                </button>

                <button
                  class="button button--secondary"
                  type="button"
                  @click="moveToRelatedPosts(selectedPlace.contentId)"
                >
                  관련 게시글 보기
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="selectedPlace?.nearbyLocations.length" class="detail-section">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">NEARBY</p>
              <h2 class="section-title">근처 여행지</h2>
            </div>
          </div>

          <div class="nearby-location-list">
            <button
              v-for="nearbyLocation in selectedPlace.nearbyLocations"
              :key="nearbyLocation.contentId"
              class="nearby-location-button"
              type="button"
              @click="moveToNearbyPlace(nearbyLocation.contentId)"
            >
              <span class="nearby-icon" aria-hidden="true">⌖</span>

              <span>{{ nearbyLocation.name }}</span>

              <span class="nearby-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        <footer class="post-footer">
          <button class="button button--secondary" type="button" @click="router.push('/posts')">
            목록으로
          </button>
        </footer>
      </article>
    </div>

    <Teleport to="body">
      <div
        v-if="isDeleteModalOpen"
        class="modal-overlay"
        role="presentation"
        @click.self="handleModalBackgroundClick"
      >
        <section
          class="delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div class="modal-header">
            <div>
              <p class="modal-eyebrow">DELETE POST</p>

              <h2 id="delete-modal-title" class="modal-title">게시글 삭제</h2>
            </div>

            <button
              class="modal-close-button"
              type="button"
              aria-label="삭제 창 닫기"
              :disabled="isDeleting"
              @click="closeDeleteModal"
            >
              ×
            </button>
          </div>

          <p class="modal-description">
            게시글 작성 시 설정한 비밀번호를 입력해 주세요. 삭제된 게시글은 복구할 수 없습니다.
          </p>

          <form class="delete-form" @submit.prevent="deletePost">
            <div class="form-field">
              <label for="delete-password" class="field-label"> 수정·삭제용 비밀번호 </label>

              <input
                id="delete-password"
                v-model="deletePassword"
                class="form-control"
                :class="{
                  'form-control--error': deleteErrorMessage,
                }"
                type="password"
                maxlength="20"
                autocomplete="current-password"
                placeholder="비밀번호 입력"
                autofocus
              />

              <p v-if="deleteErrorMessage" class="form-error-message" role="alert">
                {{ deleteErrorMessage }}
              </p>
            </div>

            <div class="modal-actions">
              <button
                class="button button--secondary"
                type="button"
                :disabled="isDeleting"
                @click="closeDeleteModal"
              >
                취소
              </button>

              <button class="button button--danger" type="submit" :disabled="isDeleting">
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
.post-detail-view {
  min-height: calc(100vh - var(--header-height));
  padding-block: var(--spacing-8) var(--spacing-16);
}

.post-detail {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-6);
  padding: var(--spacing-8);
  border-bottom: 1px solid var(--color-border);
}

.post-heading {
  min-width: 0;
}

.post-eyebrow,
.section-eyebrow,
.modal-eyebrow {
  margin: 0 0 var(--spacing-2);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
}

.post-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(var(--font-size-2xl), 4vw, var(--font-size-3xl));
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.category-badge,
.place-category,
.location-count {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding-inline: var(--spacing-3);
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.post-actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--spacing-2);
}

.detail-section {
  padding: var(--spacing-8);
  border-bottom: 1px solid var(--color-border);
}

.post-content-section {
  background: var(--color-surface-hover);
}

.post-content {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  line-height: 1.9;
  white-space: pre-wrap;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-5);
}

.section-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.section-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-align: right;
}

.map-preview {
  position: relative;
  display: flex;
  min-height: 330px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-8);
  overflow: hidden;
  padding: var(--spacing-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-primary-light);
}

.map-grid {
  position: absolute;
  inset: 0;
  opacity: 0.65;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 39px, rgb(47 125 91 / 8%) 40px),
    repeating-linear-gradient(90deg, transparent 0, transparent 39px, rgb(47 125 91 / 8%) 40px);
}

.course-route {
  position: relative;
  z-index: var(--z-index-base);
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: center;
  overflow-x: auto;
  padding: var(--spacing-4);
}

.map-marker-item {
  display: flex;
  width: 92px;
  flex-shrink: 0;
  align-items: center;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  font: inherit;
}

.map-marker {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--color-surface);
  border-radius: 50% 50% 50% 8px;
  background: var(--color-primary);
  box-shadow: var(--shadow-md);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transform: rotate(-45deg);
}

.map-marker-item--selected .map-marker {
  background: var(--color-accent);
  box-shadow: var(--shadow-lg);
  transform: rotate(-45deg) scale(1.1);
}

.map-marker-item:hover .map-marker {
  background: var(--color-primary-hover);
}

.map-marker-item--selected:hover .map-marker {
  background: var(--color-accent-hover);
}

.map-marker::first-letter {
  transform: rotate(45deg);
}

.map-marker-item .map-marker {
  line-height: 1;
}

.map-marker-item .map-marker::before {
  content: '';
}

.map-marker-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.route-line {
  width: clamp(32px, 6vw, 90px);
  height: 3px;
  flex-shrink: 0;
  margin-top: 21px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
}

.map-guide {
  position: relative;
  z-index: var(--z-index-base);
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: center;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-list-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.course-list-item:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
}

.course-list-item--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.course-list-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.course-order {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.course-information {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-1);
}

.course-name {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.course-address {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-arrow,
.nearby-arrow {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-2xl);
}

.selected-place-card {
  display: grid;
  grid-template-columns: minmax(190px, 0.65fr) minmax(0, 1.35fr);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.selected-place-thumbnail {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(rgb(47 125 91 / 12%), rgb(47 125 91 / 12%)), var(--color-primary-light);
  color: var(--color-primary);
  font-size: 4rem;
}

.selected-place-content {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: var(--spacing-6);
}

.selected-place-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.selected-place-name {
  margin: var(--spacing-3) 0 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.selected-place-address {
  margin: var(--spacing-3) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.selected-place-description {
  margin: var(--spacing-5) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.8;
}

.selected-place-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-6);
}

.nearby-location-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-3);
}

.nearby-location-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: left;
}

.nearby-location-button:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nearby-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.nearby-location-button > span:nth-child(2) {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-5) var(--spacing-8);
  background: var(--color-surface-muted);
}

.button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding-inline: var(--spacing-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.button--primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.button--primary:hover:not(:disabled) {
  border-color: var(--color-primary-hover);
  background: var(--color-primary-hover);
}

.button--secondary {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
}

.button--secondary:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.button--danger-outline {
  border-color: rgb(220 90 90 / 45%);
  background: var(--color-surface);
  color: var(--color-error);
}

.button--danger-outline:hover:not(:disabled) {
  border-color: var(--color-error);
  background: rgb(220 90 90 / 8%);
}

.button--danger {
  border-color: var(--color-error);
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.button--danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.page-state {
  display: flex;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-4);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.modal-overlay {
  position: fixed;
  z-index: var(--z-index-modal);
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  background: var(--color-overlay);
}

.delete-modal {
  width: min(100%, 460px);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.modal-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.modal-close-button {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-2xl);
}

.modal-close-button:hover:not(:disabled) {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.modal-description {
  margin: var(--spacing-5) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.delete-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  margin-top: var(--spacing-5);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.field-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.form-control {
  min-height: 46px;
  width: 100%;
  padding-inline: var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
}

.form-control:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(47 125 91 / 12%);
}

.form-control--error {
  border-color: var(--color-error);
}

.form-control--error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgb(220 90 90 / 12%);
}

.form-error-message {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-xs);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .post-detail-view {
    padding-block: var(--spacing-5) var(--spacing-10);
  }

  .post-header,
  .detail-section {
    padding: var(--spacing-5);
  }

  .post-header {
    flex-direction: column;
  }

  .post-actions {
    width: 100%;
  }

  .post-actions .button {
    flex: 1;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .section-description {
    text-align: left;
  }

  .map-preview {
    min-height: 280px;
    padding-inline: var(--spacing-3);
  }

  .route-line {
    width: 24px;
  }

  .selected-place-card {
    grid-template-columns: 1fr;
  }

  .selected-place-thumbnail {
    min-height: 180px;
  }

  .nearby-location-list {
    grid-template-columns: 1fr;
  }

  .post-footer {
    padding: var(--spacing-4) var(--spacing-5);
  }
}

@media (max-width: 479px) {
  .course-list-button {
    gap: var(--spacing-3);
    padding: var(--spacing-3);
  }

  .selected-place-actions {
    flex-direction: column;
  }

  .selected-place-actions .button {
    width: 100%;
  }

  .post-footer .button {
    width: 100%;
  }

  .modal-actions .button {
    flex: 1;
  }
}
</style>
