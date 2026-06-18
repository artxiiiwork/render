-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EDITOR', 'EMPLOYER');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('LONG_FORM', 'SHORTS', 'REELS', 'TIKTOK', 'CLIPS');

-- CreateEnum
CREATE TYPE "WorkFormat" AS ENUM ('STAFF', 'ONGOING', 'PROJECT');

-- CreateEnum
CREATE TYPE "Employment" AS ENUM ('FULL_TIME', 'PART_TIME', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "PayPeriod" AS ENUM ('PER_PROJECT', 'PER_HOUR', 'PER_MONTH');

-- CreateEnum
CREATE TYPE "EmployerType" AS ENUM ('BLOGGER', 'STUDIO', 'AGENCY', 'BRAND');

-- CreateEnum
CREATE TYPE "EditorStatus" AS ENUM ('SEEKING', 'OPEN', 'NOT_LOOKING');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'VIEWED', 'INVITED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorProfile" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "skills" TEXT[],
    "software" TEXT[],
    "formats" "ContentFormat"[],
    "languages" TEXT[],
    "experienceYears" INTEGER,
    "workFormats" "WorkFormat"[],
    "payMin" INTEGER,
    "payMax" INTEGER,
    "payPeriod" "PayPeriod",
    "city" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT true,
    "status" "EditorStatus" NOT NULL DEFAULT 'SEEKING',
    "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "type" "EmployerType" NOT NULL,
    "description" TEXT,
    "channelUrl" TEXT,
    "logoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "editorProfileId" TEXT NOT NULL,

    CONSTRAINT "PortfolioLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacancy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workFormat" "WorkFormat" NOT NULL,
    "employment" "Employment" NOT NULL,
    "formats" "ContentFormat"[],
    "software" TEXT[],
    "skills" TEXT[],
    "payMin" INTEGER,
    "payMax" INTEGER,
    "payPeriod" "PayPeriod",
    "city" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT true,
    "status" "VacancyStatus" NOT NULL DEFAULT 'OPEN',
    "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "promotedUntil" TIMESTAMP(3),
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "vacancyId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EditorProfile_userId_key" ON "EditorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_vacancyId_editorId_key" ON "Application"("vacancyId", "editorId");

-- AddForeignKey
ALTER TABLE "EditorProfile" ADD CONSTRAINT "EditorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioLink" ADD CONSTRAINT "PortfolioLink_editorProfileId_fkey" FOREIGN KEY ("editorProfileId") REFERENCES "EditorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
