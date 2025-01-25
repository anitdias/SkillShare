-- CreateTable
CREATE TABLE "SkillWishlist" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillWishlist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SkillWishlist" ADD CONSTRAINT "SkillWishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
