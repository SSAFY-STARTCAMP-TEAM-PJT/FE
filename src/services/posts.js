import { apiRequest } from '@/services/api'
import { normalizeLocationResponse } from '@/services/locationService'

function appendOptionalParam(searchParams, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    searchParams.set(key, String(value))
  }
}

function normalizePostLocation(location) {
  return {
    ...normalizeLocationResponse(location),
    visitOrder: Number(location.visitOrder ?? location.visit_order),
  }
}

export function normalizePost(post) {
  return {
    id: Number(post.id ?? post.postId ?? post.post_id),
    category: post.category ?? '',
    categoryLabel: post.category_label ?? post.categoryLabel ?? post.category ?? '여행 코스',
    title: post.title ?? '',
    content: post.content ?? '',
    viewCount: Number(post.viewCount ?? post.view_count ?? 0),
    createdAt: post.createdAt ?? post.created_at ?? '',
    updatedAt: post.updatedAt ?? post.updated_at ?? '',
    locationCount: Number(post.locationCount ?? post.location_count ?? post.locations?.length ?? 0),
    locations: Array.isArray(post.locations)
      ? post.locations
          .map(normalizePostLocation)
          .sort((a, b) => a.visitOrder - b.visitOrder)
      : [],
  }
}

function normalizePostListResponse(response) {
  const items = Array.isArray(response?.items) ? response.items.map(normalizePost) : []

  return {
    items,
    page: Number(response?.page ?? 1),
    size: Number(response?.size ?? items.length),
    total: Number(response?.total ?? 0),
    totalPages: Number(response?.total_pages ?? response?.totalPages ?? 0),
  }
}

function serializePostPayload(post) {
  return {
    category: post.category,
    title: post.title,
    content: post.content,
    password: post.password,
    locations: (post.locations ?? []).map((location, index) => ({
      content_id: String(location.contentId ?? location.content_id),
      visit_order: Number(location.visitOrder ?? location.visit_order ?? index + 1),
    })),
  }
}

export async function getPosts({
  query = '',
  category = '',
  placeId = '',
  page = 1,
  size = 10,
  signal,
} = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  appendOptionalParam(searchParams, 'query', query.trim())
  appendOptionalParam(searchParams, 'category', category)
  appendOptionalParam(searchParams, 'placeId', placeId)

  const response = await apiRequest(`/api/posts?${searchParams.toString()}`, { signal })

  return normalizePostListResponse(response)
}

export async function getPost(postId, { signal } = {}) {
  const response = await apiRequest(`/api/posts/${encodeURIComponent(postId)}`, { signal })

  return normalizePost(response)
}

export async function createPost(post) {
  const response = await apiRequest('/api/posts', {
    method: 'POST',
    body: serializePostPayload(post),
  })

  return normalizePost(response)
}

export async function updatePost(postId, post) {
  const response = await apiRequest(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: serializePostPayload(post),
  })

  return normalizePost(response)
}

export async function deletePost(postId, password) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    body: { password },
  })
}
