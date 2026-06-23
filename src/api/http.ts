/// <reference types="vite/client" />

import axios, { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'

import { BusinessCode, DEFAULT_MESSAGES, getApiMessage, getBusinessCode } from '@/api/errors'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __retryCount?: number
  }
}

const MAX_RETRIES = 3
const BASE_DELAY_MS = 400

const SUCCESS_CODES = new Set<string>([''])

const KNOWN_ERROR_CODES = new Set<string>(Object.values(BusinessCode))

function isBusinessLayerSuccess(code: string): boolean {
  return SUCCESS_CODES.has(code)
}

function isKnownApiErrorCode(code: string): boolean {
  return KNOWN_ERROR_CODES.has(code)
}

const apiBaseURL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

function shouldRejectBusinessEnvelope(body: unknown, _httpStatus: number): boolean {
  const code = readBusinessCode(body)
  if (code === undefined) return false
  if (isBusinessLayerSuccess(code)) return false
  if (isKnownApiErrorCode(code)) return true
  return true
}

function hasBusinessCodeField(body: unknown): body is { code?: unknown } {
  return body !== null && typeof body === 'object' && 'code' in body
}

function readBusinessCode(body: unknown): string | undefined {
  if (!hasBusinessCodeField(body)) return undefined
  const raw = body.code
  if (raw === undefined || raw === null || raw === '') return undefined
  return String(raw)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * 200)
}

function isRetryable(error: AxiosError): boolean {
  const status = error.response?.status
  if (status === 429) return true
  if (status === 502) return true
  if (!error.response && error.code === 'ERR_NETWORK') return true
  if (!error.response && error.message === 'Network Error') return true
  return false
}

async function toastFromInterceptor(payload: {
  type: 'error' | 'warning' | 'success'
  message: string
}): Promise<void> {
  const { useUiStore } = await import('@/stores/ui')
  useUiStore().pushToast(payload)
}

async function clearAuthFromInterceptor(): Promise<void> {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().clearSession()
}

function rejectBusinessError(
  response: AxiosResponse,
  body: unknown,
  message: string,
): Promise<never> {
  const err = new AxiosError<unknown>(
    message,
    'ERR_BAD_RESPONSE',
    response.config,
    response.request,
    { ...response, data: body },
  )
  return Promise.reject(err)
}

export const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
})

if (import.meta.env.DEV && apiBaseURL) {
  console.info('[gsad] API baseURL (custom):', apiBaseURL)
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('GSAD_TOKEN')
  const headers = AxiosHeaders.from(config.headers ?? {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  config.headers = headers
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (shouldRejectBusinessEnvelope(body, response.status)) {
      const message = getApiMessage(body, '请求失败')
      return rejectBusinessError(response, body, message)
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config

    if (config && isRetryable(error)) {
      const count = config.__retryCount ?? 0
      if (count < MAX_RETRIES) {
        config.__retryCount = count + 1
        const delay = jitter(2 ** config.__retryCount * BASE_DELAY_MS)
        await sleep(delay)
        return http.request(config)
      }
    }

    const status = error.response?.status
    const payload = error.response?.data
    const biz = getBusinessCode(payload)

    if (status === 401 || biz === BusinessCode.UNAUTHORIZED) {
      await clearAuthFromInterceptor()
      await toastFromInterceptor({
        type: 'error',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.UNAUTHORIZED]),
      })
      const { router } = await import('@/router')
      const cur = router.currentRoute.value
      if (!cur.meta.authPage) {
        void router.replace({ path: '/login', query: { redirect: cur.fullPath } })
      }
    } else if (status === 403 || biz === BusinessCode.FORBIDDEN) {
      await toastFromInterceptor({
        type: 'warning',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.FORBIDDEN]),
      })
    } else if (status === 404 || biz === BusinessCode.NOT_FOUND) {
      await toastFromInterceptor({
        type: 'warning',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.NOT_FOUND]),
      })
    } else if (status === 409 || biz === BusinessCode.STATE_CONFLICT) {
      await toastFromInterceptor({
        type: 'warning',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.STATE_CONFLICT]),
      })
    } else if (status === 400 || biz === BusinessCode.INVALID_ARGUMENT) {
      await toastFromInterceptor({
        type: 'warning',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.INVALID_ARGUMENT]),
      })
    } else if (status === 429 || biz === BusinessCode.RATE_LIMITED) {
      await toastFromInterceptor({
        type: 'warning',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.RATE_LIMITED]),
      })
    } else if (status === 500 || biz === BusinessCode.INTERNAL_ERROR) {
      await toastFromInterceptor({
        type: 'error',
        message: getApiMessage(payload, DEFAULT_MESSAGES[BusinessCode.INTERNAL_ERROR]),
      })
    } else if (error.response) {
      await toastFromInterceptor({
        type: 'error',
        message: getApiMessage(payload, error.message || '请求失败'),
      })
    } else {
      await toastFromInterceptor({
        type: 'error',
        message: '网络异常，请检查连接后重试',
      })
    }

    return Promise.reject(error)
  },
)
