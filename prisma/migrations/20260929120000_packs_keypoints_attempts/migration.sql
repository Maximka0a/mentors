-- Packs: existing categories become the "base" pack
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");

INSERT INTO "Pack" ("id", "slug", "name", "order", "enabled")
VALUES ('pack_base', 'base', 'Базовый банк (Notion)', 0, true);

ALTER TABLE "Category" ADD COLUMN "packId" TEXT;
UPDATE "Category" SET "packId" = 'pack_base';
ALTER TABLE "Category" ALTER COLUMN "packId" SET NOT NULL;
CREATE INDEX "Category_packId_idx" ON "Category"("packId");
ALTER TABLE "Category" ADD CONSTRAINT "Category_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Question metadata used by the grader
ALTER TABLE "Question" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "Question" ADD COLUMN "keyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- History of AI-graded answers
CREATE TABLE "GradeAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL DEFAULT 'text',
    "mode" TEXT NOT NULL DEFAULT 'study',
    "sessionId" TEXT,
    "completenessScore" INTEGER NOT NULL,
    "correctnessScore" INTEGER NOT NULL,
    "formatScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "modelOverall" INTEGER,
    "verdict" TEXT NOT NULL,
    "missedPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "factualErrors" JSONB NOT NULL DEFAULT '[]',
    "rewordedReference" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GradeAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GradeAttempt_questionId_idx" ON "GradeAttempt"("questionId");
CREATE INDEX "GradeAttempt_createdAt_idx" ON "GradeAttempt"("createdAt");
CREATE INDEX "GradeAttempt_sessionId_idx" ON "GradeAttempt"("sessionId");
ALTER TABLE "GradeAttempt" ADD CONSTRAINT "GradeAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
