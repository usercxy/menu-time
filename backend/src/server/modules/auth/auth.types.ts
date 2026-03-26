export type SessionDto = {
  userId: string;
  householdId: string;
  householdName: string;
  nickname: string;
  role: string;
};

export type TokenPairDto = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type AuthResultDto = {
  session: SessionDto;
  tokens: TokenPairDto;
};
