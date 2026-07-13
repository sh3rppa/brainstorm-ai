-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('draft', 'recording', 'processing', 'done');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'draft',
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "notes" JSONB NOT NULL DEFAULT '[]',
    "canvas_data" TEXT,
    "transcript" TEXT NOT NULL DEFAULT '',
    "ai_output" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_updated_at_idx" ON "sessions"("updated_at");
