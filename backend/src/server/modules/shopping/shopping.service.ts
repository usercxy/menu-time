import { Prisma, type RecipeVersionIngredient } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { withTransaction, type DbClient } from "@/server/db/transactions";
import type { AuthSession } from "@/server/lib/auth/session";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { mapShoppingListDetailDto, mapShoppingListItemDto } from "@/server/modules/shopping/shopping.mapper";
import * as shoppingRepository from "@/server/modules/shopping/shopping.repository";
import type {
  ShoppingListCopyTextResultDto,
  ShoppingListDetailDto,
  ShoppingListGeneratePayload,
  ShoppingListGenerateResultDto,
  ShoppingListItemType,
  ShoppingListItemUpdatePayload,
  ShoppingListShareImageResultDto,
  ShoppingListSourceRecipeRefDto,
} from "@/server/modules/shopping/shopping.types";

const prisma = getPrismaClient();
const logger = getLogger({ module: "shopping" });

const SEASONING_KEYWORDS = [
  "盐",
  "糖",
  "冰糖",
  "白糖",
  "红糖",
  "生抽",
  "老抽",
  "酱油",
  "蚝油",
  "料酒",
  "陈醋",
  "香醋",
  "醋",
  "豆瓣酱",
  "黄豆酱",
  "甜面酱",
  "番茄酱",
  "辣椒酱",
  "胡椒",
  "胡椒粉",
  "花椒",
  "八角",
  "桂皮",
  "香叶",
  "孜然",
  "辣椒粉",
  "辣椒面",
  "淀粉",
  "生粉",
  "鸡精",
  "味精",
  "芝麻油",
  "香油",
  "麻油",
  "食用油",
  "菜籽油",
  "玉米油",
  "橄榄油",
  "黄油",
];

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type GenerateShoppingListServiceInput = SessionInput & {
  data: ShoppingListGeneratePayload;
};

type ShoppingListIdServiceInput = SessionInput & {
  id: string;
};

type UpdateShoppingListItemServiceInput = SessionInput & {
  id: string;
  data: ShoppingListItemUpdatePayload;
};

type AggregatedShoppingItem = {
  itemType: ShoppingListItemType;
  displayName: string;
  normalizedName: string;
  quantityNote: string | null;
  sourceCount: number;
  isChecked: boolean;
  sortOrder: number;
  sourceRecipeRefs: ShoppingListSourceRecipeRefDto[];
};

type CarryOverState = {
  isChecked: boolean;
  quantityNote: string | null;
};

function resolveShoppingHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
  return session?.householdId ?? requireRequestHouseholdId();
}

