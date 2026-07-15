<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value),
  },

  initialPost: {
    type: Object,
    default: () => ({
      category: 'COURSE',
      title: '',
      content: '',
      locations: [],
    }),
  },

  locations: {
    type: Array,
    default: () => [],
  },

  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  category: 'COURSE',
  title: '',
  content: '',
  password: '',
})

const searchKeyword = ref('')
const selectedLocationCategory = ref('ALL')
const selectedLocations = ref([])

const locationCategories = [
  {
    value: 'ALL',
    label: '전체',
  },
  {
    value: 'ATTRACTION',
    label: '관광지',
  },
  {
    value: 'RESTAURANT',
    label: '맛집',
  },
  {
    value: 'CULTURE',
    label: '문화',
  },
]

const isEditMode = computed(() => props.mode === 'edit')

const pageTitle = computed(() => {
  return isEditMode.value ? '여행 코스 수정하기' : '여행 코스 공유하기'
})

const pageDescription = computed(() => {
  return isEditMode.value
    ? '게시글 내용과 첨부된 여행 코스를 수정하세요.'
    : '게시글을 작성하고 방문 순서에 맞게 여행지를 첨부해 보세요.'
})

const panelTitle = computed(() => {
  return isEditMode.value ? '게시글 수정' : '게시글 작성'
})

const panelDescription = computed(() => {
  return isEditMode.value
    ? '기존 게시글의 내용과 여행 코스를 변경할 수 있습니다.'
    : '코스에 대한 설명과 필요한 정보를 입력하세요.'
})

const passwordLabel = computed(() => {
  return isEditMode.value ? '기존 비밀번호 확인' : '수정·삭제용 비밀번호'
})

const passwordPlaceholder = computed(() => {
  return isEditMode.value ? '기존 비밀번호를 입력하세요.' : '4자 이상 입력하세요.'
})

const passwordHelper = computed(() => {
  return isEditMode.value
    ? '게시글 작성 시 설정한 비밀번호가 일치해야 수정할 수 있습니다.'
    : '게시글 수정과 삭제 시 사용됩니다.'
})

const passwordAutocomplete = computed(() => {
  return isEditMode.value ? 'current-password' : 'new-password'
})

const submitButtonText = computed(() => {
  if (props.loading) {
    return isEditMode.value ? '저장 중...' : '등록 중...'
  }

  return isEditMode.value ? '변경사항 저장' : '게시글 등록'
})

const filteredLocations = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return props.locations.filter((location) => {
    const locationName = location.name?.toLowerCase() ?? ''
    const locationAddress = location.address?.toLowerCase() ?? ''

    const matchesCategory =
      selectedLocationCategory.value === 'ALL' ||
      location.category === selectedLocationCategory.value

    const matchesKeyword =
      !keyword || locationName.includes(keyword) || locationAddress.includes(keyword)

    return matchesCategory && matchesKeyword
  })
})

const applyInitialPost = (post) => {
  form.category = post?.category ?? 'COURSE'
  form.title = post?.title ?? ''
  form.content = post?.content ?? ''
  form.password = ''

  selectedLocations.value = Array.isArray(post?.locations)
    ? post.locations.map((location) => ({
        ...location,
      }))
    : []
}

watch(
  () => props.initialPost,
  (post) => {
    applyInitialPost(post)
  },
  {
    immediate: true,
    deep: true,
  },
)

const isLocationSelected = (contentId) => {
  return selectedLocations.value.some((location) => location.contentId === contentId)
}

const addLocation = (location) => {
  if (!location?.contentId) {
    return
  }

  if (isLocationSelected(location.contentId)) {
    return
  }

  selectedLocations.value.push({
    ...location,
  })
}

const removeLocation = (index) => {
  if (index < 0 || index >= selectedLocations.value.length) {
    return
  }

  selectedLocations.value.splice(index, 1)
}

const moveLocationUp = (index) => {
  if (index <= 0 || index >= selectedLocations.value.length) {
    return
  }

  const locations = selectedLocations.value
  const previousLocation = locations[index - 1]

  locations[index - 1] = locations[index]
  locations[index] = previousLocation
}

const moveLocationDown = (index) => {
  if (index < 0 || index >= selectedLocations.value.length - 1) {
    return
  }

  const locations = selectedLocations.value
  const nextLocation = locations[index + 1]

  locations[index + 1] = locations[index]
  locations[index] = nextLocation
}

const validateForm = () => {
  if (!form.category) {
    window.alert('게시글 카테고리를 선택해 주세요.')
    return false
  }

  if (!form.title.trim()) {
    window.alert('제목을 입력해 주세요.')
    return false
  }

  if (!form.content.trim()) {
    window.alert('내용을 입력해 주세요.')
    return false
  }

  if (!form.password) {
    window.alert('비밀번호를 입력해 주세요.')
    return false
  }

  if (form.password.length < 4) {
    window.alert('비밀번호를 4자 이상 입력해 주세요.')
    return false
  }

  return true
}

