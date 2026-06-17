import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Layout, Grid, Banner, BlockStack } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { ScoreCard } from "~/components/ScoreCard";
import { MetricsGrid } from "~/components/MetricsGrid";
import { HistoryChart } from "~/components/HistoryChart";
import { BulkActionsPanel, AIAssistantPanel } from "~/components/BulkActions";
import {
  runFullAudit,
  getHistoricalScores,
  getOrCreateSettings,
} from "~/services/audit.server";
import { runBulkAction, type BulkAction } from "~/services/optimization.server";
import { processAIQuery } from "~/services/ai-assistant.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const [latestSnapshot, history, settings] = await Promise.all([
    prisma.auditSnapshot.findFirst({
      where: { shop },
      orderBy: { createdAt: "desc" },
    }),
    getHistoricalScores(shop),
    getOrCreateSettings(shop),
  ]);

  return {
    snapshot: latestSnapshot,
    history: history.map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("pt-BR"),
      seoScore: h.seoScore,
      performanceScore: h.performanceScore,
      technicalScore: h.technicalScore,
      optimizationScore: h.optimizationScore,
    })),
    settings,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "run_audit") {
    const result = await runFullAudit(shop, admin);
    return { success: true, audit: result.scores };
  }

  if (intent === "bulk_action") {
    const actionType = formData.get("action") as BulkAction;
    const result = await runBulkAction(shop, admin, actionType);
    return { success: true, bulk: { action: actionType, updated: result.updated } };
  }

  if (intent === "ai_query") {
    const question = formData.get("question") as string;
    const result = await processAIQuery(shop, question);
    return { success: true, ai: result };
  }

  return { success: false };
};

export default function Dashboard() {
  const { snapshot, history } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isLoading = fetcher.state !== "idle";

  const scores = snapshot
    ? {
        seo: snapshot.seoScore,
        performance: snapshot.performanceScore,
        technical: snapshot.technicalScore,
        optimization: snapshot.optimizationScore,
      }
    : { seo: 0, performance: 0, technical: 0, optimization: 0 };

  const metrics = snapshot
    ? [
        { label: "Produtos sem SEO", value: snapshot.productsWithoutSeo },
        { label: "Imagens sem ALT", value: snapshot.imagesWithoutAlt },
        { label: "Meta Descriptions ausentes", value: snapshot.missingMetaDesc },
        { label: "Schemas ausentes", value: snapshot.missingSchemas },
        { label: "Links quebrados", value: snapshot.brokenLinks },
        { label: "Scripts ativos", value: snapshot.activeScripts },
        { label: "Peso estimado da página", value: snapshot.estimatedPageWeight, suffix: " KB" },
        { label: "Otimizações aplicadas", value: snapshot.totalOptimizations },
      ]
    : [];

  return (
    <Page
      title="Dashboard"
      primaryAction={{
        content: "Executar Auditoria",
        loading: isLoading && fetcher.formData?.get("intent") === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {!snapshot && (
          <Banner tone="info">
            Execute sua primeira auditoria para ver scores e métricas da loja.
          </Banner>
        )}

        {fetcher.data?.audit && (
          <Banner tone="success">Auditoria concluída com sucesso!</Banner>
        )}

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="SEO Score" score={scores.seo} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Performance Score" score={scores.performance} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Technical Score" score={scores.technical} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Optimization Score" score={scores.optimization} />
          </Grid.Cell>
        </Grid>

        {metrics.length > 0 && <MetricsGrid metrics={metrics} />}

        <Layout>
          <Layout.Section>
            <HistoryChart history={history} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <BulkActionsPanel
                loading={isLoading}
                lastResult={fetcher.data?.bulk || null}
                onAction={(action) =>
                  fetcher.submit({ intent: "bulk_action", action }, { method: "POST" })
                }
              />
              <AIAssistantPanel
                loading={isLoading}
                answer={fetcher.data?.ai?.answer}
                onAsk={(question) =>
                  fetcher.submit({ intent: "ai_query", question }, { method: "POST" })
                }
              />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
