-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'API', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AwardTier" AS ENUM ('WINNER', 'RUNNER_UP', 'HONORABLE_MENTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" SERIAL NOT NULL,
    "devpostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "devpostUrl" TEXT NOT NULL,
    "galleryUrl" TEXT,
    "organization" TEXT,
    "location" TEXT,
    "submissionStart" TIMESTAMP(3),
    "submissionEnd" TIMESTAMP(3),
    "registrationsCount" INTEGER,
    "prizeAmount" INTEGER,
    "themes" TEXT[],
    "winnersAnnounced" BOOLEAN NOT NULL DEFAULT false,
    "inviteOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "devpostSoftwareId" TEXT,
    "devpostUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "demoUrl" TEXT,
    "repoUrl" TEXT,
    "otherLinks" TEXT[],
    "teamMembers" TEXT[],
    "teamSize" INTEGER,
    "thumbnailUrl" TEXT,
    "difficulty" "DifficultyLevel",
    "innovationSummary" TEXT,
    "classificationStatus" "ClassificationStatus" NOT NULL DEFAULT 'PENDING',
    "classifiedAt" TIMESTAMP(3),
    "hackathonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "AwardTier" NOT NULL DEFAULT 'WINNER',
    "prizeValue" INTEGER,
    "projectId" INTEGER NOT NULL,
    "hackathonId" INTEGER NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTrack" (
    "projectId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,

    CONSTRAINT "ProjectTrack_pkey" PRIMARY KEY ("projectId","trackId")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "projectId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_devpostId_key" ON "Hackathon"("devpostId");

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_devpostUrl_key" ON "Hackathon"("devpostUrl");

-- CreateIndex
CREATE INDEX "Hackathon_submissionEnd_idx" ON "Hackathon"("submissionEnd");

-- CreateIndex
CREATE INDEX "Hackathon_winnersAnnounced_idx" ON "Hackathon"("winnersAnnounced");

-- CreateIndex
CREATE UNIQUE INDEX "Project_devpostSoftwareId_key" ON "Project"("devpostSoftwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_devpostUrl_key" ON "Project"("devpostUrl");

-- CreateIndex
CREATE INDEX "Project_hackathonId_idx" ON "Project"("hackathonId");

-- CreateIndex
CREATE INDEX "Project_difficulty_idx" ON "Project"("difficulty");

-- CreateIndex
CREATE INDEX "Project_teamSize_idx" ON "Project"("teamSize");

-- CreateIndex
CREATE INDEX "Project_classificationStatus_idx" ON "Project"("classificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Track_name_key" ON "Track"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "Award_projectId_idx" ON "Award"("projectId");

-- CreateIndex
CREATE INDEX "Award_hackathonId_idx" ON "Award"("hackathonId");

-- CreateIndex
CREATE INDEX "Award_tier_idx" ON "Award"("tier");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTrack" ADD CONSTRAINT "ProjectTrack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTrack" ADD CONSTRAINT "ProjectTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
