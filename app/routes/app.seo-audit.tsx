import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Layout, Grid, Banner, BlockStack, Card, Text, Badge } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { ScoreCard } from "~/components/ScoreCard";
import { IssuesTable } from "~/components/IssuesTable";
import { BulkActionsPanel } from "~/components/BulkActions";
import { runFullAudit } from "~/services/audit.server";
import { runBulkAction, type BulkAction } from "~/services/optimization.server";
import { calculateResourceScore } from "~/lib/seo-rules.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const issues = await prisma.auditIssue.findMany({
    where: { shop, fixed: false },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const byType = {
    product: issues.filter((i) => i.resourceType === "product"),
    collection: issues.filter((i) => i.resourceType === "collection"),
    page: issues.filter((i) => i.resourceType === "page"),
    article: issues.filter((i) => i.resourceType === "article"),
  };

  return json({
    issues,
    scores: {
      products: calculateResourceScore(byType.product, Math.max(byType.product.length, 1) * 8),
      collections: calculateResourceScore(byType.collection, Math.max(byType.collection.length, 1) * 5),
      pages: calculateResourceScore(byType.page, Math.max(byType.page.length, 1) * 4),
      articles: calculateResourceScore(byType.article, Math.max(byType.article.length, 1) * 5),
    },
    counts: {
      products: byType.product.length,
      collections: byType.collection.length,
      pages: byType.page.length,
      articles: byType.article.length,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "run_audit") {
      await runFullAudit(session.shop, admin);
      return json({ success: true });
    }

    if (intent === "bulk_action") {
      const actionType = formData.get("action") as BulkAction;
      const result = await runBulkAction(session.shop, admin, actionType);
      return json({ success: true, bulk: { action: actionType, updated: result.updated } });
    }

    return json({ success: false, error: "Ação desconhecida" });
  } catch (error) {
    console.error("[seo-audit action]", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar. Tente novamente.",
      },
      { status: 500 },
    );
  }
};

export default function SeoAudit() {
  const { issues, scores, counts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isLoading = fetcher.state !== "idle";

  return (
    <Page
      title="Auditoria SEO"
      primaryAction={{
        content: "Escanear loja",
        loading: isLoading && fetcher.formData?.get("intent") === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {fetcher.data?.success && !fetcher.data.error && (
          <Banner tone="success">Auditoria atualizada!</Banner>
        )}

        {fetcher.data?.error && (
          <Banner tone="critical">{fetcher.data.error}</Banner>
        )}

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Produtos" score={scores.products} description={`${counts.products} problemas`} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Coleções" score={scores.collections} description={`${counts.collections} problemas`} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Páginas" score={scores.pages} description={`${counts.pages} problemas`} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Blog" score={scores.articles} description={`${counts.articles} problemas`} />
          </Grid.Cell>
        </Grid>

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">Verificações realizadas</Text>
            <BlockStack gap="100">
              {[
                "Meta title ausente",
                "Meta description ausente",
                "Título curto ou longo",
                "Handle ruim",
                "ALT ausente",
                "Conteúdo curto",
              ].map((check) => (
                <Badge key={check} tone="info">{check}</Badge>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section>
            <IssuesTable issues={issues} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BulkActionsPanel
              loading={isLoading}
              lastResult={fetcher.data?.bulk || null}
              onAction={(action) =>
                fetcher.submit({ intent: "bulk_action", action }, { method: "POST" })
              }
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
