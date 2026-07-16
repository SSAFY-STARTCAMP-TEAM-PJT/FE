import { beforeEach, describe, expect, it } from 'vitest'

import {
  LOCATION_MAP_CACHE_MAX_ENTRIES,
  LOCATION_MAP_CACHE_TTL_MS,
  clearLocationMapCache,
  expandLocationBounds,
  getCachedMapLocations,
  getLocationMapCacheSize,
  setCachedMapLocations,
} from '@/services/locationMapCache'

const bounds = { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 }

describe('location map cache', () => {
  beforeEach(() => {
    clearLocationMapCache()
  })

  it('expands each side of the viewport by 25 percent', () => {
    expect(expandLocationBounds(bounds)).toEqual({
      minLat: 34.75,
      maxLat: 36.25,
      minLng: 127.5,
      maxLng: 130.5,
    })
  })

  it('reuses viewport entries and filters locations to the current bounds', () => {
    const coverage = expandLocationBounds(bounds)
    const locations = [
      { id: 'inside', latitude: 35.5, longitude: 129 },
      { id: 'outside', latitude: 36.1, longitude: 129 },
    ]

    setCachedMapLocations({ bounds: coverage, locations, now: 1000 })

    expect(getCachedMapLocations({ bounds, now: 2000 })).toEqual({
      locations: [locations[0]],
      limitReached: false,
    })
  })

  it('expires entries after five minutes', () => {
    setCachedMapLocations({ bounds, locations: [], now: 1000 })

    expect(
      getCachedMapLocations({ bounds, now: 1000 + LOCATION_MAP_CACHE_TTL_MS - 1 }),
    ).not.toBeNull()
    expect(getCachedMapLocations({ bounds, now: 1000 + LOCATION_MAP_CACHE_TTL_MS })).toBeNull()
  })

  it('caches searches by normalized query and category', () => {
    const locations = [{ id: '1', latitude: 35.5, longitude: 129 }]

    setCachedMapLocations({
      category: '관광지',
      query: ' 해운대 ',
      locations,
      now: 1000,
    })

    expect(
      getCachedMapLocations({ category: '관광지', query: '해운대', bounds, now: 2000 }),
    ).toEqual({ locations, limitReached: false })
    expect(
      getCachedMapLocations({ category: '문화시설', query: '해운대', bounds, now: 2000 }),
    ).toBeNull()
  })

  it('evicts the least recently used entries above the maximum size', () => {
    for (let index = 0; index <= LOCATION_MAP_CACHE_MAX_ENTRIES; index += 1) {
      setCachedMapLocations({
        query: `query-${index}`,
        locations: [],
        now: 1000 + index,
      })
    }

    expect(getLocationMapCacheSize()).toBe(LOCATION_MAP_CACHE_MAX_ENTRIES)
    expect(getCachedMapLocations({ query: 'query-0', bounds, now: 3000 })).toBeNull()
    expect(
      getCachedMapLocations({
        query: `query-${LOCATION_MAP_CACHE_MAX_ENTRIES}`,
        bounds,
        now: 3000,
      }),
    ).not.toBeNull()
  })
})
