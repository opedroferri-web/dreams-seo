import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { CREATE_METAFIELD } from "~/graphql/mutations.server";
import { GET_SHOP } from "~/graphql/queries.server";
import { adminGraphql } from "~/lib/graphql.server";
import type { OptimizationSettings } from "~/lib/optimization-presets";

export interface StorefrontConfig extends OptimizationSettings {
  schemaInjection: boolean;
  webpEnabled: boolean;
}

export function buildStorefrontConfig(
  settings: OptimizationSettings & { schemaInjection?: boolean; webpEnabled?: boolean },
): Record<string, boolean | number | string> {
  return {
    lazy_load_enabled: settings.lazyLoadEnabled,
    delay_js_enabled: settings.delayJsEnabled,
    delay_js_trigger: settings.delayJsEnabled ? settings.delayJsTrigger : "disabled",
    dns_prefetch_enabled: settings.dnsPrefetchEnabled,
    preconnect_enabled: settings.preconnectEnabled,
    preload_enabled: settings.preloadEnabled,
    prefetch_enabled: settings.prefetchEnabled,
    font_optimization: settings.fontOptimization,
    resource_hints_level: settings.resourceHintsLevel,
    schema_enabled: settings.schemaInjection ?? true,
    webp_enabled: settings.webpEnabled ?? true,
  };
}

export async function syncOptimizationToMetafield(
  admin: AdminApiContext["admin"],
  config: StorefrontConfig,
) {
  const { data } = await adminGraphql<{ shop?: { id: string } }>(admin, GET_SHOP);
  const shopId = data?.shop?.id;
  if (!shopId) return { ok: false, error: "Loja não encontrada" };

  const response = await admin.graphql(CREATE_METAFIELD, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "dreams_seo",
          key: "config",
          type: "json",
          value: JSON.stringify(buildStorefrontConfig(config)),
        },
      ],
    },
  });

  const json = await response.json();
  const errors = json.data?.metafieldsSet?.userErrors ?? [];
  if (errors.length > 0) {
    console.error("[metafield-sync]", errors);
    return { ok: false, error: errors.map((e: { message: string }) => e.message).join(", ") };
  }

  return { ok: true };
}
