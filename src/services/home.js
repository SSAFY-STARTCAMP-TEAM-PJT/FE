import { getLocations } from '@/services/locationService'
import { getPosts } from '@/services/posts'

export async function getRecentPosts(limit = 3) {
  const response = await getPosts({ page: 1, size: limit })

  return response.items
}

export async function getRecommendedLocations(limit = 3) {
  const locations = await getLocations({ limit })

  return locations
}
