import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_HOUSEHOLD_NAME = "Default Household";
const DEFAULT_ADMIN_NICKNAME = "Default Admin";

const DEFAULT_CATEGORIES = [
  { name: "Home Style", color: "#E07A5F", sortOrder: 0 },
  { name: "Soup", color: "#3A86FF", sortOrder: 1 },
  { name: "Staple", color: "#2A9D8F", sortOrder: 2 },
];

const DEFAULT_TAGS = [
  { name: "Quick", sortOrder: 0 },
  { name: "Comfort", sortOrder: 1 },
  { name: "Easy", sortOrder: 2 },
];

const DEMO_RECIPE_SLUG = "demo-braised-pork-ribs";
const DEMO_MOMENT_ASSET_KEY_SUFFIX = "demo-braised-pork-ribs-moment.jpg";
const DEMO_MEAL_PLAN_WEEK_START = "2026-04-20";

async function ensureDefaultHousehold() {
  const existing = await prisma.household.findFirst({
    where: {
      name: DEFAULT_HOUSEHOLD_NAME,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.household.create({
    data: {
      name: DEFAULT_HOUSEHOLD_NAME,
      status: "active",
    },
  });
}

async function ensureDefaultAdmin(householdId) {
  const existing = await prisma.user.findFirst({
    where: {
      householdId,
      role: "admin",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      householdId,
      nickname: DEFAULT_ADMIN_NICKNAME,
      role: "admin",
      status: "active",
    },
  });
}

async function ensureDefaultCategories(householdId) {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        householdId,
        name: category.name,
        deletedAt: null,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.category.create({
      data: {
        householdId,
        name: category.name,
        color: category.color,
        sortOrder: category.sortOrder,
      },
    });
  }
}

async function ensureDefaultTags(householdId) {
  for (const tag of DEFAULT_TAGS) {
    const existing = await prisma.tag.findFirst({
      where: {
        householdId,
        name: tag.name,
        deletedAt: null,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.tag.create({
      data: {
        householdId,
        name: tag.name,
        sortOrder: tag.sortOrder,
      },
    });
  }
}

async function ensureDemoRecipe(householdId, adminId) {
  const existingRecipe = await prisma.recipe.findFirst({
    where: {
      householdId,
      slug: DEMO_RECIPE_SLUG,
      deletedAt: null,
    },
    include: {
      versions: true,
    },
  });

  if (existingRecipe) {
    return {
      recipeId: existingRecipe.id,
      versionCount: existingRecipe.versions.length,
      created: false,
    };
  }

  const [homeStyleCategory, comfortTag, easyTag] = await Promise.all([
    prisma.category.findFirst({
      where: {
        householdId,
        name: "Home Style",
        deletedAt: null,
      },
    }),
    prisma.tag.findFirst({
      where: {
        householdId,
        name: "Comfort",
        deletedAt: null,
      },
    }),
    prisma.tag.findFirst({
      where: {
        householdId,
        name: "Easy",
        deletedAt: null,
      },
    }),
  ]);

  if (!homeStyleCategory || !comfortTag || !easyTag) {
    throw new Error("Default categories/tags are missing, cannot create demo recipe.");
  }

  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.create({
      data: {
        householdId,
        name: "红烧排骨",
        slug: DEMO_RECIPE_SLUG,
        createdById: adminId,
        versionCount: 0,
        momentCount: 0,
        coverSource: "none",
        status: "active",
      },
    });

    const version1 = await tx.recipeVersion.create({
      data: {
        householdId,
        recipeId: recipe.id,
        versionNumber: 1,
        versionName: "家常版",
        categoryId: homeStyleCategory.id,
        ingredientsText: "排骨 500g、姜 3 片、冰糖 15g、生抽 2 勺、老抽 1 勺",
        tips: "先焯水再炒糖色，成品会更亮。",
        diffSummaryText: null,
        diffSummaryJson: null,
        sourceVersionId: null,
        isMajor: true,
        createdById: adminId,
        ingredients: {
          create: [
            {
              sortOrder: 0,
              rawText: "排骨 500g",
              normalizedName: "排骨",
              amountText: "500",
              unit: "g",
              isSeasoning: false,
              parseSource: "manual",
            },
            {
              sortOrder: 1,
              rawText: "姜 3 片",
              normalizedName: "姜",
              amountText: "3",
              unit: "片",
              isSeasoning: false,
              parseSource: "manual",
            },
            {
              sortOrder: 2,
              rawText: "生抽 2 勺",
              normalizedName: "生抽",
              amountText: "2",
              unit: "勺",
              isSeasoning: true,
              parseSource: "manual",
            },
          ],
        },
        steps: {
          create: [
            { sortOrder: 0, content: "排骨冷水下锅焯水，捞出洗净。" },
            { sortOrder: 1, content: "锅中少油，下冰糖炒至琥珀色。" },
            { sortOrder: 2, content: "倒入排骨翻炒上色，加姜片和调味料，小火炖 35 分钟。" },
          ],
        },
        tagLinks: {
          create: [{ tagId: comfortTag.id }],
        },
      },
    });

    const version2DiffSummary = {
      ingredientsChanged: true,
      ingredientsTextBefore: "排骨 500g、姜 3 片、冰糖 15g、生抽 2 勺、老抽 1 勺",
      ingredientsTextAfter:
        "排骨 600g、姜 4 片、冰糖 10g、生抽 2 勺、老抽 1 勺、八角 1 个",
      addedTags: [easyTag.name],
      removedTags: [],
      stepCountBefore: 3,
      stepCountAfter: 4,
      summary: "主料有调整；新增标签：Easy；步骤数由 3 步调整为 4 步",
    };

    const version2 = await tx.recipeVersion.create({
      data: {
        householdId,
        recipeId: recipe.id,
        versionNumber: 2,
        versionName: "高压锅快手版",
        categoryId: homeStyleCategory.id,
        ingredientsText: "排骨 600g、姜 4 片、冰糖 10g、生抽 2 勺、老抽 1 勺、八角 1 个",
        tips: "上汽后压 12 分钟，再开盖收汁更省时。",
        diffSummaryText: version2DiffSummary.summary,
        diffSummaryJson: version2DiffSummary,
        sourceVersionId: version1.id,
        isMajor: true,
        createdById: adminId,
        ingredients: {
          create: [
            {
              sortOrder: 0,
              rawText: "排骨 600g",
              normalizedName: "排骨",
              amountText: "600",
              unit: "g",
              isSeasoning: false,
              parseSource: "manual",
            },
            {
              sortOrder: 1,
              rawText: "姜 4 片",
              normalizedName: "姜",
              amountText: "4",
              unit: "片",
              isSeasoning: false,
              parseSource: "manual",
            },
            {
              sortOrder: 2,
              rawText: "八角 1 个",
              normalizedName: "八角",
              amountText: "1",
              unit: "个",
              isSeasoning: true,
              parseSource: "manual",
            },
            {
              sortOrder: 3,
              rawText: "生抽 2 勺",
              normalizedName: "生抽",
              amountText: "2",
              unit: "勺",
              isSeasoning: true,
              parseSource: "manual",
            },
          ],
        },
        steps: {
          create: [
            { sortOrder: 0, content: "排骨焯水后冲净浮沫。" },
            { sortOrder: 1, content: "炒糖色后放入排骨翻匀。" },
            { sortOrder: 2, content: "加入热水、姜片、八角和调味料，转入高压锅。" },
            { sortOrder: 3, content: "上汽后压 12 分钟，开盖收汁至浓稠。" },
          ],
        },
        tagLinks: {
          create: [{ tagId: comfortTag.id }, { tagId: easyTag.id }],
        },
      },
    });

    await tx.recipe.update({
      where: {
        id: recipe.id,
      },
      data: {
        currentVersionId: version2.id,
        versionCount: 2,
      },
    });

    return {
      recipeId: recipe.id,
      versionCount: 2,
      created: true,
    };
  });
}

async function ensureDemoMoment(householdId, adminId, recipeId) {
  const existing = await prisma.moment.findFirst({
    where: {
      householdId,
      recipeId,
      content: "第一次做高压锅快手版，排骨更软糯，晚饭被一扫而空。",
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) {
    return {
      momentId: existing.id,
      created: false,
    };
  }

  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: {
      id: recipeId,
    },
    include: {
      currentVersion: true,
    },
  });

  const assetKey = `households/${householdId}/files/images/2026/04/${DEMO_MOMENT_ASSET_KEY_SUFFIX}`;
  const assetUrl = `https://example.com/${assetKey}`;

  const asset = await prisma.mediaAsset.upsert({
    where: {
      assetKey,
    },
    create: {
      householdId,
      assetKey,
      assetUrl,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      width: 1200,
      height: 900,
      purpose: "image",
      createdById: adminId,
    },
    update: {
      assetUrl,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      width: 1200,
      height: 900,
      purpose: "image",
    },
  });

  const created = await prisma.$transaction(async (tx) => {
    const moment = await tx.moment.create({
      data: {
        householdId,
        recipeId,
        recipeVersionId: recipe.currentVersion?.id ?? null,
        occurredOn: new Date("2026-04-18T00:00:00.000Z"),
        content: "第一次做高压锅快手版，排骨更软糯，晚饭被一扫而空。",
        participantsText: "全家",
        tasteRating: 5,
        difficultyRating: 2,
        isCoverCandidate: true,
        createdById: adminId,
        images: {
          create: [
            {
              mediaAssetId: asset.id,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    const stats = await tx.moment.aggregate({
      where: {
        householdId,
        recipeId,
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      _max: {
        createdAt: true,
        occurredOn: true,
      },
    });

    await tx.recipe.update({
      where: {
        id: recipeId,
      },
      data: {
        momentCount: stats._count._all,
        latestMomentAt: stats._max.createdAt ?? null,
        latestCookedAt: stats._max.occurredOn ?? null,
        coverImageId: asset.id,
        coverSource: "moment_latest",
      },
    });

    return moment;
  });

  return {
    momentId: created.id,
    created: true,
  };
}

async function ensureDemoMealPlan(householdId, adminId, recipeId) {
  const existingWeek = await prisma.mealPlanWeek.findFirst({
    where: {
      householdId,
      weekStartDate: new Date(`${DEMO_MEAL_PLAN_WEEK_START}T00:00:00.000Z`),
    },
    include: {
      items: true,
    },
  });

  if (existingWeek && existingWeek.items.length > 0) {
    return {
      weekId: existingWeek.id,
      itemCount: existingWeek.items.length,
      created: false,
    };
  }

  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: {
      id: recipeId,
    },
    include: {
      currentVersion: true,
    },
  });

  if (!recipe.currentVersion) {
    throw new Error("Demo recipe is missing currentVersion, cannot create demo meal plan.");
  }

  const createdWeek = await prisma.mealPlanWeek.upsert({
    where: {
      householdId_weekStartDate: {
        householdId,
        weekStartDate: new Date(`${DEMO_MEAL_PLAN_WEEK_START}T00:00:00.000Z`),
      },
    },
    create: {
      householdId,
      weekStartDate: new Date(`${DEMO_MEAL_PLAN_WEEK_START}T00:00:00.000Z`),
      status: "draft",
      createdById: adminId,
    },
    update: {},
  });

  const existingItems = await prisma.mealPlanItem.findMany({
    where: {
      mealPlanWeekId: createdWeek.id,
    },
  });

  if (existingItems.length === 0) {
    await prisma.mealPlanItem.create({
      data: {
        mealPlanWeekId: createdWeek.id,
        recipeId: recipe.id,
        recipeVersionId: recipe.currentVersion.id,
        plannedDate: new Date("2026-04-22T00:00:00.000Z"),
        mealSlot: "dinner",
        sortOrder: 0,
        sourceType: "manual",
        note: "演示周菜单",
      },
    });
  }

  const itemCount = await prisma.mealPlanItem.count({
    where: {
      mealPlanWeekId: createdWeek.id,
    },
  });

  return {
    weekId: createdWeek.id,
    itemCount,
    created: existingItems.length === 0,
  };
}

async function main() {
  const household = await ensureDefaultHousehold();
  const admin = await ensureDefaultAdmin(household.id);

  await ensureDefaultCategories(household.id);
  await ensureDefaultTags(household.id);
  const demoRecipe = await ensureDemoRecipe(household.id, admin.id);
  const demoMoment = await ensureDemoMoment(household.id, admin.id, demoRecipe.recipeId);
  const demoMealPlan = await ensureDemoMealPlan(household.id, admin.id, demoRecipe.recipeId);

  const [categoryCount, tagCount, recipeCount, recipeVersionCount, momentCount, mealPlanWeekCount, mealPlanItemCount] = await Promise.all([
    prisma.category.count({
      where: {
        householdId: household.id,
        deletedAt: null,
      },
    }),
    prisma.tag.count({
      where: {
        householdId: household.id,
        deletedAt: null,
      },
    }),
    prisma.recipe.count({
      where: {
        householdId: household.id,
        deletedAt: null,
      },
    }),
    prisma.recipeVersion.count({
      where: {
        householdId: household.id,
      },
    }),
    prisma.moment.count({
      where: {
        householdId: household.id,
        deletedAt: null,
      },
    }),
    prisma.mealPlanWeek.count({
      where: {
        householdId: household.id,
      },
    }),
    prisma.mealPlanItem.count({
      where: {
        mealPlanWeek: {
          householdId: household.id,
        },
      },
    }),
  ]);

  console.log("Seed completed");
  console.log(`Household: ${household.id} (${household.name})`);
  console.log(`Admin: ${admin.id} (${admin.nickname})`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Tags: ${tagCount}`);
  console.log(`Recipes: ${recipeCount}`);
  console.log(`Recipe Versions: ${recipeVersionCount}`);
  console.log(`Moments: ${momentCount}`);
  console.log(`Meal Plan Weeks: ${mealPlanWeekCount}`);
  console.log(`Meal Plan Items: ${mealPlanItemCount}`);
  console.log(
    `Demo Recipe: ${demoRecipe.recipeId} (${demoRecipe.created ? "created" : "existing"}, versions=${demoRecipe.versionCount})`,
  );
  console.log(`Demo Moment: ${demoMoment.momentId} (${demoMoment.created ? "created" : "existing"})`);
  console.log(`Demo Meal Plan: ${demoMealPlan.weekId} (${demoMealPlan.created ? "created" : "existing"}, items=${demoMealPlan.itemCount})`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
