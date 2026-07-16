<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppError from '@/components/common/AppError.vue'
import { getPosts } from '@/services/posts'

const route = useRoute()
const router = useRouter()

const posts = ref([])
const totalCount = ref(0)
const errorMessage = ref('')

const searchInput = ref(typeof route.query.query === 'string' ? route.query.query : '')

const appliedKeyword = ref(searchInput.value)

const currentPage = ref(Math.max(1, Number(route.query.page) || 1))

const pageSize = 10

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalCount.value / pageSize))
})

const visiblePages = computed(() => {
  const pageLimit = 5
  const half = Math.floor(pageLimit / 2)

  let startPage = Math.max(1, currentPage.value - half)
  let endPage = Math.min(totalPages.value, startPage + pageLimit - 1)

  if (endPage - startPage + 1 < pageLimit) {
    startPage = Math.max(1, endPage - pageLimit + 1)
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index)
})

function getPostId(post) {
  return post.id ?? post.post_id
}

function getPostNumber(post, index) {
  if (post.number !== undefined) {
    return post.number
  }

  if (post.id !== undefined) {
    return post.id
  }

  return totalCount.value - (currentPage.value - 1) * pageSize - index
}

function getLocationCount(post) {
  if (Number.isFinite(post.locationCount)) {
    return post.locationCount
  }

  if (Array.isArray(post.locations)) {
    return post.locations.length
  }

  if (Array.isArray(post.location_ids)) {
    return post.location_ids.length
  }

  return post.location_count ?? post.locations_count ?? post.place_count ?? 0
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\s/g, '')
    .replace(/\.$/, '')
}

async function loadPosts() {
  errorMessage.value = ''

  try {
    const result = await getPosts({
      query: appliedKeyword.value,
      category: typeof route.query.category === 'string' ? route.query.category : '',
      placeId: typeof route.query.placeId === 'string' ? route.query.placeId : '',
      page: currentPage.value,
      size: pageSize,
    })

    posts.value = result.items
    totalCount.value = result.total

    if (currentPage.value > totalPages.value && totalCount.value > 0) {
      await changePage(totalPages.value)
    }
  } catch (error) {
    posts.value = []
    totalCount.value = 0
    errorMessage.value = error.message ?? '게시글을 불러오지 못했습니다.'
  }
}

async function updateRouteQuery() {
  const query = {}

  if (appliedKeyword.value) {
    query.query = appliedKeyword.value
  }

  if (typeof route.query.category === 'string' && route.query.category) {
    query.category = route.query.category
  }

  if (typeof route.query.placeId === 'string' && route.query.placeId) {
    query.placeId = route.query.placeId
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }

  await router.replace({
    path: '/posts',
    query,
  })
}

async function handleSearch() {
  appliedKeyword.value = searchInput.value.trim()
  currentPage.value = 1

  await updateRouteQuery()
  await loadPosts()
}

async function handleReset() {
  searchInput.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1

  await updateRouteQuery()
  await loadPosts()
}

async function changePage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return
  }

  currentPage.value = page

  await updateRouteQuery()
  await loadPosts()

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(loadPosts)
</script>

