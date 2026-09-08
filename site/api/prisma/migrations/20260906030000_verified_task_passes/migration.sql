-- Product-level pass records are written by the trusted grading proxy.
CREATE TABLE "TaskPass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "passedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TaskPass_userId_taskId_key" ON "TaskPass"("userId", "taskId");
CREATE INDEX "TaskPass_taskId_passedAt_idx" ON "TaskPass"("taskId", "passedAt");
