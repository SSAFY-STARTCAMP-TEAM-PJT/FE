import { apiRequest } from '@/services/api'

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
    contentType: location.contentType ?? location.content_type ?? location.category ?? '기타',
    categoryLabel:
      location.categoryLabel ??
      location.category_label ??
      location.category ??
      location.contentType ??
      location.content_type ??
      '기타',
    address:
      location.address ?? location.addr1 ?? location.roadAddress ?? location.road_address ?? '',
    region: location.region ?? location.areaName ?? location.area_name ?? location.address ?? '',
    description: location.description ?? '',
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
    distanceKm: Number(location.distanceKm ?? location.distance_km),
  }
}

function appendOptionalParam(searchParams, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    searchParams.set(key, String(value))
  }
}

export function normalizeLocationResponse(location) {
  return normalizeLocation(location)
}

export async function getLocations({
  category = '',
  query = '',
  bounds = null,
  skip = 0,
  limit = 100,
  signal,
  showLoading = true,
} = {}) {
  const searchParams = new URLSearchParams()

  appendOptionalParam(searchParams, 'category', category)
  appendOptionalParam(searchParams, 'query', query)
  appendOptionalParam(searchParams, 'skip', skip)
  appendOptionalParam(searchParams, 'limit', limit)

  if (bounds) {
    appendOptionalParam(searchParams, 'min_lat', bounds.minLat)
    appendOptionalParam(searchParams, 'max_lat', bounds.maxLat)
    appendOptionalParam(searchParams, 'min_lng', bounds.minLng)
    appendOptionalParam(searchParams, 'max_lng', bounds.maxLng)
  }

  const response = await apiRequest(`/api/locations?${searchParams.toString()}`, {
    signal,
    showLoading,
  })

  return (Array.isArray(response) ? response : []).map(normalizeLocation)
}

export async function getLocation(contentId, { signal } = {}) {
  const response = await apiRequest(`/api/locations/${encodeURIComponent(contentId)}`, { signal })

  return normalizeLocation(response)
}

export async function getNearbyLocations(contentId, { limit = 5, signal } = {}) {
  const searchParams = new URLSearchParams({ limit: String(limit) })
  const response = await apiRequest(
    `/api/locations/${encodeURIComponent(contentId)}/nearby?${searchParams.toString()}`,
    { signal },
  )

  return (Array.isArray(response) ? response : []).map(normalizeLocation)
}
