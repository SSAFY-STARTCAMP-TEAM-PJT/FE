import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import KakaoTravelMap from '@/components/map/KakaoTravelMap.vue'

const overlays = []
const maps = []

class LatLngMock {
  constructor(latitude, longitude) {
    this.latitude = latitude
    this.longitude = longitude
  }
}

class MapMock {
  constructor() {
    this.setCenter = vi.fn()
    this.panTo = vi.fn()
    this.setLevel = vi.fn()
    this.setMaxLevel = vi.fn()
    this.setMinLevel = vi.fn()
    this.addControl = vi.fn()
    this.relayout = vi.fn()
    this.getBounds = vi.fn(() => ({
      getSouthWest: () => ({ getLat: () => 35, getLng: () => 128 }),
      getNorthEast: () => ({ getLat: () => 36, getLng: () => 130 }),
    }))
    maps.push(this)
  }
}

class CustomOverlayMock {
  constructor(options) {
    this.options = options
    this.setMap = vi.fn()
    overlays.push(this)
  }
}

describe('KakaoTravelMap', () => {
  beforeEach(() => {
    overlays.length = 0
    maps.length = 0

    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
    }

    window.kakao = {
      maps: {
        load: (callback) => callback(),
        Map: MapMock,
        LatLng: LatLngMock,
        CustomOverlay: CustomOverlayMock,
        ZoomControl: class {},
        MapTypeControl: class {},
        ControlPosition: { RIGHT: 'RIGHT', TOPRIGHT: 'TOPRIGHT' },
        event: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    }
  })

  afterEach(() => {
    delete window.kakao
    delete globalThis.ResizeObserver
  })

  it('renders the selected pin with a distinct class, label, and higher layer', async () => {
    const locations = [
      { id: '1', name: '첫 번째 장소', latitude: 35.1, longitude: 129.1 },
      { id: '2', name: '선택한 장소', latitude: 35.2, longitude: 129.2 },
    ]

    const wrapper = mount(KakaoTravelMap, {
      props: { locations, selectedLocationId: '2' },
    })
    await flushPromises()

    expect(overlays).toHaveLength(2)
    expect(overlays[0].options.content.classList.contains('is-selected')).toBe(false)
    expect(overlays[1].options.content.classList.contains('is-selected')).toBe(true)
    expect(overlays[1].options.content.textContent).toContain('선택한 장소')
    expect(overlays[1].options.content.getAttribute('aria-label')).toContain('선택된 여행지')
    expect(overlays[1].options.zIndex).toBeGreaterThan(overlays[0].options.zIndex)

    await wrapper.unmount()
  })

  it('zooms first and then moves the selected location to the map center', async () => {
    const wrapper = mount(KakaoTravelMap)
    await flushPromises()

    await wrapper.setProps({
      focusLocation: {
        id: '2',
        name: '선택한 장소',
        latitude: 35.2,
        longitude: 129.2,
      },
    })

    const map = maps[0]
    expect(map.setLevel).toHaveBeenCalledWith(3)
    expect(map.panTo).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 35.2, longitude: 129.2 }),
    )
    expect(map.setLevel.mock.invocationCallOrder[0]).toBeLessThan(
      map.panTo.mock.invocationCallOrder[0],
    )

    await wrapper.unmount()
  })
})