const submitForm = () => {
  if (props.loading || !validateForm()) {
    return
  }

  emit('submit', {
    category: form.category,
    title: form.title.trim(),
    content: form.content.trim(),
    password: form.password,
    locationIds: selectedLocations.value.map((location) => location.contentId),
    locations: selectedLocations.value.map((location, index) => ({
      ...location,
      sortOrder: index + 1,
    })),
  })
}

const cancelForm = () => {
  if (props.loading) {
    return
  }

  emit('cancel')
}
</script>

<template>
  <main class="post-form-view">
    <div class="container">
      <header class="page-header">
        <div>
          <p class="page-eyebrow">LOCAL COURSE</p>

          <h1 class="page-title">
            {{ pageTitle }}
          </h1>

          <p class="page-description">
            {{ pageDescription }}
          </p>
        </div>
      </header>

      <form class="post-form" @submit.prevent="submitForm">
        <div class="form-panels">
          <section class="panel post-panel" aria-labelledby="post-panel-title">
            <div class="panel-header">
              <div>
                <h2 id="post-panel-title" class="panel-title">
                  {{ panelTitle }}
                </h2>

                <p class="panel-description">
                  {{ panelDescription }}
                </p>
              </div>
            </div>

            <div class="panel-content">
              <div class="form-field">
                <label for="post-category" class="field-label"> 카테고리 </label>

                <select id="post-category" v-model="form.category" class="form-control">
                  <option value="COURSE">여행 코스</option>

                  <option value="RECOMMENDATION">여행지 추천</option>

                  <option value="REVIEW">여행 후기</option>

                  <option value="TIP">여행 팁</option>
                </select>
              </div>

              <div class="form-field">
                <label for="post-title" class="field-label">
                  제목

                  <span class="required-mark" aria-hidden="true"> * </span>
                </label>

                <input
                  id="post-title"
                  v-model="form.title"
                  class="form-control"
                  type="text"
                  maxlength="100"
                  placeholder="여행 코스의 제목을 입력하세요."
                  required
                />

                <p class="field-helper">{{ form.title.length }}/100</p>
              </div>

              <div class="form-field form-field--grow">
                <label for="post-content" class="field-label">
                  내용

                  <span class="required-mark" aria-hidden="true"> * </span>
                </label>

                <textarea
                  id="post-content"
                  v-model="form.content"
                  class="form-control form-textarea"
                  maxlength="5000"
                  placeholder="코스의 특징, 이동 방법, 추천 이유 등을 작성해 주세요."
                  required
                />

                <p class="field-helper">{{ form.content.length }}/5000</p>
              </div>

              <div class="form-field">
                <label for="post-password" class="field-label">
                  {{ passwordLabel }}

                  <span class="required-mark" aria-hidden="true"> * </span>
                </label>

                <input
                  id="post-password"
                  v-model="form.password"
                  class="form-control"
                  type="password"
                  minlength="4"
                  maxlength="20"
                  :autocomplete="passwordAutocomplete"
                  :placeholder="passwordPlaceholder"
                  required
                />

                <p class="field-helper field-helper--left">
                  {{ passwordHelper }}
                </p>
              </div>
            </div>
          </section>

          <section class="panel location-panel" aria-labelledby="location-panel-title">
            <div class="panel-header">
              <div>
                <h2 id="location-panel-title" class="panel-title">여행지 첨부</h2>

                <p class="panel-description">방문할 순서대로 여행지를 구성하세요.</p>
              </div>

              <span class="selected-count"> {{ selectedLocations.length }}개 선택 </span>
            </div>

            <div class="panel-content location-panel-content">
              <div class="location-search-area">
                <label for="location-search" class="field-label"> 여행지 검색 </label>

                <div class="search-input-wrap">
                  <span class="search-icon" aria-hidden="true"> ⌕ </span>

                  <input
                    id="location-search"
                    v-model="searchKeyword"
                    class="form-control search-input"
                    type="search"
                    placeholder="여행지 이름 또는 주소 검색"
                  />
                </div>

                <div class="category-filters" aria-label="여행지 카테고리">
                  <button
                    v-for="category in locationCategories"
                    :key="category.value"
                    class="filter-button"
                    :class="{
                      'filter-button--active': selectedLocationCategory === category.value,
                    }"
                    type="button"
                    @click="selectedLocationCategory = category.value"
                  >
                    {{ category.label }}
                  </button>
                </div>
              </div>

              <div class="location-section">
                <div class="section-heading">
                  <h3 class="section-title">검색 결과</h3>

                  <span class="section-count"> {{ filteredLocations.length }}개 </span>
                </div>

                <ul v-if="filteredLocations.length" class="location-result-list">
                  <li
                    v-for="location in filteredLocations"
                    :key="location.contentId"
                    class="location-result-item"
                  >
                    <div class="location-information">
                      <div class="location-title-row">
                        <strong class="location-name">
                          {{ location.name }}
                        </strong>

                        <span class="location-category">
                          {{ location.categoryLabel }}
                        </span>
                      </div>

                      <p class="location-address">
                        {{ location.address }}
                      </p>
                    </div>

                    <button
                      class="icon-button add-button"
                      :class="{
                        'add-button--selected': isLocationSelected(location.contentId),
                      }"
                      type="button"
                      :disabled="isLocationSelected(location.contentId)"
                      :aria-label="`${location.name} 추가`"
                      @click="addLocation(location)"
                    >
                      {{ isLocationSelected(location.contentId) ? '완료' : '+' }}
                    </button>
                  </li>
                </ul>

                <div v-else class="empty-state">
                  <span class="empty-state-icon" aria-hidden="true"> ⌕ </span>

                  <p>검색 조건에 맞는 여행지가 없습니다.</p>
                </div>
              </div>

              <div class="location-section selected-section">
                <div class="section-heading">
                  <h3 class="section-title">선택한 여행지</h3>

                  <span class="section-description"> 위·아래 버튼으로 순서를 변경하세요. </span>
                </div>

                <ol v-if="selectedLocations.length" class="selected-location-list">
                  <li
                    v-for="(location, index) in selectedLocations"
                    :key="location.contentId"
                    class="selected-location-item"
                  >
                    <span class="order-number">
                      {{ index + 1 }}
                    </span>

                    <div class="selected-location-information">
                      <strong class="location-name">
                        {{ location.name }}
                      </strong>

                      <span class="selected-location-address">
                        {{ location.address }}
                      </span>
                    </div>

                    <div class="location-actions">
                      <button
                        class="control-button"
                        type="button"
                        :disabled="index === 0"
                        :aria-label="`${location.name} 순서 위로 이동`"
                        @click="moveLocationUp(index)"
                      >
                        ↑
                      </button>

                      <button
                        class="control-button"
                        type="button"
                        :disabled="index === selectedLocations.length - 1"
                        :aria-label="`${location.name} 순서 아래로 이동`"
                        @click="moveLocationDown(index)"
                      >
                        ↓
                      </button>

                      <button
                        class="control-button control-button--remove"
                        type="button"
                        :aria-label="`${location.name} 제거`"
                        @click="removeLocation(index)"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                </ol>

                <div v-else class="empty-state empty-state--selected">
                  <span class="empty-state-icon" aria-hidden="true"> ＋ </span>

                  <p>검색 결과에서 여행지를 추가해 주세요.</p>
                </div>
              </div>

              <div class="course-preview">
                <div class="section-heading">
                  <h3 class="section-title">코스 미리보기</h3>
                </div>

                <div
                  v-if="selectedLocations.length"
                  class="map-placeholder"
                  aria-label="선택한 여행지 코스 미리보기"
                >
                  <div class="course-path">
                    <template
                      v-for="(location, index) in selectedLocations"
                      :key="location.contentId"
                    >
                      <div class="course-marker-item">
                        <span class="course-marker">
                          {{ index + 1 }}
                        </span>

                        <span class="course-marker-name">
                          {{ location.name }}
                        </span>
                      </div>

                      <span
                        v-if="index < selectedLocations.length - 1"
                        class="course-line"
                        aria-hidden="true"
                      />
                    </template>
                  </div>

                  <p class="map-placeholder-description">
                    Kakao Map 연동 후 선택 순서에 따라 번호 마커와 연결선을 표시합니다.
                  </p>
                </div>

                <div v-else class="map-placeholder map-placeholder--empty">
                  <span class="map-placeholder-icon" aria-hidden="true"> ⌖ </span>

                  <p>여행지를 추가하면 코스가 표시됩니다.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer class="form-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="loading"
            @click="cancelForm"
          >
            취소
          </button>

          <button class="button button--primary" type="submit" :disabled="loading">
            {{ submitButtonText }}
          </button>
        </footer>
      </form>
    </div>
  </main>
