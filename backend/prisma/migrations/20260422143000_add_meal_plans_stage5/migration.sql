-- CreateTable
CREATE TABLE "meal_plan_weeks" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meal_plan_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_items" (
    "id" UUID NOT NULL,
    "meal_plan_week_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "recipe_version_id" UUID NOT NULL,
    "planned_date" DATE NOT NULL,
    "meal_slot" VARCHAR(20) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "random_session_id" UUID,
    "note" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_meal_plan_weeks_household_week" ON "meal_plan_weeks"("household_id", "week_start_date");

-- CreateIndex
CREATE INDEX "idx_meal_plan_items_week_date_slot_sort" ON "meal_plan_items"("meal_plan_week_id", "planned_date", "meal_slot", "sort_order");

-- CreateIndex
CREATE INDEX "idx_meal_plan_items_recipe_version" ON "meal_plan_items"("recipe_id", "recipe_version_id");

-- AddCheckConstraint
ALTER TABLE "meal_plan_weeks"
ADD CONSTRAINT "chk_meal_plan_weeks_monday"
CHECK (EXTRACT(ISODOW FROM "week_start_date") = 1);

-- AddForeignKey
ALTER TABLE "meal_plan_weeks" ADD CONSTRAINT "meal_plan_weeks_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_weeks" ADD CONSTRAINT "meal_plan_weeks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_meal_plan_week_id_fkey" FOREIGN KEY ("meal_plan_week_id") REFERENCES "meal_plan_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
