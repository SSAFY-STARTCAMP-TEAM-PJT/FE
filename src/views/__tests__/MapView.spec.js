import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const locationService = vi.hoisted(() => ({
  getLocation: vi.fn(),
  getLocations: vi.fn(),
  getNearbyLocations: vi.fn(),
}))
const postsService = vi.hoisted(() => ({ getPosts: vi.fn() }))

vi.mock('@/services/locationService', () => locationService)
vi.mock('@/services/posts', () => postsService)

import MapView from '@/views/MapView.vue'
import { clearLocationMapCache } from '@/services/locationMapCache'

const KakaoTravelMapStub = defineComponent({
  name: 'KakaoTravelMap',
  emits: ['map-ready', 'viewport-change', 'select-location'],
  template: '<div class="kakao-map-stub" />',
})

const MapFilterBarStub = defineComponent({
  name: 'MapFilterBar',
  props: ['loading'],
  emits: ['search', 'update:selected-category', 'reset'],
  template: '<div />',
})

const MapSidePanelStub = defineComponent({
  name: 'MapSidePanel',
  props: ['visibleLocations', 'locationsLoading', 'locationsRefreshing'],
  template: '<div />',
})

async function mountView(path = '/map') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/map', component: MapView }],
  })
  await router.push(path)
  await router.isReady()

  return mount(MapView, {
    global: {
      plugins: [router],
      stubs: {
        KakaoTravelMap: KakaoTravelMapStub,
        MapFilterBar: MapFilterBarStub,
        MapSidePanel: MapSidePanelStub,
      },
    },
  })
}

