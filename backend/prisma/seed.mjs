import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_HOUSEHOLD_NAME = "Default Household";
const DEFAULT_ADMIN_NICKNAME = "Default Admin";

const DEFAULT_CATEGORIES = [
  { name: "Home Style", color: "#E07A5F", sortOrder: 0 },
  { name: "Soup", color: "#3A86FF", sortOrder: 1 },
  { name: "Staple", color: "#2A9D8F", sortOrder: 2 },
  { name: "Vegetable", color: "#84A59D", sortOrder: 3 },
];

const DEFAULT_TAGS = [
  { name: "Quick", sortOrder: 0 },
  { name: "Comfort", sortOrder: 1 },
  { name: "Easy", sortOrder: 2 },
];

const DEMO_RECIPE_SLUG = "demo-braised-pork-ribs";
const DEMO_MOMENT_ASSET_KEY_SUFFIX = "demo-braised-pork-ribs-moment.jpg";
const DEMO_MEAL_PLAN_WEEK_START = "2026-04-20";
const RANDOM_DEMO_RECIPES = [
  {
    slug: "demo-tomato-egg-soup",
    name: "番茄鸡蛋汤",
    categoryName: "Soup",
    versionName: "家常快手版",
    ingredientsText: "番茄 2 个、鸡蛋 2 个、葱花少许、盐 适量",
    tips: "番茄先炒出汁，汤底会更香。",
    tags: ["Quick", "Easy"],
    ingredients: [
      { sortOrder: 0, rawText: "番茄 2 个", normalizedName: "番茄", amountText: "2", unit: "个", isSeasoning: false },
      { sortOrder: 1, rawText: "鸡蛋 2 个", normalizedName: "鸡蛋", amountText: "2", unit: "个", isSeasoning: false },
      { sortOrder: 2, rawText: "盐 适量", normalizedName: "盐", amountText: null, unit: null, isSeasoning: true },
    ],
    steps: [
      "番茄切块备用。",
      "少油炒软番茄，加热水煮开。",
      "淋入蛋液，撒葱花和盐调味。",
    ],
  },
  {
    slug: "demo-winter-melon-shrimp-soup",
    name: "冬瓜虾皮汤",
    categoryName: "Soup",
    versionName: "清爽版",
    ingredientsText: "冬瓜 300g、虾皮 1 小把、姜 2 片、盐 少许",
    tips: "虾皮先冲洗，汤会更清。",
    tags: ["Quick", "Comfort"],
    ingredients: [
      { sortOrder: 0, rawText: "冬瓜 300g", normalizedName: "冬瓜", amountText: "300", unit: "g", isSeasoning: false },
      { sortOrder: 1, rawText: "虾皮 1 小把", normalizedName: "虾皮", amountText: "1", unit: "把", isSeasoning: false },
      { sortOrder: 2, rawText: "姜 2 片", normalizedName: "姜", amountText: "2", unit: "片", isSeasoning: true },
    ],
    steps: [
      "冬瓜去皮切薄片。",
      "煮开后加入冬瓜和虾皮。",
      "冬瓜透明后加盐即可。",
    ],
  },
  {
    slug: "demo-stir-fried-broccoli",
    name: "清炒西兰花",
    categoryName: "Vegetable",
    versionName: "蒜香版",
    ingredientsText: "西兰花 1 颗、蒜 3 瓣、盐 少许",
    tips: "焯水后快炒，颜色更好看。",
    tags: ["Quick", "Easy"],
    ingredients: [
      { sortOrder: 0, rawText: "西兰花 1 颗", normalizedName: "西兰花", amountText: "1", unit: "颗", isSeasoning: false },
      { sortOrder: 1, rawText: "蒜 3 瓣", normalizedName: "蒜", amountText: "3", unit: "瓣", isSeasoning: true },
      { sortOrder: 2, rawText: "盐 少许", normalizedName: "盐", amountText: null, unit: null, isSeasoning: true },
    ],
    steps: [
      "西兰花掰小朵焯水。",
      "蒜末爆香后下西兰花翻炒。",
      "加盐调味后即可出锅。",
    ],
  },
  {
    slug: "demo-oyster-lettuce",
    name: "蚝油生菜",
    categoryName: "Vegetable",
    versionName: "家常版",
    ingredientsText: "生菜 1 棵、蒜 2 瓣、蚝油 1 勺",
    tips: "生菜断生即可，不要炒太久。",
    tags: ["Quick", "Easy"],
    ingredients: [
      { sortOrder: 0, rawText: "生菜 1 棵", normalizedName: "生菜", amountText: "1", unit: "棵", isSeasoning: false },
      { sortOrder: 1, rawText: "蒜 2 瓣", normalizedName: "蒜", amountText: "2", unit: "瓣", isSeasoning: true },
      { sortOrder: 2, rawText: "蚝油 1 勺", normalizedName: "蚝油", amountText: "1", unit: "勺", isSeasoning: true },
    ],
    steps: [
      "热锅下蒜末爆香。",
      "放入生菜快速翻炒。",
      "加蚝油拌匀即可。",
    ],
  },
  {
    slug: "demo-garlic-bokchoy",
    name: "蒜蓉小白菜",
    categoryName: "Vegetable",
    versionName: "清炒版",
    ingredientsText: "小白菜 1 把、蒜 3 瓣、盐 少许",
    tips: "梗和叶分开下锅，口感更好。",
    tags: ["Quick", "Easy"],
    ingredients: [
      { sortOrder: 0, rawText: "小白菜 1 把", normalizedName: "小白菜", amountText: "1", unit: "把", isSeasoning: false },
      { sortOrder: 1, rawText: "蒜 3 瓣", normalizedName: "蒜", amountText: "3", unit: "瓣", isSeasoning: true },
    ],
    steps: [
      "小白菜洗净切段。",
      "蒜末爆香后先下菜梗。",
      "再下菜叶翻炒至断生。",
    ],
  },
  {
    slug: "demo-yangzhou-fried-rice",
    name: "扬州炒饭",
    categoryName: "Staple",
    versionName: "家常版",
    ingredientsText: "米饭 2 碗、鸡蛋 2 个、胡萝卜丁 少许、豌豆 少许",
    tips: "隔夜饭更适合炒饭。",
    tags: ["Quick", "Comfort"],
    ingredients: [
      { sortOrder: 0, rawText: "米饭 2 碗", normalizedName: "米饭", amountText: "2", unit: "碗", isSeasoning: false },
      { sortOrder: 1, rawText: "鸡蛋 2 个", normalizedName: "鸡蛋", amountText: "2", unit: "个", isSeasoning: false },
      { sortOrder: 2, rawText: "胡萝卜丁 少许", normalizedName: "胡萝卜", amountText: null, unit: null, isSeasoning: false },
    ],
    steps: [
      "鸡蛋炒散备用。",
      "下蔬菜丁炒香后加入米饭。",
      "加入鸡蛋翻炒均匀调味。",
    ],
  },
  {
    slug: "demo-mapo-tofu",
    name: "麻婆豆腐",
    categoryName: "Home Style",
    versionName: "下饭版",
    ingredientsText: "嫩豆腐 1 盒、肉末 100g、豆瓣酱 1 勺、花椒 少许",
    tips: "出锅前勾薄芡，口感更顺。",
    tags: ["Comfort"],
    ingredients: [
      { sortOrder: 0, rawText: "嫩豆腐 1 盒", normalizedName: "豆腐", amountText: "1", unit: "盒", isSeasoning: false },
      { sortOrder: 1, rawText: "肉末 100g", normalizedName: "肉末", amountText: "100", unit: "g", isSeasoning: false },
      { sortOrder: 2, rawText: "豆瓣酱 1 勺", normalizedName: "豆瓣酱", amountText: "1", unit: "勺", isSeasoning: true },
    ],
    steps: [
      "肉末炒散，加豆瓣酱炒香。",
      "下豆腐轻推，加水煮入味。",
      "出锅前撒花椒和葱花。",
    ],
  },
];

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

