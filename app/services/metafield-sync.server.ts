import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { CREATE_METAFIELD } from "~/graphql/mutations.server";
import { GET_SHOP } from "~/graphql/queries.server";
import { adminGraphql } from "~/lib/graphql.server";

export async function syncScriptsToMetafield(
  admin: AdminApiContext["admin"],
  shop: string,
) {
  try {
    const prisma = (await import("~/db.server")).default;
    const scripts = await prisma.managedScript.findMany({
      where: { shop },
      orderBy: { priority: "desc" },
    });

    const { data, errors } = await adminGraphql<{ shop?: { id: string } }>(admin, GET_SHOP);
    if (errors.length > 0) return { ok: false, error: errors.join(", ") };

    const shopId = data?.shop?.id;
    if (!shopId) return { ok: false, error: "Loja não encontrada" };

    const payload = scripts.map((s) => ({
      name: s.name,
      placement: s.placement,
      content: s.content,
      enabled: s.enabled,
      type: s.scriptType,
    }));

    const response = await admin.graphql(CREATE_METAFIELD, {
      variables: {
        metafields: [{
          ownerId: shopId,
          namespace: "dreams_seo",
          key: "scripts",
          type: "json",
          value: JSON.stringify(payload),
        }],
      },
    });

    const json = await response.json();
    const userErrors = json.data?.metafieldsSet?.userErrors ?? [];
    if (userErrors.length > 0) {
      return { ok: false, error: userErrors.map((e: { message: string }) => e.message).join(", ") };
    }
    return { ok: true };
  } catch (error) {
    console.error("[metafield-sync scripts]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erro" };
  }
}
