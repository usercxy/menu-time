-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "meal_plan_week_id" UUID NOT NULL,
    "generated_from" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "version_no" INTEGER NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" UUID NOT NULL,
    "shopping_list_id" UUID NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "normalized_name" VARCHAR(100) NOT NULL,
    "quantity_note" VARCHAR(50),
    "source_count" INTEGER NOT NULL DEFAULT 1,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source_recipe_refs" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_shopping_lists_week_version" ON "shopping_lists"("meal_plan_week_id", "version_no");

-- CreateIndex
CREATE INDEX "idx_shopping_lists_week_generated" ON "shopping_lists"("meal_plan_week_id", "generated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_shopping_list_items_list_type_sort" ON "shopping_list_items"("shopping_list_id", "item_type", "sort_order");

-- CreateIndex
CREATE INDEX "idx_shopping_list_items_list_checked" ON "shopping_list_items"("shopping_list_id", "is_checked");

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_meal_plan_week_id_fkey" FOREIGN KEY ("meal_plan_week_id") REFERENCES "meal_plan_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shopping_list_id_fkey" FOREIGN KEY ("shopping_list_id") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
