import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Layout, Grid, Banner, BlockStack } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { ScoreCard } from "~/components/ScoreCard";
import { MetricsGrid } from "~/components/MetricsGrid";
import { HistoryChart } from "~/components/HistoryChart";
import {
  runFullAudit,
  getHistoricalScores,
  getOrCreateSettings,
} from "~/services/audit.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [latestSnapshot, history] = await Promise.all([
    prisma.auditSnapshot.findFirst({
      where: { shop },
      orderBy: { createdAt: "desc" },
    }),
    getHistoricalScores(shop),
    getOrCreateSettings(shop),
  ]);

  return json({
    snapshot: latestSnapshot,
    history: history.map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("pt-BR"),
      seoScore: h.seoScore,
      performanceScore: h.performanceScore,
      technicalScore: h.technicalScore,
      optimizationScore: h.optimizationScore,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "run_audit") {
      const result = await runFullAudit(session.shop, admin);
      return json({ success: true, audit: result.scores });
    }
    return json({ success: false, error: "Ação desconhecida" });
  } catch (error) {
    console.error("[run_audit]", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao executar auditoria. Tente novamente.",
      },
      { status: 500 },
    );
  }
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
        { label: "Meta descriptions ausentes", value: snapshot.missingMetaDesc },
        { label: "Schemas ausentes", value: snapshot.missingSchemas },
        { label: "Links quebrados", value: snapshot.brokenLinks },
        { label: "Scripts ativos", value: snapshot.activeScripts },
        { label: "Peso estimado da página", value: snapshot.estimatedPageWeight, suffix: " KB" },
        { label: "Otimizações aplicadas", value: snapshot.totalOptimizations },
      ]
    : [];

  return (
    <Page
      title="Painel"
      primaryAction={{
        content: "Executar auditoria",
        loading: isLoading && fetcher.formData?.get("intent") === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {!snapshot && (
          <Banner tone="info">
            Execute sua primeira auditoria para ver os scores e métricas da loja.
          </Banner>
        )}

        {fetcher.data?.success && fetcher.data.audit && (
          <Banner tone="success">Auditoria concluída com sucesso!</Banner>
        )}

        {fetcher.data?.error && (
          <Banner tone="critical">{fetcher.data.error}</Banner>
        )}

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Score SEO" score={scores.seo} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Performance" score={scores.performance} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Técnico" score={scores.technical} />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <ScoreCard title="Otimização" score={scores.optimization} />
          </Grid.Cell>
        </Grid>

        {metrics.length > 0 && <MetricsGrid metrics={metrics} />}

        <HistoryChart history={history} />
      </BlockStack>
    </Page>
  );
}