describe('MapView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearLocationMapCache()
    locationService.getLocation.mockReset()
    locationService.getLocations.mockReset()
    locationService.getNearbyLocations.mockReset()
    postsService.getPosts.mockReset()
    locationService.getLocations.mockResolvedValue([])
    locationService.getNearbyLocations.mockResolvedValue([])
    postsService.getPosts.mockResolvedValue({ items: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces viewport requests, expands bounds, and disables global loading', async () => {
    locationService.getLocations.mockResolvedValue(
      Array.from({ length: 500 }, (_, index) => ({
        id: String(index),
        contentId: String(index),
        latitude: 35 + index / 10000,
        longitude: 129,
      })),
    )
    const wrapper = await mountView()
    const bounds = { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 }

    wrapper.findComponent(KakaoTravelMapStub).vm.$emit('map-ready', bounds)
    await vi.advanceTimersByTimeAsync(299)
    expect(locationService.getLocations).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(locationService.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({
        bounds: { minLat: 34.75, maxLat: 36.25, minLng: 127.5, maxLng: 130.5 },
        limit: 500,
        showLoading: false,
      }),
    )
    expect(wrapper.text()).toContain('지도를 확대하면 더 정확한 결과를 볼 수 있습니다.')
  })

  it('reuses a cached coverage area without another request', async () => {
    locationService.getLocations.mockResolvedValue([
      { id: '1', contentId: '1', latitude: 35.5, longitude: 129 },
      { id: '2', contentId: '2', latitude: 36.1, longitude: 129 },
    ])
    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)

    map.vm.$emit('map-ready', { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', {
      minLat: 35.1,
      maxLat: 35.9,
      minLng: 128.2,
      maxLng: 129.8,
    })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(locationService.getLocations).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(MapSidePanelStub).props('visibleLocations')).toEqual([
      expect.objectContaining({ id: '1' }),
    ])
  })

  it('requests again outside cached coverage and keeps old data while refreshing', async () => {
    let resolveRefresh
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve
    })

    locationService.getLocations
      .mockResolvedValueOnce([{ id: '1', contentId: '1', latitude: 35.5, longitude: 129 }])
      .mockReturnValueOnce(refreshPromise)

    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)
    const sidePanel = wrapper.findComponent(MapSidePanelStub)

    map.vm.$emit('map-ready', { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', {
      minLat: 37,
      maxLat: 38,
      minLng: 131,
      maxLng: 132,
    })
    await vi.advanceTimersByTimeAsync(300)

    expect(locationService.getLocations).toHaveBeenCalledTimes(2)
    expect(sidePanel.props('locationsRefreshing')).toBe(true)
    expect(sidePanel.props('visibleLocations')).toEqual([expect.objectContaining({ id: '1' })])

    resolveRefresh([{ id: '2', contentId: '2', latitude: 37.5, longitude: 131.5 }])
    await flushPromises()

    expect(sidePanel.props('locationsRefreshing')).toBe(false)
    expect(sidePanel.props('visibleLocations')).toEqual([expect.objectContaining({ id: '2' })])
  })

  it('does not request again when the map moves during a search', async () => {
    locationService.getLocations.mockResolvedValue([
      { id: '1', contentId: '1', latitude: 35.5, longitude: 129 },
    ])
    const wrapper = await mountView('/map?query=해운대')
    const map = wrapper.findComponent(KakaoTravelMapStub)

    map.vm.$emit('map-ready', { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', {
      minLat: 37,
      maxLat: 38,
      minLng: 131,
      maxLng: 132,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(locationService.getLocations).toHaveBeenCalledTimes(1)
    expect(locationService.getLocations).toHaveBeenCalledWith(
      expect.objectContaining({ query: '해운대', bounds: null }),
    )
  })

  it('does not treat the expanded area as cached when the limit is reached', async () => {
    locationService.getLocations.mockResolvedValue(
      Array.from({ length: 500 }, (_, index) => ({
        id: String(index),
        contentId: String(index),
        latitude: 35 + index / 10000,
        longitude: 129,
      })),
    )
    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)

    map.vm.$emit('map-ready', { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', {
      minLat: 34.8,
      maxLat: 35.8,
      minLng: 127.6,
      maxLng: 129.6,
    })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(locationService.getLocations).toHaveBeenCalledTimes(2)
  })

  it('deduplicates a viewport already covered by an in-flight request', async () => {
    let resolveRequest
    locationService.getLocations.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)

    map.vm.$emit('map-ready', { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 })
    await vi.advanceTimersByTimeAsync(300)

    map.vm.$emit('viewport-change', {
      minLat: 35.1,
      maxLat: 35.9,
      minLng: 128.2,
      maxLng: 129.8,
    })
    await vi.advanceTimersByTimeAsync(300)

    expect(locationService.getLocations).toHaveBeenCalledTimes(1)

    resolveRequest([])
    await flushPromises()
  })

  it('does not cache failed viewport requests', async () => {
    locationService.getLocations
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([])
    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)
    const bounds = { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 }

    map.vm.$emit('map-ready', bounds)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', bounds)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(locationService.getLocations).toHaveBeenCalledTimes(2)
  })

  it('does not cache an aborted viewport request', async () => {
    locationService.getLocations
      .mockImplementationOnce(({ signal }) => {
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        })
      })
      .mockResolvedValue([])

    const wrapper = await mountView()
    const map = wrapper.findComponent(KakaoTravelMapStub)
    const firstBounds = { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 }
    const secondBounds = { minLat: 37, maxLat: 38, minLng: 131, maxLng: 132 }

    map.vm.$emit('map-ready', firstBounds)
    await vi.advanceTimersByTimeAsync(300)

    map.vm.$emit('viewport-change', secondBounds)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    map.vm.$emit('viewport-change', firstBounds)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(locationService.getLocations).toHaveBeenCalledTimes(3)
  })

  it('loads and selects a placeId from the route', async () => {
    const location = { id: '126508', contentId: '126508', latitude: 35.1, longitude: 129.1 }
    locationService.getLocation.mockResolvedValue(location)

    await mountView('/map?placeId=126508')
    await flushPromises()

    expect(locationService.getLocation).toHaveBeenCalledWith('126508')
    expect(locationService.getNearbyLocations).toHaveBeenCalledWith('126508', { limit: 5 })
    expect(postsService.getPosts).toHaveBeenCalledWith({ placeId: '126508', page: 1, size: 3 })
  })
})