function resolveActingUserId(session?: Pick<AuthSession, "userId"> | null) {
  if (!session?.userId) {
    throw new AppError("未登录或登录已失效", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return session.userId;
}

function parseDateOnly(value: string, fieldName: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} 不是合法日期`, {
      code: errorCodes.VALIDATION_ERROR,
      statusCode: 400,
    });
  }

  return parsed;
}

function assertWeekStartDateIsMonday(date: Date) {
  if (date.getUTCDay() !== 1) {
    throw new AppError("weekStartDate 必须是周一", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function inferIngredientName(rawText: string) {
  const trimmed = rawText.trim();
  const matched = trimmed.match(/^[\p{Script=Han}A-Za-z]+/u);

  if (matched?.[0]) {
    return matched[0];
  }

  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function sanitizeIngredientName(name: string) {
  return name
    .trim()
    .replace(/[：:，,、/（）()]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function resolveDisplayName(ingredient: Pick<RecipeVersionIngredient, "normalizedName" | "rawText">) {
  return normalizeText(ingredient.normalizedName) ?? inferIngredientName(ingredient.rawText);
}

function resolveNormalizedName(
  ingredient: Pick<RecipeVersionIngredient, "normalizedName" | "rawText">,
) {
  return sanitizeIngredientName(resolveDisplayName(ingredient));
}

function resolveItemType(
  ingredient: Pick<RecipeVersionIngredient, "isSeasoning" | "normalizedName" | "rawText">,
): ShoppingListItemType {
  if (ingredient.isSeasoning) {
    return "seasoning";
  }

  const candidate = resolveDisplayName(ingredient);

  return SEASONING_KEYWORDS.some((keyword) => candidate.includes(keyword))
    ? "seasoning"
    : "ingredient";
}

function buildQuantityFragment(
  ingredient: Pick<RecipeVersionIngredient, "amountText" | "unit" | "rawText">,
  displayName: string,
) {
  const amountText = normalizeText(ingredient.amountText);
  const unit = normalizeText(ingredient.unit);

  if (amountText) {
    return `${amountText}${unit ?? ""}`;
  }

  const trimmedRawText = ingredient.rawText.trim();
  const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const suffix = trimmedRawText.replace(new RegExp(`^${escapedName}\\s*`, "u"), "").trim();

  return suffix || null;
}

function buildQuantityNote(
  entries: Array<{
    ingredient: Pick<RecipeVersionIngredient, "amountText" | "unit" | "rawText">;
    displayName: string;
  }>,
) {
  const normalized = entries.map((entry) => {
    const amountText = normalizeText(entry.ingredient.amountText);
    const unit = normalizeText(entry.ingredient.unit) ?? "";
    const numeric = amountText === null ? null : Number(amountText);

    return {
      fragment: buildQuantityFragment(entry.ingredient, entry.displayName),
      numericAmount: Number.isFinite(numeric) ? numeric : null,
      unit,
    };
  });

  if (
    normalized.length > 0 &&
    normalized.every((entry) => entry.numericAmount !== null) &&
    new Set(normalized.map((entry) => entry.unit)).size === 1
  ) {
    const total = normalized.reduce(
      (sum, entry) => sum + (entry.numericAmount ?? 0),
      0,
    );
    const formattedTotal = Number.isInteger(total) ? String(total) : total.toFixed(2);
    const compactTotal = formattedTotal.replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
    return `${compactTotal}${normalized[0]?.unit ?? ""}`;
  }

  const fragments = Array.from(
    new Set(
      normalized
        .map((entry) => entry.fragment)
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );

  return fragments.length > 0 ? fragments.join(" + ") : null;
}

function buildCarryOverMap(
  items: Array<{
    itemType: string;
    normalizedName: string;
    isChecked: boolean;
    quantityNote: string | null;
  }>,
) {
  const carryOver = new Map<string, CarryOverState>();

  for (const item of items) {
    carryOver.set(`${item.itemType}:${item.normalizedName}`, {
      isChecked: item.isChecked,
      quantityNote: item.quantityNote,
    });
  }

  return carryOver;
}

function buildShoppingListCopyText(detail: ShoppingListDetailDto) {
  const lines = [`购物清单 V${detail.versionNo} (${detail.weekStartDate})`, ""];

  const sections = [
    {
      title: "食材",
      items: detail.ingredientItems,
    },
    {
      title: "调料",
      items: detail.seasoningItems,
    },
  ];

  for (const section of sections) {
    lines.push(section.title);

    if (section.items.length === 0) {
      lines.push("- 暂无");
      lines.push("");
      continue;
    }

    for (const item of section.items) {
      const quantity = item.quantityNote ? ` ${item.quantityNote}` : "";
      const source = item.sourceCount > 0 ? `（${item.sourceCount} 道菜）` : "";
      lines.push(`- ${item.displayName}${quantity}${source}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildShareImageDataUrl(detail: ShoppingListDetailDto) {
  const lines = [
    `购物清单 V${detail.versionNo}`,
    `${detail.weekStartDate}`,
    "",
    "食材",
    ...detail.ingredientItems.slice(0, 8).map((item) =>
      `• ${item.displayName}${item.quantityNote ? ` ${item.quantityNote}` : ""}`,
    ),
    "",
    "调料",
    ...detail.seasoningItems.slice(0, 8).map((item) =>
      `• ${item.displayName}${item.quantityNote ? ` ${item.quantityNote}` : ""}`,
    ),
  ];

  const hiddenCount =
    Math.max(detail.ingredientItems.length - 8, 0) +
    Math.max(detail.seasoningItems.length - 8, 0);

  if (hiddenCount > 0) {
    lines.push("", `其余 ${hiddenCount} 项请在应用内查看`);
  }

  const lineHeight = 28;
  const svgHeight = Math.max(480, 120 + lines.length * lineHeight);
  const textNodes = lines
    .map((line, index) => {
      const isTitle = index === 0;
      const isSection = line === "食材" || line === "调料";
      const y = 60 + index * lineHeight;
      const fontSize = isTitle ? 28 : isSection ? 20 : 16;
      const fontWeight = isTitle || isSection ? 700 : 400;

      return `<text x="40" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="#1f2937">${escapeXml(line)}</text>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${svgHeight}" viewBox="0 0 1080 ${svgHeight}">
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed" />
      <stop offset="100%" stop-color="#ffedd5" />
    </linearGradient>
  </defs>
  <rect width="1080" height="${svgHeight}" rx="32" fill="url(#bg)" />
  <rect x="20" y="20" width="1040" height="${svgHeight - 40}" rx="24" fill="#ffffff" />
  ${textNodes}
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function getShoppingListOrThrow(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  const shoppingList = await shoppingRepository.findShoppingListById(db, input);

  if (!shoppingList) {
    throw new AppError("购物清单不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return shoppingList;
}

async function getShoppingListItemOrThrow(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  const item = await shoppingRepository.findShoppingListItemById(db, input);

  if (!item) {
    throw new AppError("购物清单项不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return item;
}

function buildAggregatedShoppingItems(input: {
  week: shoppingRepository.MealPlanWeekForShoppingGenerationRecord;
  previousActiveItems: Array<{
    itemType: string;
    normalizedName: string;
    isChecked: boolean;
    quantityNote: string | null;
  }>;
}) {
  const carryOver = buildCarryOverMap(input.previousActiveItems);
  const buckets = new Map<
    string,
    {
      itemType: ShoppingListItemType;
      displayName: string;
      normalizedName: string;
      quantityEntries: Array<{
        ingredient: Pick<RecipeVersionIngredient, "amountText" | "unit" | "rawText">;
        displayName: string;
      }>;
      sourceRecipeRefs: ShoppingListSourceRecipeRefDto[];
    }
  >();

  for (const mealPlanItem of input.week.items) {
    for (const ingredient of mealPlanItem.recipeVersion.ingredients) {
      const displayName = resolveDisplayName(ingredient);
      const normalizedName = resolveNormalizedName(ingredient);

      if (!normalizedName) {
        continue;
      }

      const itemType = resolveItemType(ingredient);
      const key = `${itemType}:${normalizedName}`;
      const sourceRecipeRef: ShoppingListSourceRecipeRefDto = {
        mealPlanItemId: mealPlanItem.id,
        plannedDate: toDateString(mealPlanItem.plannedDate),
        mealSlot: mealPlanItem.mealSlot,
        recipeId: mealPlanItem.recipe.id,
        recipeName: mealPlanItem.recipe.name,
        recipeVersionId: mealPlanItem.recipeVersion.id,
        versionNumber: mealPlanItem.recipeVersion.versionNumber,
        versionName: mealPlanItem.recipeVersion.versionName,
      };

      const existing = buckets.get(key);

      if (existing) {
        existing.quantityEntries.push({
          ingredient,
          displayName,
        });
        existing.sourceRecipeRefs.push(sourceRecipeRef);
        continue;
      }

      buckets.set(key, {
        itemType,
        displayName,
        normalizedName,
        quantityEntries: [
          {
            ingredient,
            displayName,
          },
        ],
        sourceRecipeRefs: [sourceRecipeRef],
      });
    }
  }

  const sorted = Array.from(buckets.values()).sort((left, right) => {
    if (left.itemType !== right.itemType) {
      return left.itemType.localeCompare(right.itemType);
    }

    return left.displayName.localeCompare(right.displayName, "zh-CN");
  });

  return sorted.map<AggregatedShoppingItem>((item, index) => {
    const carryOverState = carryOver.get(`${item.itemType}:${item.normalizedName}`);

    return {
      itemType: item.itemType,
      displayName: item.displayName,
      normalizedName: item.normalizedName,
      quantityNote: carryOverState?.quantityNote ?? buildQuantityNote(item.quantityEntries),
      sourceCount: item.sourceRecipeRefs.length,
      isChecked: carryOverState?.isChecked ?? false,
      sortOrder: index,
      sourceRecipeRefs: item.sourceRecipeRefs.sort((left, right) => {
        if (left.plannedDate !== right.plannedDate) {
          return left.plannedDate.localeCompare(right.plannedDate);
        }

        return left.mealSlot.localeCompare(right.mealSlot);
      }),
    };
  });
}

export async function generateShoppingList(
  input: GenerateShoppingListServiceInput,
): Promise<ShoppingListGenerateResultDto> {
  const householdId = resolveShoppingHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const weekStartDate = parseDateOnly(input.data.weekStartDate, "weekStartDate");
  assertWeekStartDateIsMonday(weekStartDate);

  const result = await withTransaction(async (tx) => {
    const week = await shoppingRepository.findMealPlanWeekForGeneration(tx, {
      householdId,
      weekStartDate,
    });

    if (!week || week.items.length === 0) {
      throw new AppError("当前周菜单为空，暂时无法生成购物清单", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 422,
      });
    }

    const previousActive = await shoppingRepository.findLatestActiveShoppingListByWeekId(tx, {
      householdId,
      mealPlanWeekId: week.id,
    });

    const aggregatedItems = buildAggregatedShoppingItems({
      week,
      previousActiveItems: previousActive?.items ?? [],
    });

    if (aggregatedItems.length === 0) {
      throw new AppError("当前周菜单缺少可聚合的食材，暂时无法生成购物清单", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 422,
      });
    }

    const [versionNo, archivedListIds] = await Promise.all([
      shoppingRepository.getNextShoppingListVersionNo(tx, {
        mealPlanWeekId: week.id,
      }),
      shoppingRepository.archiveShoppingListsByWeekId(tx, {
        householdId,
        mealPlanWeekId: week.id,
      }),
    ]);

    const shoppingList = await shoppingRepository.createShoppingList(tx, {
      householdId,
      mealPlanWeekId: week.id,
      generatedFrom: input.data.generatedFrom ?? "manual",
      versionNo,
      createdById,
      items: aggregatedItems.map((item) => ({
        itemType: item.itemType,
        displayName: item.displayName,
        normalizedName: item.normalizedName,
        quantityNote: item.quantityNote,
        sourceCount: item.sourceCount,
        isChecked: item.isChecked,
        sortOrder: item.sortOrder,
        sourceRecipeRefs: item.sourceRecipeRefs as Prisma.InputJsonValue,
      })),
    });

    logger.info(
      {
        householdId,
        weekStartDate: input.data.weekStartDate,
        shoppingListId: shoppingList.id,
        versionNo,
        itemCount: aggregatedItems.length,
      },
      "shopping list generated",
    );

    return {
      shoppingListId: shoppingList.id,
      versionNo,
      archivedListIds,
    };
  });

  return result;
}

export async function getShoppingListDetail(
  input: ShoppingListIdServiceInput,
): Promise<ShoppingListDetailDto> {
  const householdId = resolveShoppingHouseholdId(input.session);
  const shoppingList = await getShoppingListOrThrow(prisma, {
    householdId,
    id: input.id,
  });
  const menuLastUpdatedAt = await shoppingRepository.getMealPlanWeekLastUpdatedAt(prisma, {
    mealPlanWeekId: shoppingList.mealPlanWeekId,
  });

  return mapShoppingListDetailDto({
    record: shoppingList,
    menuLastUpdatedAt,
  });
}

export async function updateShoppingListItem(
  input: UpdateShoppingListItemServiceInput,
) {
  const householdId = resolveShoppingHouseholdId(input.session);
  await getShoppingListItemOrThrow(prisma, {
    householdId,
    id: input.id,
  });

  await shoppingRepository.updateShoppingListItemById(prisma, {
    householdId,
    id: input.id,
    isChecked: input.data.isChecked,
    quantityNote: input.data.quantityNote === undefined ? undefined : normalizeText(input.data.quantityNote),
  });

  const updated = await getShoppingListItemOrThrow(prisma, {
    householdId,
    id: input.id,
  });

  return mapShoppingListItemDto(updated);
}

export async function createShoppingListCopyText(
  input: ShoppingListIdServiceInput,
): Promise<ShoppingListCopyTextResultDto> {
  const detail = await getShoppingListDetail(input);

  return {
    text: buildShoppingListCopyText(detail),
  };
}

export async function createShoppingListShareImage(
  input: ShoppingListIdServiceInput,
): Promise<ShoppingListShareImageResultDto> {
  const detail = await getShoppingListDetail(input);

  return {
    taskAccepted: false,
    imageAssetId: null,
    imageDataUrl: buildShareImageDataUrl(detail),
    mimeType: "image/svg+xml",
  };
}
