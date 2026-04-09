-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "asset_key" VARCHAR(255) NOT NULL,
    "asset_url" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "purpose" VARCHAR(30) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160),
    "current_version_id" UUID,
    "cover_image_id" UUID,
    "cover_source" VARCHAR(20) NOT NULL DEFAULT 'none',
    "latest_moment_at" TIMESTAMPTZ(6),
    "latest_cooked_at" DATE,
    "version_count" INTEGER NOT NULL DEFAULT 0,
    "moment_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_versions" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "version_name" VARCHAR(100),
    "category_id" UUID,
    "ingredients_text" TEXT,
    "tips" TEXT,
    "diff_summary_text" TEXT,
    "diff_summary_json" JSONB,
    "source_version_id" UUID,
    "is_major" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version_steps" (
    "id" UUID NOT NULL,
    "recipe_version_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,

    CONSTRAINT "recipe_version_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version_ingredients" (
    "id" UUID NOT NULL,
    "recipe_version_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "raw_text" VARCHAR(200) NOT NULL,
    "normalized_name" VARCHAR(100),
    "amount_text" VARCHAR(50),
    "unit" VARCHAR(20),
    "is_seasoning" BOOLEAN NOT NULL DEFAULT false,
    "parse_source" VARCHAR(20) NOT NULL DEFAULT 'manual',

    CONSTRAINT "recipe_version_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version_tags" (
    "recipe_version_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "recipe_version_tags_pkey" PRIMARY KEY ("recipe_version_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_media_assets_asset_key" ON "media_assets"("asset_key");

-- CreateIndex
CREATE INDEX "idx_media_assets_household_purpose" ON "media_assets"("household_id", "purpose", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recipes_current_version_id" ON "recipes"("current_version_id");

-- CreateIndex
CREATE INDEX "idx_recipes_household_updated" ON "recipes"("household_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_recipes_household_latest_moment" ON "recipes"("household_id", "latest_moment_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recipes_household_slug_active"
ON "recipes"("household_id", "slug")
WHERE "deleted_at" IS NULL AND "slug" IS NOT NULL;

-- CreateIndex
CREATE INDEX "idx_recipe_versions_recipe_created" ON "recipe_versions"("recipe_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recipe_versions_recipe_version" ON "recipe_versions"("recipe_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_recipe_version_steps_order" ON "recipe_version_steps"("recipe_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_recipe_version_ingredients_version_sort" ON "recipe_version_ingredients"("recipe_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_recipe_version_ingredients_normalized" ON "recipe_version_ingredients"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_recipe_version_tags_tag_id" ON "recipe_version_tags"("tag_id");

-- AddCheckConstraint
ALTER TABLE "recipes"
ADD CONSTRAINT "chk_recipes_version_count_non_negative"
CHECK ("version_count" >= 0);

-- AddCheckConstraint
ALTER TABLE "recipes"
ADD CONSTRAINT "chk_recipes_moment_count_non_negative"
CHECK ("moment_count" >= 0);

-- AddCheckConstraint
ALTER TABLE "recipe_versions"
ADD CONSTRAINT "chk_recipe_versions_version_number_positive"
CHECK ("version_number" > 0);

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "recipe_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_source_version_id_fkey" FOREIGN KEY ("source_version_id") REFERENCES "recipe_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_steps" ADD CONSTRAINT "recipe_version_steps_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_ingredients" ADD CONSTRAINT "recipe_version_ingredients_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_tags" ADD CONSTRAINT "recipe_version_tags_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_tags" ADD CONSTRAINT "recipe_version_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
