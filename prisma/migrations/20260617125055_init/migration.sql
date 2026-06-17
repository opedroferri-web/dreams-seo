-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "lazyLoadEnabled" BOOLEAN NOT NULL DEFAULT true,
    "delayJsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dnsPrefetchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preconnectEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preloadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "prefetchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fontOptimization" BOOLEAN NOT NULL DEFAULT true,
    "schemaInjection" BOOLEAN NOT NULL DEFAULT true,
    "scriptManagerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "redirectManagerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "resourceHintsLevel" INTEGER NOT NULL DEFAULT 1,
    "delayJsTrigger" TEXT NOT NULL DEFAULT 'scroll',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "optimizationScore" INTEGER NOT NULL DEFAULT 0,
    "productsWithoutSeo" INTEGER NOT NULL DEFAULT 0,
    "imagesWithoutAlt" INTEGER NOT NULL DEFAULT 0,
    "missingMetaDesc" INTEGER NOT NULL DEFAULT 0,
    "missingSchemas" INTEGER NOT NULL DEFAULT 0,
    "brokenLinks" INTEGER NOT NULL DEFAULT 0,
    "activeScripts" INTEGER NOT NULL DEFAULT 0,
    "estimatedPageWeight" INTEGER NOT NULL DEFAULT 0,
    "totalOptimizations" INTEGER NOT NULL DEFAULT 0,
    "rawData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceTitle" TEXT,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "fixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ManagedScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scriptType" TEXT NOT NULL DEFAULT 'javascript',
    "placement" TEXT NOT NULL DEFAULT 'body_end',
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayRule" TEXT NOT NULL DEFAULT 'all',
    "includeUrls" TEXT,
    "excludeUrls" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 301,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BrokenLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "statusCode" INTEGER,
    "linkType" TEXT NOT NULL DEFAULT 'internal',
    "fixed" BOOLEAN NOT NULL DEFAULT false,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OptimizationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SchemaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "status" TEXT NOT NULL DEFAULT 'absent',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "AuditSnapshot_shop_createdAt_idx" ON "AuditSnapshot"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "AuditIssue_shop_resourceType_issueType_idx" ON "AuditIssue"("shop", "resourceType", "issueType");

-- CreateIndex
CREATE INDEX "AuditIssue_shop_fixed_idx" ON "AuditIssue"("shop", "fixed");

-- CreateIndex
CREATE INDEX "ManagedScript_shop_enabled_idx" ON "ManagedScript"("shop", "enabled");

-- CreateIndex
CREATE INDEX "Redirect_shop_idx" ON "Redirect"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_shop_fromPath_key" ON "Redirect"("shop", "fromPath");

-- CreateIndex
CREATE INDEX "BrokenLink_shop_fixed_idx" ON "BrokenLink"("shop", "fixed");

-- CreateIndex
CREATE INDEX "OptimizationLog_shop_createdAt_idx" ON "OptimizationLog"("shop", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchemaConfig_shop_schemaType_key" ON "SchemaConfig"("shop", "schemaType");