<template>
  <div class="post-list-view">
    <div class="container">
      <!-- 화면 제목 -->
      <header class="page-header">
        <div>
          <p class="page-eyebrow">TRAVEL BOARD</p>
          <h1 class="page-title">게시판</h1>
          <p class="page-description">다른 사용자가 공유한 여행 코스를 확인해보세요.</p>
        </div>

        <RouterLink to="/posts/create" class="write-button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>

          글쓰기
        </RouterLink>
      </header>

      <!-- 검색 -->
      <section class="search-section">
        <form class="search-form" role="search" @submit.prevent="handleSearch">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <label for="post-search" class="sr-only"> 게시글 검색어 </label>

            <input
              id="post-search"
              v-model="searchInput"
              type="search"
              class="search-input"
              placeholder="게시글 제목을 검색하세요."
              autocomplete="off"
            />
          </div>

          <button type="submit" class="search-button search-button--primary">검색</button>

          <button type="button" class="search-button search-button--reset" @click="handleReset">
            초기화
          </button>
        </form>
      </section>

      <!-- 검색 결과 설명 -->
      <div v-if="appliedKeyword && !errorMessage" class="search-result-summary">
        <span>
          <strong>“{{ appliedKeyword }}”</strong>
          검색 결과
        </span>

        <span>{{ totalCount }}개</span>
      </div>

      <!-- 오류 -->
      <AppError v-if="errorMessage" :message="errorMessage" @retry="loadPosts" />

      <!-- 게시글 목록 -->
      <section v-else class="post-board" aria-labelledby="post-list-title">
        <h2 id="post-list-title" class="sr-only">게시글 목록</h2>

        <!-- 데스크톱 테이블 -->
        <div v-if="posts.length > 0" class="post-table-wrapper">
          <table class="post-table">
            <caption class="sr-only">
              여행 코스 게시글 목록
            </caption>

            <colgroup>
              <col class="number-column" />
              <col />
              <col class="date-column" />
            </colgroup>

            <thead>
              <tr>
                <th scope="col">번호</th>
                <th scope="col">제목</th>
                <th scope="col">작성일</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(post, index) in posts" :key="getPostId(post)">
                <td class="post-number">
                  {{ getPostNumber(post, index) }}
                </td>

                <td class="post-title-cell">
                  <RouterLink :to="`/posts/${getPostId(post)}`" class="post-title-link">
                    <span class="post-title-text">
                      {{ post.title }}
                    </span>

                    <span v-if="getLocationCount(post) > 0" class="location-count">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>

                      +{{ getLocationCount(post) }}
                    </span>
                  </RouterLink>
                </td>

                <td class="post-date">
                  {{ formatDate(post.created_at ?? post.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <div class="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 19.5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14.5" />
              <path d="M4 17h16M8 7h8M8 11h5" />
            </svg>
          </div>

          <strong>
            {{ appliedKeyword ? '검색 결과가 없습니다.' : '아직 작성된 게시글이 없습니다.' }}
          </strong>

          <p>
            {{
              appliedKeyword
                ? '다른 검색어를 입력하거나 검색 조건을 초기화해주세요.'
                : '첫 번째 여행 코스를 작성해보세요.'
            }}
          </p>

          <button v-if="appliedKeyword" type="button" class="empty-action" @click="handleReset">
            검색 초기화
          </button>

          <RouterLink v-else to="/posts/create" class="empty-action"> 글쓰기 </RouterLink>
        </div>
      </section>

      <!-- 페이지네이션 -->
      <nav v-if="!errorMessage && totalPages > 1" class="pagination" aria-label="게시글 페이지">
        <button
          type="button"
          class="pagination-button pagination-button--arrow"
          :disabled="currentPage === 1"
          aria-label="이전 페이지"
          @click="changePage(currentPage - 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="pagination-button"
          :class="{
            'pagination-button--active': page === currentPage,
          }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="changePage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="pagination-button pagination-button--arrow"
          :disabled="currentPage === totalPages"
          aria-label="다음 페이지"
          @click="changePage(currentPage + 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.post-list-view {
  min-height: calc(100dvh - var(--header-height));
  padding: var(--spacing-10) 0 var(--spacing-16);
}

/* Page header */

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--spacing-8);
  gap: var(--spacing-5);
}

.page-eyebrow {
  margin: 0 0 var(--spacing-2);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
}

.page-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  letter-spacing: -0.03em;
}

.page-description {
  margin: var(--spacing-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.write-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 var(--spacing-4);
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  gap: var(--spacing-2);
}

.write-button:hover {
  background-color: var(--color-primary-hover);
  color: var(--color-text-inverse);
  transform: translateY(-1px);
}

.write-button svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

/* Search */

.search-section {
  margin-bottom: var(--spacing-6);
  padding: var(--spacing-5);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.search-form {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-2);
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: var(--spacing-4);
  width: 19px;
  height: 19px;
  color: var(--color-text-muted);
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  height: 46px;
  padding: 0 var(--spacing-4) 0 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
  font-size: var(--font-size-sm);
}

.search-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(47 125 91 / 12%);
}

