import { AppError, errorCodes } from "@/server/lib/errors";

const unitMap = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function parseDurationToMs(input: string) {
  const match = input.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    throw new AppError("时间配置格式无效", {
      code: errorCodes.INTERNAL_ERROR,
      statusCode: 500,
      details: { input },
    });
  }

  const [, value, unit] = match;
  return Number(value) * unitMap[unit as keyof typeof unitMap];
}

export function parseDurationToSeconds(input: string) {
  return Math.floor(parseDurationToMs(input) / 1000);
}
