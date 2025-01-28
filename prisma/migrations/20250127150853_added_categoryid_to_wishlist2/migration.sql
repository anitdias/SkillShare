/*
  Warnings:

  - Added the required column `categoryId` to the `SkillWishlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SkillWishlist" ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SkillWishlist" ADD CONSTRAINT "SkillWishlist_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
