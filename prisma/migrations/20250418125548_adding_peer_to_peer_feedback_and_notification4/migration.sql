/*
  Warnings:

  - You are about to drop the column `response` on the `FeedbackResponse` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `FeedbackResponse` table. All the data in the column will be lost.
  - You are about to drop the column `userFeedbackId` on the `FeedbackResponse` table. All the data in the column will be lost.
  - Added the required column `feedbackReviewerId` to the `FeedbackResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responseText` to the `FeedbackResponse` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FeedbackResponse" DROP CONSTRAINT "FeedbackResponse_userFeedbackId_fkey";

-- DropIndex
DROP INDEX "FeedbackResponse_reviewerId_idx";

-- DropIndex
DROP INDEX "FeedbackResponse_userFeedbackId_idx";

-- AlterTable
ALTER TABLE "FeedbackResponse" DROP COLUMN "response",
DROP COLUMN "reviewerId",
DROP COLUMN "userFeedbackId",
ADD COLUMN     "feedbackReviewerId" TEXT NOT NULL,
ADD COLUMN     "responseText" TEXT NOT NULL,
ADD COLUMN     "responseValue" INTEGER;

-- CreateIndex
CREATE INDEX "FeedbackResponse_feedbackReviewerId_idx" ON "FeedbackResponse"("feedbackReviewerId");

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_feedbackReviewerId_fkey" FOREIGN KEY ("feedbackReviewerId") REFERENCES "FeedbackReviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
