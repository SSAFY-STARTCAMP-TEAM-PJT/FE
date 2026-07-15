import { describe, expect, it } from 'vitest'

import { createWaypointRequest, getRouteCoordinates } from '@/services/directions'

const locations = [
  { name: '출발', longitude: 127.1, latitude: 37.1 },
  { name: '경유', longitude: 127.2, latitude: 37.2 },
  { name: '도착', longitude: 127.3, latitude: 37.3 },
]

describe('directions service', () => {
  it('방문 순서를 출발지, 경유지, 목적지 요청으로 변환한다', () => {
    const request = createWaypointRequest(locations)

    expect(request.origin).toEqual({ name: '출발', x: 127.1, y: 37.1 })
    expect(request.waypoints).toEqual([{ name: '경유', x: 127.2, y: 37.2 }])
    expect(request.destination).toEqual({ name: '도착', x: 127.3, y: 37.3 })
    expect(request.summary).toBe(false)
  })

  it('도로 vertexes를 지도 좌표로 변환하고 중복 좌표를 제거한다', () => {
    const result = getRouteCoordinates({
      routes: [{
        result_code: 0,
        summary: { distance: 1200, duration: 300 },
        sections: [{
          roads: [
            { vertexes: [127.1, 37.1, 127.2, 37.2] },
            { vertexes: [127.2, 37.2, 127.3, 37.3] },
          ],
        }],
      }],
    })

    expect(result.coordinates).toEqual([
      { longitude: 127.1, latitude: 37.1 },
      { longitude: 127.2, latitude: 37.2 },
      { longitude: 127.3, latitude: 37.3 },
    ])
    expect(result.summary.distance).toBe(1200)
  })

  it('카카오 API의 경유지 최대 개수를 검사한다', () => {
    expect(() => createWaypointRequest(Array.from({ length: 33 }, () => locations[0]))).toThrow(
      '경유지를 최대 30곳까지 지원합니다',
    )
  })
})
