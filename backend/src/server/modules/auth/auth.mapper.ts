import type { AuthResultDto, SessionDto, TokenPairDto } from "@/server/modules/auth/auth.types";

type UserWithHousehold = {
  id: string;
  householdId: string;
  nickname: string;
  role: string;
  household: {
    id: string;
    name: string;
  };
};

export function mapUserToSessionDto(user: UserWithHousehold): SessionDto {
  return {
    userId: user.id,
    householdId: user.householdId,
    householdName: user.household.name,
    nickname: user.nickname,
    role: user.role,
  };
}

export function mapTokenPairDto(input: TokenPairDto): TokenPairDto {
  return input;
}

export function mapAuthResult(
  user: UserWithHousehold,
  tokens: TokenPairDto,
): AuthResultDto {
  return {
    session: mapUserToSessionDto(user),
    tokens: mapTokenPairDto(tokens),
  };
}
