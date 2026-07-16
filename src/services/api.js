import { useUiStore } from '@/stores/ui'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message)

    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function buildUrl(path) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '')
  const requestPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${requestPath}`
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function getErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => {
        const location = Array.isArray(item?.loc) ? item.loc.slice(1).join('.') : ''
        return [location, item?.msg].filter(Boolean).join(': ')
      })
      .filter(Boolean)
      .join('\n')
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail
  }

  if (data?.message) {
    return data.message
  }

  if (status === 404) {
    return '요청한 정보를 찾을 수 없습니다.'
  }

  if (status === 403) {
    return '비밀번호가 일치하지 않거나 요청 권한이 없습니다.'
  }

  if (status === 422) {
    return '입력한 내용을 확인해 주세요.'
  }

  if (status >= 500) {
    return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  return '요청을 처리하지 못했습니다.'
}

export async function apiRequest(path, options = {}) {
  const { showLoading = true, headers = {}, body, ...fetchOptions } = options

  const uiStore = useUiStore()

  if (showLoading) {
    uiStore.startLoading()
  }

  try {
    const requestHeaders = new Headers(headers)
    let requestBody = body

    const shouldSerializeBody =
      body !== undefined && body !== null && !(body instanceof FormData) && typeof body !== 'string'

    if (shouldSerializeBody) {
      requestHeaders.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(body)
    }

    const response = await fetch(buildUrl(path), {
      ...fetchOptions,
      headers: requestHeaders,
      body: requestBody,
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new ApiError(getErrorMessage(data, response.status), {
        status: response.status,
        data,
      })
    }

    return data
  } catch (error) {
    if (error instanceof ApiError || error.name === 'AbortError') {
      throw error
    }

    throw new ApiError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.', {
      data: error,
    })
  } finally {
    if (showLoading) {
      uiStore.stopLoading()
    }
  }
}
