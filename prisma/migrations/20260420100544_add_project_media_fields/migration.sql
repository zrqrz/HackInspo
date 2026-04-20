-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "screenshotCaptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoUrl" TEXT;
