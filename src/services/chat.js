import { apiRequest } from '@/services/api'

export async function sendChatMessage(message) {
  const data = await apiRequest('/api/chat', {
    method: 'POST',
    showLoading: false,
    body: {
      message,
    },
  })

  const reply = data?.answer ?? '답변을 생성하지 못했습니다.'

  return {
    reply,
  }
}
