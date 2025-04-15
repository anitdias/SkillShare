-- DropForeignKey
ALTER TABLE "SkillWishlist" DROP CONSTRAINT "SkillWishlist_userId_fkey";

-- AddForeignKey
ALTER TABLE "SkillWishlist" ADD CONSTRAINT "SkillWishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
