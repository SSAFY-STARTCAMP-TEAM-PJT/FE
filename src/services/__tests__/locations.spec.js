import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }))

vi.mock('@/services/api', () => ({ apiRequest }))

import { getLocation, getLocations, getNearbyLocations } from '@/services/locationService'

describe('location service', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('passes filters and map bounds using Swagger names', async () => {
    apiRequest.mockResolvedValue([])

    await getLocations({
      category: '관광지',
      query: '해운대',
      bounds: { minLat: 35, maxLat: 36, minLng: 128, maxLng: 130 },
      skip: 10,
      limit: 500,
      showLoading: false,
    })

    const [url] = apiRequest.mock.calls[0]
    const params = new URL(url, 'https://example.com').searchParams

    expect(Object.fromEntries(params)).toEqual({
      category: '관광지',
      query: '해운대',
      skip: '10',
      limit: '500',
      min_lat: '35',
      max_lat: '36',
      min_lng: '128',
      max_lng: '130',
    })
    expect(apiRequest.mock.calls[0][1]).toEqual({
      signal: undefined,
      showLoading: false,
    })
  })

  it('normalizes detail and nearby responses', async () => {
    apiRequest
      .mockResolvedValueOnce({ content_id: '1', content_type: '관광지', title: '장소' })
      .mockResolvedValueOnce([
        { content_id: '2', content_type: '문화시설', title: '근처', distance_km: 1.25 },
      ])

    const detail = await getLocation('1')
    const nearby = await getNearbyLocations('1', { limit: 3 })

    expect(detail).toMatchObject({ contentId: '1', name: '장소', category: '관광지' })
    expect(nearby[0]).toMatchObject({ contentId: '2', name: '근처', distanceKm: 1.25 })
    expect(apiRequest).toHaveBeenLastCalledWith('/api/locations/1/nearby?limit=3', {
      signal: undefined,
    })
  })
})
