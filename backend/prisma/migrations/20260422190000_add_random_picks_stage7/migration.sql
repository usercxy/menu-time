-- CreateTable
CREATE TABLE "random_pick_sessions" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "mode" VARCHAR(20) NOT NULL DEFAULT 'single',
    "filter_snapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "random_pick_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "random_pick_results" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "recipe_version_id" UUID NOT NULL,
    "picked_for_date" DATE,
    "sequence_no" INTEGER NOT NULL,
    "decision" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reason_meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "random_pick_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_random_pick_sessions_household_created" ON "random_pick_sessions"("household_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_random_pick_results_session_sequence" ON "random_pick_results"("session_id", "sequence_no");

-- CreateIndex
CREATE INDEX "idx_random_pick_results_session_decision" ON "random_pick_results"("session_id", "decision", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "random_pick_sessions" ADD CONSTRAINT "random_pick_sessions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "random_pick_sessions" ADD CONSTRAINT "random_pick_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "random_pick_results" ADD CONSTRAINT "random_pick_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "random_pick_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "random_pick_results" ADD CONSTRAINT "random_pick_results_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "random_pick_results" ADD CONSTRAINT "random_pick_results_recipe_version_id_fkey" FOREIGN KEY ("recipe_version_id") REFERENCES "recipe_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_random_session_id_fkey" FOREIGN KEY ("random_session_id") REFERENCES "random_pick_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
