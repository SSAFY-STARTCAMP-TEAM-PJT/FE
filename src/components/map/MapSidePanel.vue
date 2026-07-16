<script setup>
import LocationDetailPanel from '@/components/map/LocationDetailPanel.vue'
import LocationListPanel from '@/components/map/LocationListPanel.vue'

defineProps({
  selectedLocation: {
    type: Object,
    default: null,
  },
  visibleLocations: {
    type: Array,
    default: () => [],
  },
  relatedPosts: {
    type: Array,
    default: () => [],
  },
  nearbyLocations: {
    type: Array,
    default: () => [],
  },
  locationsLoading: {
    type: Boolean,
    default: false,
  },
  locationsRefreshing: {
    type: Boolean,
    default: false,
  },
  postsLoading: {
    type: Boolean,
    default: false,
  },
  hasActiveFilter: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'select-location',
  'close-detail',
  'select-nearby',
  'create-course',
  'open-post',
  'open-all-posts',
])
</script>

<template>
  <aside class="map-side-panel" aria-label="여행지 정보 패널">
    <Transition name="panel" mode="out-in">
      <LocationDetailPanel
        v-if="selectedLocation"
        :key="`detail-${selectedLocation.id}`"
        :location="selectedLocation"
        :related-posts="relatedPosts"
        :nearby-locations="nearbyLocations"
        :posts-loading="postsLoading"
        @back="emit('close-detail')"
        @select-nearby="emit('select-nearby', $event)"
        @create-course="emit('create-course', $event)"
        @open-post="emit('open-post', $event)"
        @open-all-posts="emit('open-all-posts', $event)"
      />

      <LocationListPanel
        v-else
        key="list"
        :locations="visibleLocations"
        :loading="locationsLoading"
        :refreshing="locationsRefreshing"
        :has-active-filter="hasActiveFilter"
        @select-location="emit('select-location', $event)"
      />
    </Transition>
  </aside>
</template>

<style scoped>
.map-side-panel {
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
}

.panel-enter-active,
.panel-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.panel-enter-from {
  opacity: 0;
  transform: translateX(14px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

@media (max-width: 900px) {
  .map-side-panel {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}
</style>
