import type { SessionDTO, TokenBundleDTO, WechatLoginDTO } from '@/services/types/auth'

export const mockTokenBundle: TokenBundleDTO = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  accessTokenExpiresIn: 60 * 60,
  refreshTokenExpiresIn: 60 * 60 * 24 * 30
}

export const mockSession: SessionDTO = {
  userId: 'user_001',
  householdId: 'household_lin',
  householdName: '林家小馆',
  nickname: '林深见鹿',
  role: 'admin'
}

export const mockWechatLogin: WechatLoginDTO = {
  session: mockSession,
  tokens: mockTokenBundle
}
