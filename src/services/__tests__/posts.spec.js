import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }))

vi.mock('@/services/api', () => ({ apiRequest }))

import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from '@/services/posts'

describe('posts service', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('uses the Swagger list query names', async () => {
    apiRequest.mockResolvedValue({ items: [], page: 2, size: 20, total: 0, total_pages: 0 })

    await getPosts({
      query: '해운대',
      category: 'COURSE',
      placeId: '126508',
      page: 2,
      size: 20,
    })

    const [url] = apiRequest.mock.calls[0]
    const searchParams = new URL(url, 'https://example.com').searchParams

    expect(searchParams.get('query')).toBe('해운대')
    expect(searchParams.get('category')).toBe('COURSE')
    expect(searchParams.get('placeId')).toBe('126508')
    expect(searchParams.get('page')).toBe('2')
    expect(searchParams.get('size')).toBe('20')
    expect(searchParams.has('keyword')).toBe(false)
  })

  it('normalizes a post detail response', async () => {
    apiRequest.mockResolvedValue({
      id: 7,
      category: 'COURSE',
      title: '부산 여행',
      content: '내용',
      view_count: 3,
      created_at: '2026-07-16T10:00:00Z',
      updated_at: '2026-07-16T10:00:00Z',
      locations: [
        {
          content_id: '126508',
          visit_order: 1,
          content_type: '관광지',
          title: '해운대',
          latitude: 35.1,
          longitude: 129.1,
        },
      ],
    })

    const post = await getPost(7)

    expect(apiRequest).toHaveBeenCalledWith('/api/posts/7', { signal: undefined })
    expect(post).toMatchObject({ id: 7, viewCount: 3, createdAt: '2026-07-16T10:00:00Z' })
    expect(post.locations[0]).toMatchObject({
      contentId: '126508',
      visitOrder: 1,
      name: '해운대',
      category: '관광지',
    })
  })

  it.each([
    ['create', createPost, '/api/posts', 'POST'],
    ['update', (post) => updatePost(7, post), '/api/posts/7', 'PUT'],
  ])('serializes locations for %s', async (_name, request, url, method) => {
    apiRequest.mockResolvedValue({ id: 7, locations: [] })
    const post = {
      category: 'COURSE',
      title: '제목',
      content: '내용',
      password: '1234',
      locations: [
        { contentId: 'a', visitOrder: 1 },
        { contentId: 'b', visitOrder: 2 },
      ],
    }

    await request(post)

    expect(apiRequest).toHaveBeenCalledWith(url, {
      method,
      body: {
        category: 'COURSE',
        title: '제목',
        content: '내용',
        password: '1234',
        locations: [
          { content_id: 'a', visit_order: 1 },
          { content_id: 'b', visit_order: 2 },
        ],
      },
    })
  })

  it('sends the delete password in the request body', async () => {
    apiRequest.mockResolvedValue({ message: 'deleted' })

    await deletePost(7, '1234')

    expect(apiRequest).toHaveBeenCalledWith('/api/posts/7', {
      method: 'DELETE',
      body: { password: '1234' },
    })
  })
})
