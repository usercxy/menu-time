export type UserRole = 'admin' | 'member'

export interface SessionDTO {
  userId: string
  householdId: string
  householdName: string
  nickname: string
  role: UserRole
}

export interface TokenBundleDTO {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
}

export interface WechatLoginPayload {
  code: string
  nickname?: string
}

export interface AuthResultDTO {
  session: SessionDTO
  tokens: TokenBundleDTO
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export type WechatLoginDTO = AuthResultDTO
