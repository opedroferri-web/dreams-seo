import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { GET_FILES } from "~/graphql/queries.server";
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
  analysisError?: string;
}

function guessFormat(url: string): string {
  const match = url.match(/\.(webp|png|jpe?g|gif|svg)(\?|$)/i);
  return match ? match[1].toLowerCase() : "desconhecido";
}

export function emptyPerformanceReport(
  shopUrl: string,
  optimization: OptimizationSettings,
  error?: string,
): PerformanceReport {
  const optScore = calculateOptimizationScore(optimization);
  return {
    mobileScore: Math.round(optScore * 0.7),
    desktopScore: Math.min(100, Math.round(optScore * 0.7) + 7),
    metrics: {
      lcpMs: 0,
      fcpMs: 0,
      tbtMs: 0,
      pageWeightKb: 0,
      imageCount: 0,
      heavyImages: 0,
      scriptEstimate: 0,
    },
    heavyImages: [],
    recommendations: [
      "Análise parcial — configure o app e clique em Otimizar loja agora.",
      ...(error ? [`Detalhe: ${error.slice(0, 120)}`] : []),
    ],
    storefrontUrl: shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`,
    analysisError: error,
  };
}

export async function analyzeStorePerformance(
  shop: string,
  admin: AdminApiContext["admin"],
  optimization: OptimizationSettings,
  shopUrl: string,
): Promise<PerformanceReport> {
  try {
    const [filesResult, managedScripts] = await Promise.all([
      adminGraphql(admin, GET_FILES, { first: 100 }),
      prisma.managedScript.count({ where: { shop, enabled: true } }),
    ]);

    if (filesResult.errors.length > 0 && !filesResult.data) {
      return emptyPerformanceReport(shopUrl, optimization, filesResult.errors.join("; "));
    }

    const heavyImages: HeavyImage[] = [];
    let estimatedImageKb = 0;

    for (const edge of filesResult.data?.files?.edges ?? []) {
      const node = edge.node as {
        id?: string;
        alt?: string | null;
        image?: { url?: string; width?: number; height?: number };
      };
      if (!node.id || !node.image?.url) continue;

      const url = node.image.url;
      const w = node.image.width ?? 800;
      const h = node.image.height ?? 800;
      const estimatedBytes = Math.round((w * h) / 12);
      estimatedImageKb += Math.round(estimatedBytes / 1024);

      const format = guessFormat(url);
      const sizeKb = Math.round(estimatedBytes / 1024);

      if (sizeKb >= 120 || format === "png") {
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

    const pageWeightKb = estimatedImageKb + 200;
    const scriptEstimate = managedScripts + 2;
    const optScore = calculateOptimizationScore(optimization);

    const mobileScore = Math.max(
      25,
      Math.min(
        98,
        Math.round(
          optScore * 0.5 +
            (pageWeightKb < 900 ? 22 : pageWeightKb < 1800 ? 12 : 4) +
            (heavyImages.length === 0 ? 12 : heavyImages.length < 8 ? 6 : 0) -
            scriptEstimate * 2,
        ),
      ),
    );

    const recommendations: string[] = [];
    if (heavyImages.length > 0) {
      recommendations.push(
        `${heavyImages.length} imagens podem ser otimizadas. Ative WebP e lazy load.`,
      );
    }
    if (!optimization.lazyLoadEnabled) {
      recommendations.push("Ative lazy load para melhorar LCP.");
    }
    if (!optimization.preloadEnabled) {
      recommendations.push("Ative preload da imagem hero.");
    }
    if (!optimization.delayJsEnabled) {
      recommendations.push("Adie JavaScript de analytics (Delay JS).");
    }
    if (optimization.resourceHintsLevel < 2) {
      recommendations.push("Suba o nível de cache para preconnect + preload.");
    }
    if (!optimization.webpEnabled) {
      recommendations.push("Ative WebP automático na aba Imagens.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Loja bem otimizada. Valide no PageSpeed Insights.");
    }

    return {
      mobileScore,
      desktopScore: Math.min(100, mobileScore + 7),
      metrics: {
        lcpMs: Math.round(1100 + pageWeightKb * 0.7 + heavyImages.length * 35),
        fcpMs: Math.round(750 + pageWeightKb * 0.35),
        tbtMs: scriptEstimate * 110,
        pageWeightKb,
        imageCount: filesResult.data?.files?.edges?.length ?? 0,
        heavyImages: heavyImages.length,
        scriptEstimate,
      },
      heavyImages: heavyImages.slice(0, 15),
      recommendations,
      storefrontUrl: shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`,
    };
  } catch (error) {
    console.error("[performance-analysis]", error);
    return emptyPerformanceReport(
      shopUrl,
      optimization,
      error instanceof Error ? error.message : "Erro na análise",
    );
  }
}
