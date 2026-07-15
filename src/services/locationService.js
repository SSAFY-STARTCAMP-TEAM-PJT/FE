import { mockLocations, mockRelatedPosts } from '@/data/mockLocations'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

function delay(milliseconds = 200) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function normalizeLocation(location) {
  return {
    id: String(
      location.id ??
        location.contentId ??
        location.content_id ??
        location.locationId ??
        location.location_id,
    ),
    contentId: String(
      location.contentId ??
        location.content_id ??
        location.id ??
        location.locationId ??
        location.location_id,
    ),
    name: location.name ?? location.title ?? '',
    category: location.category ?? location.contentType ?? location.content_type ?? '기타',
    address:
      location.address ?? location.addr1 ?? location.roadAddress ?? location.road_address ?? '',
    region: location.region ?? location.areaName ?? location.area_name ?? location.address ?? '',
    latitude: Number(location.latitude ?? location.lat ?? location.mapY ?? location.map_y),
    longitude: Number(
      location.longitude ?? location.lng ?? location.lon ?? location.mapX ?? location.map_x,
    ),
    thumbnailImageUrl:
      location.thumbnailImageUrl ??
      location.thumbnail_image_url ??
      location.firstImage2 ??
      location.first_image2 ??
      '',
    originalImageUrl:
      location.originalImageUrl ??
      location.original_image_url ??
      location.firstImage ??
      location.first_image ??
      '',
  }
}

function normalizePost(post) {
  return {
    id: String(post.id ?? post.postId ?? post.post_id),
    title: post.title ?? '',
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API 요청에 실패했습니다. (${response.status})`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function getLocations() {
  if (USE_MOCK_API) {
    await delay()
    return mockLocations.map(normalizeLocation)
  }

  const response = await request('/api/locations')

  const items = Array.isArray(response)
    ? response
    : (response.items ?? response.content ?? response.locations ?? response.results ?? [])

  return items.map(normalizeLocation)
}

export async function getRelatedPosts(locationId) {
  if (USE_MOCK_API) {
    await delay(120)

    return (mockRelatedPosts[locationId] ?? []).map(normalizePost)
  }

  const response = await request(`/api/locations/${encodeURIComponent(locationId)}/posts`)

  const items = Array.isArray(response)
    ? response
    : (response.items ?? response.content ?? response.posts ?? response.results ?? [])

  return items.slice(0, 3).map(normalizePost)
}
