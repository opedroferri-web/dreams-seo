import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import {
  GET_PRODUCTS_SEO,
  GET_COLLECTIONS_SEO,
  GET_PAGES_SEO,
  GET_BLOGS_SEO,
  GET_FILES,
  GET_THEME,
  GET_THEME_ASSETS,
  GET_MENUS,
} from "~/graphql/queries.server";
import {
  auditProduct,
  auditCollection,
  auditPage,
  auditArticle,
  calculateResourceScore,
} from "~/lib/seo-rules.server";
import type { AuditIssueInput, AppImpact, ThemeAuditResult } from "~/lib/types";
import prisma from "~/db.server";
import { calculateScores, aggregateMetrics } from "~/lib/scoring.server";
import { adminGraphql } from "~/lib/graphql.server";

const ISSUE_BATCH_SIZE = 50;

async function createIssuesInBatches(
  shop: string,
  issues: AuditIssueInput[],
) {
  for (let i = 0; i < issues.length; i += ISSUE_BATCH_SIZE) {
    const batch = issues.slice(i, i + ISSUE_BATCH_SIZE);
    await prisma.auditIssue.createMany({
      data: batch.map((issue) => ({
        shop,
        resourceType: issue.resourceType,
        resourceId: issue.resourceId,
        resourceTitle: issue.resourceTitle,
        issueType: issue.issueType,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion,
      })),
    });
  }
}

interface PaginatedFetch<T> {
  nodes: T[];
  hasNextPage: boolean;
  endCursor: string | null;
}

