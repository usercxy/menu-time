-- CreateTable
CREATE TABLE "moments" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "recipe_version_id" UUID,
    "occurred_on" DATE NOT NULL,
    "content" TEXT,
    "participants_text" VARCHAR(200),
    "taste_rating" SMALLINT,
    "difficulty_rating" SMALLINT,
    "is_cover_candidate" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_images" (
    "id" UUID NOT NULL,
    "moment_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_moments_recipe_occurred" ON "moments"("recipe_id", "occurred_on" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_moments_household_created" ON "moments"("household_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_moment_images_order" ON "moment_images"("moment_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_moment_images_asset" ON "moment_images"("moment_id", "media_asset_id");

-- AddCheckConstraint
ALTER TABLE "moments"
ADD CONSTRAINT "chk_moments_taste_rating_range"
CHECK ("taste_rating" IS NULL OR ("taste_rating" >= 1 AND "taste_rating" <= 5));

-- AddCheckConstraint
ALTER TABLE "moments"
ADD CONSTRAINT "chk_moments_difficulty_rating_range"
CHECK ("difficulty_rating" IS NULL OR ("difficulty_rating" >= 1 AND "difficulty_rating" <= 5));

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_images" ADD CONSTRAINT "moment_images_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_images" ADD CONSTRAINT "moment_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
