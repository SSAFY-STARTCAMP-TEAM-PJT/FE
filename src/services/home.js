import { apiRequest } from '@/services/api'

function normalizeList(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.items)) {
    return response.items
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.results)) {
    return response.results
  }

  return []
}

function getCreatedAt(item) {
  return item.created_at ?? item.createdAt ?? ''
}

export async function getRecentPosts(limit = 3) {
  const response = await apiRequest('/api/posts')
  const posts = normalizeList(response)

  return posts
    .sort((a, b) => {
      const aDate = new Date(getCreatedAt(a)).getTime() || 0
      const bDate = new Date(getCreatedAt(b)).getTime() || 0

      return bDate - aDate
    })
    .slice(0, limit)
}

export async function getRecommendedLocations(limit = 3) {
  const response = await apiRequest('/api/locations')
  const locations = normalizeList(response)

  return locations.slice(0, limit)
}
