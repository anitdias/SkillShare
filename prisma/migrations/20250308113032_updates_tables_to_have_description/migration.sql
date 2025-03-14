-- AlterTable
ALTER TABLE "SkillWishlist" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "UserSkill" ADD COLUMN     "description" TEXT,
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'Level 1';
