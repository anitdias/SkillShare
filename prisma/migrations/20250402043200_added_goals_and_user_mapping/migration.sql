-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "goalCategory" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "goalTitle" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "weightage" INTEGER NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2024,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "employeeRating" SMALLINT NOT NULL DEFAULT 0,
    "managerRating" SMALLINT NOT NULL DEFAULT 0,
    "adminRating" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Goal_goalCategory_goalName_year_key" ON "Goal"("goalCategory", "goalName", "year");

-- CreateIndex
CREATE UNIQUE INDEX "UserGoal_userId_goalId_key" ON "UserGoal"("userId", "goalId");

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
