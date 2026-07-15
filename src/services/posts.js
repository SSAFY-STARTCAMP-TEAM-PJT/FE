import { apiRequest } from '@/services/api'

function normalizePostResponse(response) {
  if (Array.isArray(response)) {
    return {
      items: response,
      total: response.length,
    }
  }

  if (Array.isArray(response?.items)) {
    return {
      items: response.items,
      total: response.total ?? response.total_count ?? response.items.length,
    }
  }

  if (Array.isArray(response?.data)) {
    return {
      items: response.data,
      total: response.total ?? response.total_count ?? response.data.length,
    }
  }

  if (Array.isArray(response?.results)) {
    return {
      items: response.results,
      total: response.count ?? response.total ?? response.results.length,
    }
  }

  return {
    items: [],
    total: 0,
  }
}

export async function getPosts({ keyword = '', page = 1, size = 10 } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (keyword.trim()) {
    searchParams.set('keyword', keyword.trim())
  }

  const response = await apiRequest(`/api/posts?${searchParams.toString()}`)

  return normalizePostResponse(response)
}
