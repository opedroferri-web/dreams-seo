import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import {
  UPDATE_PRODUCT_SEO,
  UPDATE_MEDIA_ALT,
  UPDATE_COLLECTION_SEO,
  CREATE_METAFIELD,
} from "~/graphql/mutations.server";
import { GET_PRODUCTS_SEO, GET_COLLECTIONS_SEO, GET_FILES } from "~/graphql/queries.server";
import {
  generateSeoTitle,
  generateMetaDescription,
  generateAltText,
  generateSeoHandle,
} from "~/lib/seo-rules.server";
import prisma from "~/db.server";

async function logOptimization(
  shop: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: string,
) {
  await prisma.optimizationLog.create({
    data: { shop, action, resourceType, resourceId, details },
  });
}

export async function bulkGenerateAltTexts(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  let cursor: string | null = null;
  let updated = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await admin.graphql(GET_FILES, {
      variables: { first: 50, after: cursor },
    });
    const json = await response.json();
    const files = json.data?.files;
    if (!files) break;

    const toUpdate: Array<{ id: string; alt: string }> = [];

    for (const edge of files.edges) {
      const node = edge.node;
      if (node.id && !node.alt) {
        const altFromUrl = node.image?.url?.split("/").pop()?.split(".")[0]?.replace(/-/g, " ");
        toUpdate.push({
          id: node.id,
          alt: generateAltText(altFromUrl || "Produto", "imagem otimizada"),
        });
      }
    }

    if (toUpdate.length > 0) {
      await admin.graphql(UPDATE_MEDIA_ALT, {
        variables: {
          input: toUpdate.map((f) => ({ id: f.id, alt: f.alt })),
        },
      });
      updated += toUpdate.length;
      for (const f of toUpdate) {
        await logOptimization(shop, "generate_alt", "file", f.id);
      }
    }

    hasNext = files.pageInfo.hasNextPage;
    cursor = files.pageInfo.endCursor;
    if (updated >= 200) break;
  }

  return { updated };
}

export async function bulkGenerateMetaDescriptions(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  let cursor: string | null = null;
  let updated = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor },
    });
    const json = await response.json();
    const products = json.data?.products;
    if (!products) break;

    for (const edge of products.edges) {
      const product = edge.node;
      if (!product.seo?.description) {
        const desc = generateMetaDescription(product.title, product.descriptionHtml);
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: {
              id: product.id,
              seo: { title: product.seo?.title || product.title, description: desc },
            },
          },
        });
        updated++;
        await logOptimization(shop, "generate_meta_description", "product", product.id);
      }
    }

    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 100) break;
  }

  return { updated };
}

export async function bulkGenerateSeoTitles(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  let cursor: string | null = null;
  let updated = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor },
    });
    const json = await response.json();
    const products = json.data?.products;
    if (!products) break;

    for (const edge of products.edges) {
      const product = edge.node;
      if (!product.seo?.title) {
        const title = generateSeoTitle(product.title);
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: {
              id: product.id,
              seo: {
                title,
                description: product.seo?.description || generateMetaDescription(product.title),
              },
            },
          },
        });
        updated++;
        await logOptimization(shop, "generate_seo_title", "product", product.id);
      }
    }

    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 100) break;
  }

  return { updated };
}

export async function bulkFixHandles(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  let cursor: string | null = null;
  let updated = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor },
    });
    const json = await response.json();
    const products = json.data?.products;
    if (!products) break;

    for (const edge of products.edges) {
      const product = edge.node;
      const idealHandle = generateSeoHandle(product.title);
      if (product.handle !== idealHandle && product.handle.includes("_")) {
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: { id: product.id, handle: idealHandle },
          },
        });
        updated++;
        await logOptimization(shop, "fix_handle", "product", product.id, idealHandle);
      }
    }

    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 50) break;
  }

  return { updated };
}

export async function bulkUpdateSchema(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  const schemaTypes = ["Product", "Organization", "BreadcrumbList", "FAQPage"];
  let updated = 0;

  for (const schemaType of schemaTypes) {
    await prisma.schemaConfig.upsert({
      where: { shop_schemaType: { shop, schemaType } },
      create: { shop, schemaType, enabled: true, status: "installed" },
      update: { enabled: true, status: "installed" },
    });

    await admin.graphql(CREATE_METAFIELD, {
      variables: {
        metafields: [
          {
            namespace: "dreams_seo",
            key: `schema_${schemaType.toLowerCase()}`,
            type: "json",
            value: JSON.stringify({ enabled: true, type: schemaType }),
            ownerId: shop,
          },
        ],
      },
    }).catch(() => {});

    updated++;
    await logOptimization(shop, "update_schema", "schema", schemaType);
  }

  return { updated };
}

export async function bulkGenerateCollectionSeo(
  shop: string,
  admin: AdminApiContext["admin"],
) {
  let cursor: string | null = null;
  let updated = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await admin.graphql(GET_COLLECTIONS_SEO, {
      variables: { first: 50, after: cursor },
    });
    const json = await response.json();
    const collections = json.data?.collections;
    if (!collections) break;

    for (const edge of collections.edges) {
      const collection = edge.node;
      if (!collection.seo?.title || !collection.seo?.description) {
        await admin.graphql(UPDATE_COLLECTION_SEO, {
          variables: {
            input: {
              id: collection.id,
              seo: {
                title: collection.seo?.title || generateSeoTitle(collection.title),
                description:
                  collection.seo?.description ||
                  generateMetaDescription(collection.title, collection.descriptionHtml),
              },
            },
          },
        });
        updated++;
        await logOptimization(shop, "generate_collection_seo", "collection", collection.id);
      }
    }

    hasNext = collections.pageInfo.hasNextPage;
    cursor = collections.pageInfo.endCursor;
  }

  return { updated };
}

export type BulkAction =
  | "generate_alt"
  | "generate_meta_descriptions"
  | "generate_seo_titles"
  | "fix_handles"
  | "update_schema"
  | "generate_collection_seo";

export async function runBulkAction(
  shop: string,
  admin: AdminApiContext["admin"],
  action: BulkAction,
) {
  switch (action) {
    case "generate_alt":
      return bulkGenerateAltTexts(shop, admin);
    case "generate_meta_descriptions":
      return bulkGenerateMetaDescriptions(shop, admin);
    case "generate_seo_titles":
      return bulkGenerateSeoTitles(shop, admin);
    case "fix_handles":
      return bulkFixHandles(shop, admin);
    case "update_schema":
      return bulkUpdateSchema(shop, admin);
    case "generate_collection_seo":
      return bulkGenerateCollectionSeo(shop, admin);
    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
}
