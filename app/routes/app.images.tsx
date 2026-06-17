import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  Text,
  DataTable,
  Badge,
  Banner,
  Grid,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { GET_FILES } from "~/graphql/queries.server";
import { runBulkAction } from "~/services/optimization.server";
import { generateAltText, generateSeoFilename } from "~/lib/seo-rules.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_FILES, {
    variables: { first: 100 },
  });
  const json = await response.json();
  const files = json.data?.files?.edges?.map((e: { node: unknown }) => e.node) || [];

  let totalSize = 0;
  let withoutAlt = 0;
  let largeFiles = 0;
  const urlCounts = new Map<string, number>();

  const analyzed = files.map((f: {
    id: string;
    alt?: string;
    image?: { url?: string; width?: number; height?: number };
    originalSource?: { fileSize?: number };
  }) => {
    const size = f.originalSource?.fileSize || 0;
    totalSize += size;
    if (!f.alt) withoutAlt++;
    if (size > 200000) largeFiles++;

    const url = f.image?.url || "";
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1);

    const issues: string[] = [];
    if (!f.alt) issues.push("Sem ALT");
    if (size > 200000) issues.push("Arquivo grande");
    if (urlCounts.get(url)! > 1) issues.push("Possível duplicata");

    const filename = url.split("/").pop() || "";
    const seoName = generateSeoFilename(filename.replace(/\.[^.]+$/, ""));

    return { id: f.id, url, alt: f.alt, size, issues, seoName };
  });

  const duplicates = analyzed.filter((f) => f.issues.includes("Possível duplicata")).length;

  return {
    files: analyzed,
    stats: {
      total: files.length,
      totalSizeKb: Math.round(totalSize / 1024),
      withoutAlt,
      largeFiles,
      duplicates,
      potentialSavingsKb: Math.round(largeFiles * 50),
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const result = await runBulkAction(session.shop, admin, "generate_alt");
  return { updated: result.updated };
};

export default function Images() {
  const { files, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const rows = files.slice(0, 30).map((f) => [
    f.url.split("/").pop()?.slice(0, 30) || "—",
    f.alt || <Badge tone="critical">Ausente</Badge>,
    `${Math.round(f.size / 1024)} KB`,
    f.issues.join(", ") || "OK",
    f.seoName,
  ]);

  return (
    <Page
      title="Image Optimizer"
      subtitle="Escaneamento de mídia da Shopify"
      primaryAction={{
        content: "Gerar ALT em massa",
        loading: fetcher.state !== "idle",
        onAction: () => fetcher.submit({}, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {fetcher.data?.updated !== undefined && (
          <Banner tone="success">{fetcher.data.updated} imagens atualizadas com ALT.</Banner>
        )}

        <Grid>
          {[
            { label: "Total de imagens", value: stats.total },
            { label: "Peso total", value: `${stats.totalSizeKb} KB` },
            { label: "Sem ALT", value: stats.withoutAlt },
            { label: "Arquivos grandes", value: stats.largeFiles },
            { label: "Duplicatas", value: stats.duplicates },
            { label: "Economia potencial", value: `${stats.potentialSavingsKb} KB` },
          ].map((s) => (
            <Grid.Cell key={s.label} columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
              <Card>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{s.label}</Text>
                  <Text as="p" variant="headingLg" fontWeight="bold">{s.value}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>

        <Card>
          <DataTable
            columnContentTypes={["text", "text", "numeric", "text", "text"]}
            headings={["Arquivo", "ALT", "Tamanho", "Problemas", "Nome SEO sugerido"]}
            rows={rows}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}
