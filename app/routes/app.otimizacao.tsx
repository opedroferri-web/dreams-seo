import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  BlockStack,
  Card,
  Text,
  Banner,
  Layout,
  Button,
  InlineStack,
  Badge,
  Box,
  Tabs,
  DataTable,
  Link,
  List,
  Modal,
  FormLayout,
  TextField,
  Select,
  EmptyState,
  ProgressBar,
  Grid,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { syncScriptsToMetafield } from "~/services/metafield-sync.server";
import { analyzeStorePerformance, emptyPerformanceReport } from "~/services/performance-analysis.server";
import { GET_SHOP } from "~/graphql/queries.server";
import { adminGraphql } from "~/lib/graphql.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const [scripts, shopData] = await Promise.all([
    prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } }),
    adminGraphql<{ shop?: { primaryDomain?: { url: string } } }>(admin, GET_SHOP),
  ]);

  const shopUrl = shopData.data?.shop?.primaryDomain?.url ?? `https://${shop}`;

  let performance;
  try {
    performance = await analyzeStorePerformance(shop, admin, {
      lazyLoadEnabled: true,
      delayJsEnabled: false,
      dnsPrefetchEnabled: true,
      preconnectEnabled: true,
      preloadEnabled: true,
      prefetchEnabled: false,
      fontOptimization: true,
      resourceHintsLevel: 2,
      delayJsTrigger: "scroll",
      webpEnabled: true,
    }, shopUrl);
  } catch {
    performance = emptyPerformanceReport(shopUrl, {
      lazyLoadEnabled: true,
      delayJsEnabled: false,
      dnsPrefetchEnabled: true,
      preconnectEnabled: true,
      preloadEnabled: true,
      prefetchEnabled: false,
      fontOptimization: true,
      resourceHintsLevel: 2,
      delayJsTrigger: "scroll",
      webpEnabled: true,
    });
  }

  return json({
    scripts,
    performance,
    pagespeedUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(shopUrl)}`,
  });
};

async function syncAndReloadScripts(
  admin: Parameters<typeof syncScriptsToMetafield>[0],
  shop: string,
  message: string,
) {
  await syncScriptsToMetafield(admin, shop);
  const scripts = await prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } });
  return json({ success: true, message, scripts });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "create_script") {
      const name = (formData.get("name") as string)?.trim();
      const content = (formData.get("content") as string)?.trim();
      if (!name || !content) {
        return json({ success: false, error: "Nome e conteúdo são obrigatórios." }, { status: 400 });
      }
      await prisma.managedScript.create({
        data: {
          shop,
          name,
          scriptType: (formData.get("scriptType") as string) || "javascript",
          placement: (formData.get("placement") as string) || "head",
          content,
          displayRule: "all",
        },
      });
      return syncAndReloadScripts(admin, shop, `Script "${name}" adicionado.`);
    }

    if (intent === "toggle_script") {
      const id = formData.get("id") as string;
      const script = await prisma.managedScript.findUnique({ where: { id } });
      if (script) await prisma.managedScript.update({ where: { id }, data: { enabled: !script.enabled } });
      return syncAndReloadScripts(admin, shop, "Script atualizado.");
    }

    if (intent === "delete_script") {
      await prisma.managedScript.delete({ where: { id: formData.get("id") as string } });
      return syncAndReloadScripts(admin, shop, "Script removido.");
    }

    return json({ success: false, error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    console.error("[otimizacao action]", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
};

const OTIMIZACOES_ATIVAS = [
  "Preconnect e DNS prefetch para CDNs da Shopify",
  "Preload da imagem principal do produto/coleção",
  "Font-display: swap (fontes sem FOIT)",
  "Schema JSON-LD em produtos e organização",
  "Lazy load de imagens (abaixo da dobra)",
  "Conversão automática para WebP via CDN Shopify",
  "Vídeos com autoplay carregam imediatamente",
  "Carrinho e checkout protegidos (sem interferência)",
];

export default function Otimizacao() {
  const { scripts, performance, pagespeedUrl } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [tab, setTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", placement: "head", scriptType: "javascript", content: "" });

  const isLoading = fetcher.state !== "idle";
  const activeScripts = fetcher.data?.scripts ?? scripts;

  const mobileTone = performance.mobileScore >= 80 ? "success" : performance.mobileScore >= 50 ? "highlight" : "critical";

  const heavyRows = performance.heavyImages.map((img) => [
    img.url.split("/").pop()?.slice(0, 35) ?? "—",
    `${img.sizeKb} KB`,
    img.format.toUpperCase(),
    img.needsWebp
      ? <Badge tone="warning">Converter WebP</Badge>
      : <Badge tone="success">OK</Badge>,
  ]);

  const placementLabel: Record<string, string> = {
    head: "Header (<head>)",
    body_start: "Início do body",
    body_end: "Final do body",
  };

  const scriptRows = activeScripts.map((sc) => [
    sc.name,
    placementLabel[sc.placement] ?? sc.placement,
    <Badge key={sc.id} tone={sc.enabled ? "success" : "critical"}>
      {sc.enabled ? "Ativo" : "Inativo"}
    </Badge>,
    <InlineStack key={`a-${sc.id}`} gap="200">
      <Button size="slim"
        loading={isLoading && fetcher.formData?.get("id") === sc.id && fetcher.formData?.get("intent") === "toggle_script"}
        onClick={() => fetcher.submit({ intent: "toggle_script", id: sc.id }, { method: "POST" })}>
        {sc.enabled ? "Desativar" : "Ativar"}
      </Button>
      <Button size="slim" tone="critical"
        onClick={() => fetcher.submit({ intent: "delete_script", id: sc.id }, { method: "POST" })}>
        Excluir
      </Button>
    </InlineStack>,
  ]);

  const tabs = [
    { id: "velocidade", content: "Velocidade", panelID: "velocidade" },
    { id: "imagens", content: "Imagens", panelID: "imagens" },
    { id: "scripts", content: "Scripts", panelID: "scripts" },
  ];

  return (
    <Page
      title="Otimização"
      subtitle="Performance automática aplicada na sua loja"
    >
      <BlockStack gap="500">
        {fetcher.data?.success && fetcher.data.message && (
          <Banner tone="success" onDismiss={() => {}}>
            {fetcher.data.message}
          </Banner>
        )}
        {fetcher.data?.error && (
          <Banner tone="critical" onDismiss={() => {}}>
            {fetcher.data.error}
          </Banner>
        )}

        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Otimizações ativas</Text>
              <Text as="p" tone="subdued" variant="bodySm">
                Aplicadas automaticamente em toda a loja — nenhuma configuração necessária.
              </Text>
            </BlockStack>
            <Badge tone="success" size="large">ON</Badge>
          </InlineStack>
          <Box paddingBlockStart="300">
            <List type="bullet">
              {OTIMIZACOES_ATIVAS.map((o) => (
                <List.Item key={o}>{o}</List.Item>
              ))}
            </List>
          </Box>
        </Card>

        <Tabs tabs={tabs} selected={tab} onSelect={setTab}>
          {tab === 0 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                {performance.analysisError && (
                  <Banner tone="warning">Análise parcial: {performance.analysisError}</Banner>
                )}
                <Layout>
                  <Layout.Section variant="oneHalf">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Mobile</Text>
                        <Text as="p" variant="heading2xl" fontWeight="bold">
                          {performance.mobileScore}
                        </Text>
                        <ProgressBar progress={performance.mobileScore} tone={mobileTone} size="small" />
                        <Text as="p" tone="subdued" variant="bodySm">
                          Estimativa baseada em peso, imagens e otimizações ativas
                        </Text>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                  <Layout.Section variant="oneHalf">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Desktop</Text>
                        <Text as="p" variant="heading2xl" fontWeight="bold">
                          {performance.desktopScore}
                        </Text>
                        <ProgressBar progress={performance.desktopScore} tone="success" size="small" />
                        <Link url={pagespeedUrl} target="_blank">
                          Abrir no PageSpeed Insights →
                        </Link>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                </Layout>

                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">Core Web Vitals (estimativa)</Text>
                    <Grid>
                      {[
                        { label: "LCP", value: `${performance.metrics.lcpMs} ms`, hint: "Largest Contentful Paint" },
                        { label: "FCP", value: `${performance.metrics.fcpMs} ms`, hint: "First Contentful Paint" },
                        { label: "TBT", value: `${performance.metrics.tbtMs} ms`, hint: "Total Blocking Time" },
                        { label: "Peso", value: `${performance.metrics.pageWeightKb} KB`, hint: "Peso estimado" },
                      ].map((m) => (
                        <Grid.Cell key={m.label} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">{m.label}</Text>
                            <Text as="p" variant="headingMd" fontWeight="bold">{m.value}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">{m.hint}</Text>
                          </BlockStack>
                        </Grid.Cell>
                      ))}
                    </Grid>
                  </BlockStack>
                </Card>

                {performance.recommendations.length > 0 && (
                  <Card>
                    <Text as="h3" variant="headingMd">Recomendações</Text>
                    <Box paddingBlockStart="300">
                      <List type="bullet">
                        {performance.recommendations.map((r) => (
                          <List.Item key={r}>{r}</List.Item>
                        ))}
                      </List>
                    </Box>
                  </Card>
                )}
              </BlockStack>
            </Box>
          )}

          {tab === 1 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">
                    {performance.metrics.heavyImages} imagens pesadas · {performance.metrics.imageCount} total
                  </Text>
                </InlineStack>
                <Banner tone="info">
                  Imagens da Shopify são convertidas para WebP automaticamente via CDN.
                  Imagens abaixo da dobra só carregam quando o visitante está próximo.
                </Banner>
                <Card>
                  {heavyRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={["text", "numeric", "text", "text"]}
                      headings={["Arquivo", "Peso", "Formato", "Status"]}
                      rows={heavyRows}
                    />
                  ) : (
                    <Text as="p" tone="success">Nenhuma imagem pesada detectada. Excelente!</Text>
                  )}
                </Card>
              </BlockStack>
            </Box>
          )}

          {tab === 2 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">Scripts injetados na loja</Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Cole qualquer HTML, JS ou tag de rastreamento — entram direto no &lt;head&gt; ou body da vitrine.
                    </Text>
                  </BlockStack>
                  <Button variant="primary" onClick={() => setModalOpen(true)}>
                    + Novo script
                  </Button>
                </InlineStack>
                <Card>
                  {scriptRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={["text", "text", "text", "text"]}
                      headings={["Nome", "Posição", "Status", "Ações"]}
                      rows={scriptRows}
                    />
                  ) : (
                    <EmptyState
                      heading="Nenhum script adicionado"
                      image=""
                      action={{ content: "+ Novo script", onAction: () => setModalOpen(true) }}
                    >
                      <p>Cole tags de rastreamento, pixels ou scripts customizados. Injetados automaticamente na vitrine.</p>
                    </EmptyState>
                  )}
                </Card>
              </BlockStack>
            </Box>
          )}
        </Tabs>

        <Banner tone="info">
          <strong>Como ativar:</strong> Loja online → Temas → Personalizar → App embeds → ative <strong>Dreams SEO</strong> → Salvar.
        </Banner>
      </BlockStack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo script"
        primaryAction={{
          content: "Salvar na vitrine",
          loading: isLoading && fetcher.formData?.get("intent") === "create_script",
          onAction: () => {
            fetcher.submit({ intent: "create_script", ...form }, { method: "POST" });
            setModalOpen(false);
            setForm({ name: "", placement: "head", scriptType: "javascript", content: "" });
          },
        }}
        secondaryActions={[{ content: "Cancelar", onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Nome"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              autoComplete="off"
              placeholder="Ex: Google Tag Manager"
            />
            <Select
              label="Posição"
              options={[
                { label: "Header (<head>)", value: "head" },
                { label: "Início do body", value: "body_start" },
                { label: "Final do body", value: "body_end" },
              ]}
              value={form.placement}
              onChange={(v) => setForm({ ...form, placement: v })}
            />
            <Select
              label="Tipo"
              options={[
                { label: "JavaScript", value: "javascript" },
                { label: "HTML / Tag", value: "html" },
                { label: "Pixel", value: "pixel" },
              ]}
              value={form.scriptType}
              onChange={(v) => setForm({ ...form, scriptType: v })}
            />
            <TextField
              label="Conteúdo"
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
              multiline={8}
              autoComplete="off"
              helpText="Cole o código completo, incluindo as tags <script>...</script>"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