.search-button {
  flex: 0 0 auto;
  min-width: 76px;
  padding: 0 var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.search-button--primary {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.search-button--primary:hover {
  border-color: var(--color-primary-hover);
  background-color: var(--color-primary-hover);
}

.search-button--reset {
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
}

.search-button--reset:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.search-result-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.search-result-summary strong {
  color: var(--color-primary);
}

/* Table */

.post-board {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.post-table-wrapper {
  overflow-x: auto;
}

.post-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  table-layout: fixed;
}

.number-column {
  width: 100px;
}

.date-column {
  width: 130px;
}

.post-table th {
  height: 52px;
  padding: 0 var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.post-table th:nth-child(2) {
  text-align: left;
}

.post-table td {
  height: 68px;
  padding: 0 var(--spacing-4);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.post-table tbody tr:last-child td {
  border-bottom: 0;
}

.post-table tbody tr {
  transition: background-color var(--transition-fast);
}

.post-table tbody tr:hover {
  background-color: var(--color-surface-hover);
}

.post-number,
.post-date {
  text-align: center;
}

.post-number {
  color: var(--color-text-muted);
}

.post-title-cell {
  min-width: 0;
}

.post-title-link {
  display: flex;
  min-width: 0;
  align-items: center;
  color: var(--color-text-primary);
  text-decoration: none;
  gap: var(--spacing-2);
}

.post-title-link:hover {
  color: var(--color-primary);
}

.post-title-text {
  overflow: hidden;
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.location-count {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 3px var(--spacing-2);
  border-radius: var(--radius-full);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  gap: 2px;
}

.location-count svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

/* Empty state */

.empty-state {
  display: flex;
  min-height: 340px;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-10) var(--spacing-5);
  text-align: center;
  flex-direction: column;
}

.empty-state__icon {
  display: grid;
  width: 62px;
  height: 62px;
  margin-bottom: var(--spacing-4);
  border-radius: var(--radius-full);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  place-items: center;
}

.empty-state__icon svg {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.empty-state strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.empty-state p {
  margin: var(--spacing-2) 0 var(--spacing-5);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.empty-action {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.empty-action:hover {
  background-color: var(--color-primary-hover);
  color: var(--color-text-inverse);
}

/* Pagination */

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-8);
  gap: var(--spacing-1);
}

.pagination-button {
  display: grid;
  width: 38px;
  height: 38px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  place-items: center;
}

.pagination-button:hover:not(:disabled) {
  border-color: var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-primary);
}

.pagination-button--active {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.pagination-button--active:hover:not(:disabled) {
  border-color: var(--color-primary-hover);
  background-color: var(--color-primary-hover);
  color: var(--color-text-inverse);
}

.pagination-button:disabled {
  opacity: 0.35;
}

.pagination-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

/* Mobile */

@media (max-width: 767px) {
  .post-list-view {
    padding: var(--spacing-8) 0 var(--spacing-12);
  }

  .page-header {
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
  }

  .page-title {
    font-size: var(--font-size-2xl);
  }

  .page-description {
    display: none;
  }

  .write-button {
    min-height: 40px;
    padding: 0 var(--spacing-3);
  }

  .search-section {
    padding: var(--spacing-3);
  }

  .search-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .search-button {
    min-width: 62px;
    padding: 0 var(--spacing-3);
  }

  .post-board {
    overflow: visible;
    border: 0;
    background-color: transparent;
    box-shadow: none;
  }

  .post-table-wrapper {
    overflow: visible;
  }

  .post-table {
    min-width: 0;
  }

  .post-table colgroup,
  .post-table thead,
  .post-table .post-number {
    display: none;
  }

  .post-table,
  .post-table tbody,
  .post-table tr,
  .post-table td {
    display: block;
    width: 100%;
    height: auto;
  }

  .post-table tbody {
    display: grid;
    gap: var(--spacing-3);
  }

  .post-table tbody tr {
    position: relative;
    padding: var(--spacing-5);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .post-table td {
    padding: 0;
    border: 0;
  }

  .post-title-link {
    padding-right: 70px;
  }

  .post-title-text {
    white-space: normal;
  }

  .post-date {
    position: absolute;
    top: var(--spacing-5);
    right: var(--spacing-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  .location-count {
    margin-top: var(--spacing-3);
  }

  .post-title-link {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .search-form {
    grid-template-columns: 1fr 1fr;
  }

  .search-input-wrapper {
    grid-column: 1 / -1;
  }

  .search-button {
    width: 100%;
    min-height: 42px;
  }

  .page-eyebrow {
    display: none;
  }

  .write-button span {
    display: none;
  }
}
</style>
