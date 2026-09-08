-- Public, text-only reflections from learners who passed a task.
CREATE TABLE "TaskSolutionNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskSolutionNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TaskSolutionNote_taskId_userId_key" ON "TaskSolutionNote"("taskId", "userId");
CREATE INDEX "TaskSolutionNote_taskId_createdAt_idx" ON "TaskSolutionNote"("taskId", "createdAt");
