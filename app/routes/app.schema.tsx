import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  DataTable,
  Badge,
  Banner,
  Text,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { SCHEMA_TYPES } from "~/lib/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const configs = await prisma.schemaConfig.findMany({
    where: { shop: session.shop },
  });

  const schemas = SCHEMA_TYPES.map((s) => {
    const config = configs.find((c) => c.schemaType === s.type);
    return {
      type: s.type,
      label: s.label,
      description: s.description,
      status: config?.status || "absent",
      enabled: config?.enabled || false,
      id: config?.id,
    };
  });

  return { schemas };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const schemaType = formData.get("schemaType") as string;
  const enabled = formData.get("enabled") === "true";

  await prisma.schemaConfig.upsert({
    where: { shop_schemaType: { shop: session.shop, schemaType } },
    create: {
      shop: session.shop,
      schemaType,
      enabled,
      status: enabled ? "installed" : "absent",
    },
    update: { enabled, status: enabled ? "installed" : "absent" },
  });

  return { success: true };
};

const statusBadge = (status: string) => {
  switch (status) {
    case "installed":
      return <Badge tone="success">Instalado</Badge>;
    case "invalid":
      return <Badge tone="critical">Inválido</Badge>;
    default:
      return <Badge tone="warning">Ausente</Badge>;
  }
};

export default function SchemaManager() {
  const { schemas } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const rows = schemas.map((s) => [
    s.label,
    s.description,
    statusBadge(s.enabled ? "installed" : s.status),
    <button
      key={s.type}
      type="button"
      onClick={() =>
        fetcher.submit(
          { schemaType: s.type, enabled: String(!s.enabled) },
          { method: "POST" },
        )
      }
      style={{ background: "none", border: "1px solid #ccc", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
    >
      {s.enabled ? "Desativar" : "Ativar via App Embed"}
    </button>,
  ]);

  return (
    <Page title="Schema Manager">
      <BlockStack gap="500">
        <Banner tone="info">
          Schemas são injetados via Theme App Extension, sem modificar arquivos do tema.
        </Banner>
        {fetcher.data?.success && <Banner tone="success">Schema atualizado!</Banner>}

        <Card>
          <BlockStack gap="300">
            <Text as="p" tone="subdued">
              Tipos suportados: Product, FAQ, Organization, Breadcrumb, Article, Collection
            </Text>
            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Schema", "Descrição", "Status", "Ação"]}
              rows={rows}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
