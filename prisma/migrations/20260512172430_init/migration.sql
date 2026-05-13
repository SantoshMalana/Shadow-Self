-- CreateTable
CREATE TABLE "Personality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "communication_style" TEXT NOT NULL DEFAULT '{"tone":[],"vocabulary":[],"sentence_patterns":[],"explanation_style":""}',
    "thinking_patterns" TEXT NOT NULL DEFAULT '{"decision_framework":[],"values":[],"opinions":[],"contrarian_positions":[]}',
    "emotional_profile" TEXT NOT NULL DEFAULT '{"passion_topics":[],"frustration_triggers":[],"humor_style":"","empathy_markers":[]}',
    "knowledge_domains" TEXT NOT NULL DEFAULT '[]',
    "training_examples" TEXT NOT NULL DEFAULT '[]',
    "voice_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalityId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personalityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