</template>

<style scoped>
.post-form-view {
  min-height: calc(100vh - var(--header-height));
  padding-block: var(--spacing-8) var(--spacing-16);
}

.page-header {
  margin-bottom: var(--spacing-6);
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
  font-size: clamp(var(--font-size-2xl), 4vw, var(--font-size-3xl));
  line-height: 1.25;
}

.page-description {
  margin: var(--spacing-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.post-form {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.form-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.panel {
  min-width: 0;
}

.panel + .panel {
  border-top: 1px solid var(--color-border);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-surface-muted);
}

.panel-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.panel-description {
  margin: var(--spacing-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  padding: var(--spacing-5);
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

.required-mark {
  color: var(--color-error);
}

.form-control {
  min-height: 46px;
  padding: 0 var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.form-control:hover {
  border-color: var(--color-border-strong);
}

.form-control:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(47 125 91 / 12%);
}

.form-textarea {
  min-height: 280px;
  padding-block: var(--spacing-3);
  resize: vertical;
  line-height: 1.7;
}

.field-helper {
  align-self: flex-end;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.field-helper--left {
  align-self: flex-start;
}

.selected-count {
  flex-shrink: 0;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.location-panel-content {
  gap: var(--spacing-8);
}

.location-search-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.search-input-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  padding-left: 42px;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.filter-button {
  min-height: 36px;
  padding: 0 var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.filter-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-button--active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.filter-button--active:hover {
  background: var(--color-primary-hover);
  color: var(--color-text-inverse);
}

.location-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.section-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.section-count,
.section-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.location-result-list,
.selected-location-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.location-result-list {
  max-height: 290px;
  padding-right: var(--spacing-1);
  overflow-y: auto;
}

.location-result-item,
.selected-location-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.location-result-item:hover {
  border-color: var(--color-border);
  background: var(--color-surface-hover);
}

.location-information,
.selected-location-information {
  min-width: 0;
  flex: 1;
}

.location-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.location-name {
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-category {
  flex-shrink: 0;
  padding: 2px var(--spacing-2);
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
}

.location-address,
.selected-location-address {
  display: block;
  overflow: hidden;
  margin: var(--spacing-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button,
.control-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  font: inherit;
}

.icon-button {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.add-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.add-button--selected {
  width: auto;
  padding-inline: var(--spacing-3);
  border-color: var(--color-border-light);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.selected-location-item {
  background: var(--color-surface-muted);
}

.order-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.location-actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--spacing-1);
}

.control-button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.control-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.control-button--remove:hover:not(:disabled) {
  border-color: var(--color-error);
  background: rgb(220 90 90 / 8%);
  color: var(--color-error);
}

.empty-state {
  display: flex;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-5);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.empty-state-icon {
  font-size: var(--font-size-2xl);
}

.empty-state--selected {
  min-height: 110px;
}

.course-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.map-placeholder {
  display: flex;
  min-height: 230px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-5);
  overflow: hidden;
  padding: var(--spacing-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(rgb(255 255 255 / 55%), rgb(255 255 255 / 55%)),
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 31px,
      var(--color-border-light) 32px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 31px,
      var(--color-border-light) 32px
    ),
    var(--color-primary-light);
}

.map-placeholder--empty {
  color: var(--color-text-muted);
}

.map-placeholder--empty p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.map-placeholder-icon {
  font-size: var(--font-size-3xl);
}

.course-path {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: center;
  overflow-x: auto;
  padding-block: var(--spacing-3);
}

.course-marker-item {
  display: flex;
  width: 76px;
  flex-shrink: 0;
  align-items: center;
  flex-direction: column;
  gap: var(--spacing-2);
  text-align: center;
}

.course-marker {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: var(--shadow-md);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.course-marker-name {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.course-line {
  width: 42px;
  height: 2px;
  flex-shrink: 0;
  margin-top: 17px;
  background: var(--color-primary);
}

.map-placeholder-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.button {
  min-height: 44px;
  padding: 0 var(--spacing-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
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

.button--primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.button--primary:hover:not(:disabled) {
  border-color: var(--color-primary-hover);
  background: var(--color-primary-hover);
}

.button:disabled,
.icon-button:disabled,
.control-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 479px) {
  .post-form-view {
    padding-block: var(--spacing-6) var(--spacing-10);
  }

  .container {
    padding-inline: var(--spacing-3);
  }

  .panel-header,
  .panel-content {
    padding-inline: var(--spacing-4);
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .selected-location-item {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .selected-location-information {
    width: calc(100% - 46px);
  }

  .location-actions {
    width: 100%;
    justify-content: flex-end;
    padding-left: 42px;
  }

  .form-actions {
    position: sticky;
    z-index: var(--z-index-sticky);
    bottom: 0;
  }

  .button {
    flex: 1;
  }
}

@media (min-width: 900px) {
  .form-panels {
    grid-template-columns:
      minmax(0, 0.9fr)
      minmax(0, 1.1fr);
  }

  .panel + .panel {
    border-top: 0;
    border-left: 1px solid var(--color-border);
  }

  .post-panel .panel-content {
    min-height: 790px;
  }

  .form-field--grow {
    flex: 1;
  }

  .form-textarea {
    min-height: 340px;
    flex: 1;
  }
}

@media (min-width: 1200px) {
  .panel-header,
  .panel-content {
    padding: var(--spacing-6);
  }

  .form-actions {
    padding-inline: var(--spacing-6);
  }
}
</style>
