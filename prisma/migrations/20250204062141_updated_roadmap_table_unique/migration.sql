/*
  Warnings:

  - A unique constraint covering the columns `[userId,skillName,level]` on the table `Roadmap` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_userId_skillName_level_key" ON "Roadmap"("userId", "skillName", "level");
