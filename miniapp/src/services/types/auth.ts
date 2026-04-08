export type UserRole = 'admin' | 'member'

export interface SessionUserDTO {
  id: string
  nickname: string
  role: UserRole
  householdId: string
}

export interface SessionDTO {
  user: SessionUserDTO
}

export interface TokenBundleDTO {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface WechatLoginPayload {
  code: string
}

export interface WechatLoginDTO extends TokenBundleDTO {
  user: SessionUserDTO
}

export interface RefreshTokenPayload {
  refreshToken: string
}
