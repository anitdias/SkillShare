-- CreateTable
CREATE TABLE "FeedbackQuestion" (
    "id" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "choice1" TEXT,
    "choice2" TEXT,
    "choice3" TEXT,
    "choice4" TEXT,
    "year" INTEGER NOT NULL,
    "original" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "feedbackQuestionId" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackReviewer" (
    "id" TEXT NOT NULL,
    "userFeedbackId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackReviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" TEXT NOT NULL,
    "userFeedbackId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "response" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFeedback_targetUserId_idx" ON "UserFeedback"("targetUserId");

-- CreateIndex
CREATE INDEX "UserFeedback_feedbackQuestionId_idx" ON "UserFeedback"("feedbackQuestionId");

-- CreateIndex
CREATE INDEX "FeedbackReviewer_userFeedbackId_idx" ON "FeedbackReviewer"("userFeedbackId");

-- CreateIndex
CREATE INDEX "FeedbackReviewer_reviewerId_idx" ON "FeedbackReviewer"("reviewerId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_userFeedbackId_idx" ON "FeedbackResponse"("userFeedbackId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_reviewerId_idx" ON "FeedbackResponse"("reviewerId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "UserFeedback" ADD CONSTRAINT "UserFeedback_feedbackQuestionId_fkey" FOREIGN KEY ("feedbackQuestionId") REFERENCES "FeedbackQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReviewer" ADD CONSTRAINT "FeedbackReviewer_userFeedbackId_fkey" FOREIGN KEY ("userFeedbackId") REFERENCES "UserFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_userFeedbackId_fkey" FOREIGN KEY ("userFeedbackId") REFERENCES "UserFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
