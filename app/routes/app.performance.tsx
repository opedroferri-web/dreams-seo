import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  Text,
  DataTable,
  Badge,
  Grid,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { GET_SCRIPT_TAGS, GET_FILES, GET_THEME } from "~/graphql/queries.server";
import { estimateAppImpacts } from "~/services/audit.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [scriptsRes, filesRes, themeRes, managedScripts] = await Promise.all([
    admin.graphql(GET_SCRIPT_TAGS),
    admin.graphql(GET_FILES, { variables: { first: 50 } }),
    admin.graphql(GET_THEME),
    prisma.managedScript.findMany({ where: { shop: session.shop, enabled: true } }),
  ]);

  const scriptsJson = await scriptsRes.json();
  const filesJson = await filesRes.json();
  const themeJson = await themeRes.json();

  const scriptTags = scriptsJson.data?.scriptTags?.edges?.map(
    (e: { node: { src: string } }) => e.node.src,
  ) || [];

  const allScriptSources = [...scriptTags, ...managedScripts.map((s) => s.name)];
  const appImpacts = estimateAppImpacts(allScriptSources);

  const files = filesJson.data?.files?.edges?.length || 0;
  const theme = themeJson.data?.themes?.edges?.[0]?.node;

  return {
    metrics: {
      images: files,
      scripts: scriptTags.length + managedScripts.length,
      fonts: 0,
      css: 0,
      js: scriptTags.length,
      apps: appImpacts.length,
    },
    themeName: theme?.name || "—",
    appImpacts,
    managedScripts: managedScripts.length,
  };
};

export default function Performance() {
  const { metrics, themeName, appImpacts } = useLoaderData<typeof loader>();

  const impactTone = (impact: string) =>
    impact === "high" ? "critical" : impact === "medium" ? "warning" : "success";

  const rows = appImpacts.map((app) => [
    app.name,
    `${app.estimatedMs}ms`,
    <Badge key={app.name} tone={impactTone(app.impact)}>{app.impact}</Badge>,
    app.scripts[0]?.slice(0, 50) || "—",
  ]);

  return (
    <Page title="Performance Analyzer" subtitle={`Tema: ${themeName}`}>
      <BlockStack gap="500">
        <Banner tone="info">
          Análise baseada em scripts detectados e apps instalados. Impactos são estimativas.
        </Banner>

        <Grid>
          {[
            { label: "Imagens", value: metrics.images },
            { label: "Scripts", value: metrics.scripts },
            { label: "Apps analisados", value: metrics.apps },
          ].map((m) => (
            <Grid.Cell key={m.label} columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
              <Card>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{m.label}</Text>
                  <Text as="p" variant="headingLg" fontWeight="bold">{m.value}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">App Impact Scanner</Text>
            {rows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "numeric", "text", "text"]}
                headings={["App/Script", "Impacto estimado", "Nível", "Fonte"]}
                rows={rows}
              />
            ) : (
              <Text as="p" tone="subdued">Nenhum script de terceiros detectado.</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