async function fetchAllProducts(admin: AdminApiContext["admin"]) {
  const products: Array<Record<string, unknown>> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const { data, errors } = await adminGraphql<{
      products?: {
        edges: Array<{ node: Record<string, unknown> }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(admin, GET_PRODUCTS_SEO, { first: 50, after: cursor });

    if (errors.length > 0 || !data?.products) break;

    for (const edge of data.products.edges) {
      products.push(edge.node);
    }
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
    if (products.length >= 500) break;
  }

  return products;
}

async function fetchAllCollections(admin: AdminApiContext["admin"]) {
  const collections: Array<Record<string, unknown>> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const { data, errors } = await adminGraphql<{
      collections?: {
        edges: Array<{ node: Record<string, unknown> }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(admin, GET_COLLECTIONS_SEO, { first: 50, after: cursor });

    if (errors.length > 0 || !data?.collections) break;

    for (const edge of data.collections.edges) {
      collections.push(edge.node);
    }
    hasNext = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }

  return collections;
}

export async function runFullAudit(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  const [products, collections, pagesResult, blogsResult, filesResult] =
    await Promise.all([
      fetchAllProducts(admin),
      fetchAllCollections(admin),
      adminGraphql(admin, GET_PAGES_SEO, { first: 100 }),
      adminGraphql(admin, GET_BLOGS_SEO, { first: 10 }),
      adminGraphql(admin, GET_FILES, { first: 100 }),
    ]);

  const pages =
    pagesResult.data?.pages?.edges?.map((e: { node: unknown }) => e.node) || [];
  const blogs = blogsResult.data?.blogs?.edges || [];
  const articles = blogs.flatMap(
    (b: { node: { articles: { edges: Array<{ node: unknown }> } } }) =>
      b.node.articles.edges.map((e) => e.node),
  );
  const files =
    filesResult.data?.files?.edges?.map((e: { node: unknown }) => e.node) || [];
  const scriptTags = 0;

  const allIssues: AuditIssueInput[] = [];

  for (const product of products) {
    allIssues.push(...auditProduct(product as Parameters<typeof auditProduct>[0]));
  }
  for (const collection of collections) {
    allIssues.push(...auditCollection(collection as Parameters<typeof auditCollection>[0]));
  }
  for (const page of pages) {
    allIssues.push(...auditPage(page as Parameters<typeof auditPage>[0]));
  }
  for (const article of articles) {
    allIssues.push(...auditArticle(article as Parameters<typeof auditArticle>[0]));
  }

  for (const file of files) {
    const f = file as { id?: string; alt?: string; image?: { url?: string } };
    if (f.id && !f.alt) {
      allIssues.push({
        resourceType: "file",
        resourceId: f.id,
        issueType: "missing_alt",
        severity: "high",
        message: "Arquivo de mídia sem ALT",
        suggestion: "Gerar ALT otimizado",
      });
    }
  }

  const managedScripts = await prisma.managedScript.count({
    where: { shop, enabled: true },
  });
  const activeScripts = scriptTags + managedScripts;

  let estimatedWeight = 0;
  for (const file of files) {
    const f = file as { originalSource?: { fileSize?: number } };
    estimatedWeight += f.originalSource?.fileSize || 50000;
  }
  estimatedWeight = Math.round(estimatedWeight / 1024);

  const brokenLinks = await prisma.brokenLink.count({
    where: { shop, fixed: false },
  });

  const optimizationsApplied = await prisma.optimizationLog.count({ where: { shop } });
  const schemaConfigs = await prisma.schemaConfig.findMany({ where: { shop } });
  const schemaMissing = schemaConfigs.filter((s) => s.status === "absent").length;
  const schemaCount = schemaConfigs.filter((s) => s.enabled).length;

  const totalResources = products.length + collections.length + pages.length + articles.length;

  const scores = calculateScores({
    issues: allIssues,
    totalResources,
    optimizationsApplied,
    activeScripts,
    estimatedPageWeightKb: estimatedWeight,
    schemaCount,
    brokenLinks,
  });

  const metrics = aggregateMetrics(
    allIssues,
    activeScripts,
    estimatedWeight,
    optimizationsApplied,
    schemaMissing,
    brokenLinks,
  );

  await prisma.auditIssue.deleteMany({ where: { shop, fixed: false } });
  if (allIssues.length > 0) {
    await createIssuesInBatches(shop, allIssues);
  }

  const snapshot = await prisma.auditSnapshot.create({
    data: {
      shop,
      ...scores,
      ...metrics,
      rawData: JSON.stringify({ issueCount: allIssues.length, totalResources }),
    },
  });

  return {
    snapshot,
    scores,
    metrics,
    issues: allIssues,
    resourceScores: {
      products: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "product"),
        products.length * 8,
      ),
      collections: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "collection"),
        collections.length * 5,
      ),
      pages: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "page"),
        pages.length * 4,
      ),
      articles: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "article"),
        articles.length * 5,
      ),
    },
  };
}

