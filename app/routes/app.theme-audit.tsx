import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  Text,
  DataTable,
  Banner,
  List,
  Grid,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { analyzeTheme, estimateAppImpacts } from "~/services/audit.server";
import { GET_SCRIPT_TAGS } from "~/graphql/queries.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const [themeAudit, scriptsRes] = await Promise.all([
    analyzeTheme(admin),
    admin.graphql(GET_SCRIPT_TAGS),
  ]);

  const scriptsJson = await scriptsRes.json();
  const scriptSources = scriptsJson.data?.scriptTags?.edges?.map(
    (e: { node: { src: string } }) => e.node.src,
  ) || [];

  const appImpacts = estimateAppImpacts(scriptSources);

  return { themeAudit, appImpacts };
};

export default function ThemeAudit() {
  const { themeAudit, appImpacts } = useLoaderData<typeof loader>();

  const assetRows = themeAudit.heavyAssets.map((a) => [
    a.filename,
    `${Math.round(a.size / 1024)} KB`,
    a.size > 200000 ? "Alto" : "Médio",
  ]);

  const appRows = appImpacts.map((a) => [
    a.name,
    `${a.estimatedMs}ms`,
    a.impact === "high" ? "Alto impacto" : a.impact === "medium" ? "Médio impacto" : "Baixo impacto",
  ]);

  return (
    <Page title="Theme Audit">
      <BlockStack gap="500">
        <Grid>
          {[
            { label: "Total de assets", value: themeAudit.totalAssets },
            { label: "Arquivos CSS", value: themeAudit.totalCss },
            { label: "Arquivos JS", value: themeAudit.totalJs },
            { label: "Assets pesados", value: themeAudit.heavyAssets.length },
          ].map((s) => (
            <Grid.Cell key={s.label} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
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
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">Recomendações</Text>
            <List type="bullet">
              {themeAudit.recommendations.map((r) => (
                <List.Item key={r}>{r}</List.Item>
              ))}
            </List>
          </BlockStack>
        </Card>

        {assetRows.length > 0 && (
          <Card>
            <DataTable
              columnContentTypes={["text", "numeric", "text"]}
              headings={["Asset", "Tamanho", "Impacto"]}
              rows={assetRows}
            />
          </Card>
        )}

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">App Impact Scanner</Text>
            <Banner tone="info">Apps que injetam código no tema</Banner>
            {appRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["App", "Impacto estimado", "Ranking"]}
                rows={appRows}
              />
            ) : (
              <Text as="p" tone="subdued">Nenhum app de terceiros detectado via script tags.</Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