async function ensureAdditionalDemoRecipes(householdId, adminId) {
  const categories = await prisma.category.findMany({
    where: {
      householdId,
      deletedAt: null,
    },
  });
  const tags = await prisma.tag.findMany({
    where: {
      householdId,
      deletedAt: null,
    },
  });

  const categoryMap = new Map(categories.map((item) => [item.name, item]));
  const tagMap = new Map(tags.map((item) => [item.name, item]));

  for (const blueprint of RANDOM_DEMO_RECIPES) {
    const existing = await prisma.recipe.findFirst({
      where: {
        householdId,
        slug: blueprint.slug,
        deletedAt: null,
      },
    });

    if (existing) {
      continue;
    }

    const category = categoryMap.get(blueprint.categoryName);
    const tagIds = blueprint.tags
      .map((tagName) => tagMap.get(tagName)?.id)
      .filter(Boolean);

    if (!category) {
      throw new Error(`Missing category for demo random recipe: ${blueprint.categoryName}`);
    }

    await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          householdId,
          name: blueprint.name,
          slug: blueprint.slug,
          createdById: adminId,
          versionCount: 0,
          momentCount: 0,
          coverSource: "none",
          status: "active",
        },
      });

      const version = await tx.recipeVersion.create({
        data: {
          householdId,
          recipeId: recipe.id,
          versionNumber: 1,
          versionName: blueprint.versionName,
          categoryId: category.id,
          ingredientsText: blueprint.ingredientsText,
          tips: blueprint.tips,
          diffSummaryText: null,
          diffSummaryJson: null,
          sourceVersionId: null,
          isMajor: true,
          createdById: adminId,
          ingredients: {
            create: blueprint.ingredients.map((ingredient) => ({
              ...ingredient,
              parseSource: "manual",
            })),
          },
          steps: {
            create: blueprint.steps.map((content, index) => ({
              sortOrder: index,
              content,
            })),
          },
          tagLinks: {
            create: tagIds.map((tagId) => ({
              tagId,
            })),
          },
        },
      });

      await tx.recipe.update({
        where: {
          id: recipe.id,
        },
        data: {
          currentVersionId: version.id,
          versionCount: 1,
        },
      });
    });
  }
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
  await ensureAdditionalDemoRecipes(household.id, admin.id);
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
