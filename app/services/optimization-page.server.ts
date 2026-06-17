import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import prisma from "~/db.server";
import {
  OPTIMIZATION_PRESETS,
  type OptimizationSettings,
} from "~/lib/optimization-presets";
import {
  syncOptimizationToMetafield,
  type StorefrontConfig,
} from "~/services/metafield-sync.server";

type ShopSettings = NonNullable<Awaited<ReturnType<typeof prisma.shopSettings.findUnique>>>;

export function settingsToOptimization(settings: ShopSettings): OptimizationSettings {
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
    webpEnabled: settings.webpEnabled,
  };
}

function toStorefrontConfig(settings: ShopSettings): StorefrontConfig {
  return {
    ...settingsToOptimization(settings),
    schemaInjection: settings.schemaInjection,
    webpEnabled: settings.webpEnabled,
  };
}

function normalizeSettings(
  data: Partial<OptimizationSettings>,
  current?: ShopSettings | null,
): OptimizationSettings {
  const base = current ? settingsToOptimization(current) : OPTIMIZATION_PRESETS[2];
  const merged = { ...base, ...data };

  if (merged.delayJsTrigger === "disabled") {
    merged.delayJsEnabled = false;
    merged.delayJsTrigger =
      current?.delayJsTrigger && current.delayJsTrigger !== "disabled"
        ? current.delayJsTrigger
        : "scroll";
  }

  return merged;
}

export async function saveOptimizationSettings(
  shop: string,
  data: Partial<OptimizationSettings & { schemaInjection?: boolean }>,
  admin?: AdminApiContext["admin"],
) {
  const current = await prisma.shopSettings.findUnique({ where: { shop } });
  const normalized = normalizeSettings(data, current);

  const settings = await prisma.shopSettings.upsert({
    where: { shop },
    update: {
      ...normalized,
      ...(data.schemaInjection !== undefined
        ? { schemaInjection: data.schemaInjection }
        : {}),
    },
    create: {
      shop,
      ...OPTIMIZATION_PRESETS[2],
      ...normalized,
      schemaInjection: data.schemaInjection ?? true,
    },
  });

  if (admin) {
    await syncOptimizationToMetafield(admin, toStorefrontConfig(settings));
  }

  return settings;
}

export async function applyOptimizationLevel(
  shop: string,
  level: number,
  admin?: AdminApiContext["admin"],
) {
  const preset = OPTIMIZATION_PRESETS[level] ?? OPTIMIZATION_PRESETS[3];
  const settings = await saveOptimizationSettings(shop, preset, admin);

  await prisma.optimizationLog.create({
    data: {
      shop,
      action: "apply_level",
      details: JSON.stringify({ level }),
    },
  });

  return settings;
}

export async function runStoreOptimization(
  shop: string,
  admin?: AdminApiContext["admin"],
) {
  const settings = await applyOptimizationLevel(shop, 3, admin);

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
    where: { shop, action: { in: ["optimize_store", "apply_level", "scan_speed"] } },
    orderBy: { createdAt: "desc" },
  });
}
