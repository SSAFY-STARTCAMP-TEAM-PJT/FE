import { describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }))

vi.mock('@/services/api', () => ({ apiRequest }))

import { sendChatMessage } from '@/services/chat'

describe('chat service', () => {
  it('sends only the Swagger message field and reads answer', async () => {
    apiRequest.mockResolvedValue({ answer: '반갑습니다.' })

    await expect(sendChatMessage('안녕하세요')).resolves.toEqual({ reply: '반갑습니다.' })
    expect(apiRequest).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      showLoading: false,
      body: { message: '안녕하세요' },
    })
  })
})
