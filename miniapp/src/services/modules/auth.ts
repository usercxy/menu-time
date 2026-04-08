import { request } from '@/services/request/client'
import type {
  RefreshTokenPayload,
  SessionDTO,
  TokenBundleDTO,
  WechatLoginDTO,
  WechatLoginPayload
} from '@/services/types/auth'

export const authService = {
  async getSession() {
    const response = await request<SessionDTO>({
      url: '/api/v1/auth/session'
    })
    return response.data
  },
  async login(payload: WechatLoginPayload) {
    const response = await request<WechatLoginDTO>({
      url: '/api/v1/auth/wechat-login',
      method: 'POST',
      auth: false,
      data: payload
    })
    return response.data
  },
  async refresh(payload: RefreshTokenPayload) {
    const response = await request<TokenBundleDTO>({
      url: '/api/v1/auth/refresh',
      method: 'POST',
      auth: false,
      data: payload
    })
    return response.data
  },
  async logout(payload: RefreshTokenPayload) {
    await request<{ success: true }>({
      url: '/api/v1/auth/logout',
      method: 'POST',
      auth: false,
      data: payload
    })
  }
}
