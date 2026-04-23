-- Replace interim descriptionHtml with JSONB sections (see Stage 3 pipeline).
ALTER TABLE "Project" DROP COLUMN IF EXISTS "descriptionHtml";
ALTER TABLE "Project" ADD COLUMN "descriptionSections" JSONB;
