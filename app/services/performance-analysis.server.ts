import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { GET_FILES, GET_THEME, GET_THEME_ASSETS } from "~/graphql/queries.server";
import { adminGraphql } from "~/lib/graphql.server";
import type { OptimizationSettings } from "~/lib/optimization-presets";
import { calculateOptimizationScore } from "~/lib/optimization-presets";
import prisma from "~/db.server";

export interface HeavyImage {
  id: string;
  url: string;
  alt: string | null;
  sizeKb: number;
  format: string;
  needsWebp: boolean;
}

export interface PerformanceReport {
  mobileScore: number;
  desktopScore: number;
  metrics: {
    lcpMs: number;
    fcpMs: number;
    tbtMs: number;
    pageWeightKb: number;
    imageCount: number;
    heavyImages: number;
    scriptEstimate: number;
  };
  heavyImages: HeavyImage[];
  recommendations: string[];
  storefrontUrl: string;
}

function guessFormat(url: string): string {
  const match = url.match(/\.(webp|png|jpe?g|gif|svg)(\?|$)/i);
  return match ? match[1].toLowerCase() : "desconhecido";
}

export async function analyzeStorePerformance(
  shop: string,
  admin: AdminApiContext["admin"],
  optimization: OptimizationSettings,
  shopUrl: string,
): Promise<PerformanceReport> {
  const [filesResult, themeResult, managedScripts] = await Promise.all([
    adminGraphql(admin, GET_FILES, { first: 100 }),
    adminGraphql(admin, GET_THEME),
    prisma.managedScript.count({ where: { shop, enabled: true } }),
  ]);

  const heavyImages: HeavyImage[] = [];
  let totalImageBytes = 0;

  for (const edge of filesResult.data?.files?.edges ?? []) {
    const node = edge.node as {
      id?: string;
      alt?: string | null;
      image?: { url?: string };
      originalSource?: { fileSize?: number };
    };
    if (!node.id) continue;
    const size = node.originalSource?.fileSize ?? 0;
    const url = node.image?.url ?? "";
    totalImageBytes += size;
    const sizeKb = Math.round(size / 1024);
    const format = guessFormat(url);
    if (sizeKb >= 150) {
      heavyImages.push({
        id: node.id,
        url,
        alt: node.alt ?? null,
        sizeKb,
        format,
        needsWebp: format !== "webp" && format !== "svg",
      });
    }
  }

  heavyImages.sort((a, b) => b.sizeKb - a.sizeKb);

  let themeAssetKb = 0;
  const themeId = themeResult.data?.themes?.edges?.[0]?.node?.id;
  if (themeId) {
    const assetsResult = await adminGraphql(admin, GET_THEME_ASSETS, { themeId });
    for (const edge of assetsResult.data?.theme?.files?.edges ?? []) {
      const node = edge.node as { size?: number; filename?: string };
      if (node.filename?.match(/\.(css|js|liquid)$/i)) {
        themeAssetKb += Math.round((node.size ?? 0) / 1024);
      }
    }
  }

  const pageWeightKb = Math.round(totalImageBytes / 1024) + themeAssetKb;
  const scriptEstimate = managedScripts + 3;
  const optScore = calculateOptimizationScore(optimization);

  const mobileScore = Math.max(
    20,
    Math.min(
      98,
      Math.round(
        optScore * 0.45 +
          (pageWeightKb < 800 ? 25 : pageWeightKb < 1500 ? 15 : 5) +
          (heavyImages.length === 0 ? 15 : heavyImages.length < 5 ? 8 : 0) -
          scriptEstimate * 2,
      ),
    ),
  );

  const recommendations: string[] = [];
  if (heavyImages.length > 0) {
    recommendations.push(
      `${heavyImages.length} imagens pesadas (>150 KB). Ative WebP e lazy load.`,
    );
  }
  if (!optimization.lazyLoadEnabled) {
    recommendations.push("Ative lazy load para reduzir LCP em páginas com muitas imagens.");
  }
  if (!optimization.preloadEnabled) {
    recommendations.push("Ative preload da imagem hero para melhorar LCP.");
  }
  if (!optimization.delayJsEnabled) {
    recommendations.push("Adie JavaScript de analytics para reduzir bloqueio de renderização.");
  }
  if (optimization.resourceHintsLevel < 2) {
    recommendations.push("Suba o nível de cache para preconnect + preload.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Loja bem otimizada. Monitore mensalmente no PageSpeed Insights.");
  }

  return {
    mobileScore,
    desktopScore: Math.min(100, mobileScore + 7),
    metrics: {
      lcpMs: Math.round(1200 + pageWeightKb * 0.8 + heavyImages.length * 40),
      fcpMs: Math.round(800 + pageWeightKb * 0.4),
      tbtMs: scriptEstimate * 120,
      pageWeightKb,
      imageCount: filesResult.data?.files?.edges?.length ?? 0,
      heavyImages: heavyImages.length,
      scriptEstimate,
    },
    heavyImages: heavyImages.slice(0, 15),
    recommendations,
    storefrontUrl: shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`,
  };
}
