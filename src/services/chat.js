import { apiRequest } from '@/services/api'

export async function sendChatMessage(message, conversationId = null) {
  const data = await apiRequest('/api/chat', {
    method: 'POST',
    showLoading: false,
    body: {
      message,
      conversation_id: conversationId,
    },
  })

  const reply = data?.reply ?? data?.answer ?? data?.message ?? '답변을 생성하지 못했습니다.'

  return {
    reply,
    conversationId: data?.conversation_id ?? data?.conversationId ?? conversationId,
  }
}
