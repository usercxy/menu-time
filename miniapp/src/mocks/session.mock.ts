import type { SessionDTO, TokenBundleDTO, WechatLoginDTO } from '@/services/types/auth'

export const mockTokenBundle: TokenBundleDTO = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 60 * 60 * 24
}

export const mockSession: SessionDTO = {
  user: {
    id: 'user_001',
    nickname: '林深见鹿',
    role: 'admin',
    householdId: 'household_lin'
  }
}

export const mockWechatLogin: WechatLoginDTO = {
  ...mockTokenBundle,
  user: mockSession.user
}