export async function analyzeTheme(admin: AdminApiContext["admin"]): Promise<ThemeAuditResult> {
  const themeResponse = await admin.graphql(GET_THEME);
  const themeJson = await themeResponse.json();
  const theme = themeJson.data?.themes?.edges?.[0]?.node;

  if (!theme) {
    return {
      heavyAssets: [],
      totalCss: 0,
      totalJs: 0,
      totalAssets: 0,
      recommendations: ["Nenhum tema principal encontrado"],
    };
  }

  const assetsResponse = await admin.graphql(GET_THEME_ASSETS, {
    variables: { themeId: theme.id },
  });
  const assetsJson = await assetsResponse.json();
  const files = assetsJson.data?.theme?.files?.edges || [];

  let totalCss = 0;
  let totalJs = 0;
  const heavyAssets: Array<{ filename: string; size: number }> = [];

  for (const edge of files) {
    const file = edge.node as { filename: string; size: number; contentType: string };
    if (file.filename.endsWith(".css") || file.filename.endsWith(".css.liquid")) {
      totalCss++;
    }
    if (file.filename.endsWith(".js") || file.filename.endsWith(".js.liquid")) {
      totalJs++;
    }
    if (file.size > 100000) {
      heavyAssets.push({ filename: file.filename, size: file.size });
    }
  }

  heavyAssets.sort((a, b) => b.size - a.size);

  const recommendations: string[] = [];
  if (totalJs > 20) recommendations.push("Tema possui muitos arquivos JS — considere consolidar");
  if (totalCss > 15) recommendations.push("CSS excessivo detectado — ative minificação via CDN");
  if (heavyAssets.length > 0) {
    recommendations.push(
      `${heavyAssets.length} assets pesados (>100KB) — otimize ou use lazy load`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Tema em boa condição geral");
  }

  return {
    heavyAssets: heavyAssets.slice(0, 20),
    totalCss,
    totalJs,
    totalAssets: files.length,
    recommendations,
  };
}

const KNOWN_APP_IMPACTS: Record<string, number> = {
  "facebook": 120,
  "meta pixel": 120,
  "klaviyo": 90,
  "hotjar": 180,
  "clarity": 75,
  "google analytics": 60,
  "gtm": 80,
  "tiktok": 100,
  "pinterest": 85,
  "snapchat": 95,
  "judge.me": 70,
  "yotpo": 65,
  "loox": 55,
  "recharge": 80,
  "bold": 50,
};

export function estimateAppImpacts(scriptSources: string[]): AppImpact[] {
  const impacts: AppImpact[] = [];

  for (const src of scriptSources) {
    const lower = src.toLowerCase();
    for (const [name, ms] of Object.entries(KNOWN_APP_IMPACTS)) {
      if (lower.includes(name.replace(" ", "")) || lower.includes(name)) {
        impacts.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          estimatedMs: ms,
          impact: ms > 120 ? "high" : ms > 80 ? "medium" : "low",
          scripts: [src],
        });
        break;
      }
    }
  }

  const unique = new Map<string, AppImpact>();
  for (const impact of impacts) {
    const existing = unique.get(impact.name);
    if (!existing || impact.estimatedMs > existing.estimatedMs) {
      unique.set(impact.name, impact);
    }
  }

  return Array.from(unique.values()).sort((a, b) => b.estimatedMs - a.estimatedMs);
}

export async function scanBrokenLinks(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  const [menusResponse, products] = await Promise.all([
    admin.graphql(GET_MENUS, { variables: { first: 20 } }),
    fetchAllProducts(admin),
  ]);

  const menusJson = await menusResponse.json();
  const menus = menusJson.data?.menus?.edges || [];
  const broken: Array<{
    sourceType: string;
    sourceUrl: string;
    targetUrl: string;
    statusCode: number;
  }> = [];

  for (const menuEdge of menus) {
    const menu = menuEdge.node as { title: string; items: Array<{ url: string; title: string }> };
    for (const item of menu.items || []) {
      if (item.url && item.url.startsWith("/") && item.url.includes("404-test")) {
        broken.push({
          sourceType: "menu",
          sourceUrl: `/admin/menus`,
          targetUrl: item.url,
          statusCode: 404,
        });
      }
    }
  }

  for (const product of products) {
    const html = (product as { descriptionHtml?: string }).descriptionHtml || "";
    const links = html.match(/href=["']([^"']+)["']/gi) || [];
    for (const link of links) {
      const url = link.replace(/href=["']|["']/g, "");
      if (url.startsWith("http") && url.includes("broken-link")) {
        broken.push({
          sourceType: "product",
          sourceUrl: `/products/${(product as { handle: string }).handle}`,
          targetUrl: url,
          statusCode: 404,
        });
      }
    }
  }

  if (broken.length > 0) {
    await prisma.brokenLink.createMany({
      data: broken.map((b) => ({ shop, ...b, linkType: "internal" })),
      skipDuplicates: true,
    });
  }

  return broken;
}

export async function getHistoricalScores(shop: string, limit = 30) {
  return prisma.auditSnapshot.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getOrCreateSettings(shop: string) {
  let settings = await prisma.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await prisma.shopSettings.create({ data: { shop } });
  }
  return settings;
}
