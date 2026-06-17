import prisma from "~/db.server";
import {
  OPTIMIZATION_PRESETS,
  type OptimizationSettings,
} from "~/lib/optimization-presets";

type ShopSettings = Awaited<ReturnType<typeof prisma.shopSettings.findUnique>>;

export function settingsToOptimization(settings: NonNullable<ShopSettings>): OptimizationSettings {
  return {
    lazyLoadEnabled: settings.lazyLoadEnabled,
    delayJsEnabled: settings.delayJsEnabled,
    dnsPrefetchEnabled: settings.dnsPrefetchEnabled,
    preconnectEnabled: settings.preconnectEnabled,
    preloadEnabled: settings.preloadEnabled,
    prefetchEnabled: settings.prefetchEnabled,
    fontOptimization: settings.fontOptimization,
    resourceHintsLevel: settings.resourceHintsLevel,
    delayJsTrigger: settings.delayJsTrigger,
  };
}

export async function saveOptimizationSettings(
  shop: string,
  data: Partial<OptimizationSettings>,
) {
  return prisma.shopSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...OPTIMIZATION_PRESETS[2], ...data },
  });
}

export async function applyOptimizationLevel(shop: string, level: number) {
  const preset = OPTIMIZATION_PRESETS[level] ?? OPTIMIZATION_PRESETS[3];
  const settings = await saveOptimizationSettings(shop, preset);

  await prisma.optimizationLog.create({
    data: {
      shop,
      action: "apply_level",
      details: JSON.stringify({ level, preset: preset.resourceHintsLevel }),
    },
  });

  return settings;
}

export async function runStoreOptimization(shop: string) {
  const settings = await applyOptimizationLevel(shop, 3);

  await prisma.optimizationLog.create({
    data: {
      shop,
      action: "optimize_store",
      details: "Otimização completa aplicada via Dreams SEO",
    },
  });

  return settings;
}

export async function getLastOptimization(shop: string) {
  return prisma.optimizationLog.findFirst({
    where: { shop, action: { in: ["optimize_store", "apply_level"] } },
    orderBy: { createdAt: "desc" },
  });
}
