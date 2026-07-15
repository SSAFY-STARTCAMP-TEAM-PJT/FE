import { apiRequest } from '@/services/api'

const DIRECTIONS_ENDPOINT =
  'https://apis-navi.kakaomobility.com/v1/waypoints/directions'

function toPoint(location) {
  return {
    name: location.name ?? location.title ?? '',
    x: Number(location.longitude),
    y: Number(location.latitude),
  }
}

export function createWaypointRequest(locations) {
  if (!Array.isArray(locations) || locations.length < 2) {
    throw new Error('경로를 찾으려면 여행지를 2곳 이상 선택해야 합니다.')
  }

  if (locations.length > 32) {
    throw new Error('카카오 길찾기는 경유지를 최대 30곳까지 지원합니다.')
  }

  const points = locations.map(toPoint)

  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new Error('여행지 좌표가 올바르지 않습니다.')
  }

  return {
    origin: points[0],
    destination: points.at(-1),
    waypoints: points.slice(1, -1),
    priority: 'RECOMMEND',
    alternatives: false,
    road_details: false,
    summary: false,
  }
}

export function getRouteCoordinates(response) {
  const route = response?.routes?.[0]

  if (!route) {
    throw new Error('길찾기 결과가 없습니다.')
  }

  if (route.result_code !== 0) {
    throw new Error(route.result_msg || '경로를 찾지 못했습니다.')
  }

  const coordinates = []

  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const vertexes = road.vertexes ?? []

      for (let index = 0; index < vertexes.length - 1; index += 2) {
        const longitude = Number(vertexes[index])
        const latitude = Number(vertexes[index + 1])

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          const previous = coordinates.at(-1)

          if (!previous || previous.latitude !== latitude || previous.longitude !== longitude) {
            coordinates.push({ latitude, longitude })
          }
        }
      }
    }
  }

  if (coordinates.length < 2) {
    throw new Error('경로 좌표가 비어 있습니다.')
  }

  return {
    coordinates,
    summary: route.summary ?? null,
  }
}

export async function getWaypointDirections(locations, { signal } = {}) {
  const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY

  if (!restApiKey) {
    throw new Error('VITE_KAKAO_REST_API_KEY가 설정되지 않았습니다.')
  }

  const response = await apiRequest(DIRECTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
    body: createWaypointRequest(locations),
    signal,
    showLoading: false,
  })

  return getRouteCoordinates(response)
}
