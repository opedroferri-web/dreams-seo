import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  BlockStack,
  Card,
  Text,
  Select,
  Checkbox,
  Banner,
  Layout,
  Button,
  InlineStack,
  Badge,
  ProgressBar,
  Divider,
  Box,
  Icon,
  Tabs,
  DataTable,
  Link,
  Grid,
  List,
} from "@shopify/polaris";
import { CheckCircleIcon, ClockIcon } from "@shopify/polaris-icons";
import { authenticate } from "~/shopify.server";
import { getOrCreateSettings } from "~/services/audit.server";
import {
  applyOptimizationLevel,
  getLastOptimization,
  runStoreOptimization,
  saveOptimizationSettings,
  settingsToOptimization,
} from "~/services/optimization-page.server";
import { analyzeStorePerformance } from "~/services/performance-analysis.server";
import {
  OPTIMIZATION_LEVELS,
  calculateOptimizationScore,
  countActiveOptimizations,
  detectOptimizationLevel,
  type OptimizationSettings,
} from "~/lib/optimization-presets";
import { DELAY_JS_TARGETS, PIXEL_TEMPLATES, type PixelTemplateKey } from "~/lib/constants";
import { GET_SHOP } from "~/graphql/queries.server";
import { adminGraphql } from "~/lib/graphql.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, lastRun, scripts, shopData] = await Promise.all([
    getOrCreateSettings(shop),
    getLastOptimization(shop),
    prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } }),
    adminGraphql<{ shop?: { primaryDomain?: { url: string } } }>(admin, GET_SHOP),
  ]);

  const optimization = settingsToOptimization(settings);
  const shopUrl = shopData.data?.shop?.primaryDomain?.url ?? `https://${shop}`;

  const performance = await analyzeStorePerformance(shop, admin, optimization, shopUrl);

  return json({
    settings,
    optimization,
    schemaInjection: settings.schemaInjection,
    score: calculateOptimizationScore(optimization),
    activeCount: countActiveOptimizations(optimization),
    currentLevel: detectOptimizationLevel(optimization),
    performance,
    scripts,
    pagespeedUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(shopUrl)}`,
    lastRun: lastRun
      ? { action: lastRun.action, date: lastRun.createdAt.toLocaleString("pt-BR") }
      : null,
  });
};

function parseSettings(formData: FormData): Partial<OptimizationSettings & { schemaInjection?: boolean }> {
  const trigger = (formData.get("delayJsTrigger") as string) || "scroll";
  return {
    lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
    delayJsEnabled: trigger === "disabled" ? false : formData.get("delayJsEnabled") === "true",
    dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
    preconnectEnabled: formData.get("preconnectEnabled") === "true",
    preloadEnabled: formData.get("preloadEnabled") === "true",
    prefetchEnabled: formData.get("prefetchEnabled") === "true",
    fontOptimization: formData.get("fontOptimization") === "true",
    webpEnabled: formData.get("webpEnabled") === "true",
    resourceHintsLevel: parseInt(formData.get("resourceHintsLevel") as string) || 1,
    delayJsTrigger: trigger === "disabled" ? "disabled" : trigger,
    schemaInjection: formData.get("schemaInjection") === "true",
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "optimize_now") {
      const settings = await runStoreOptimization(shop, admin);
      const optimization = settingsToOptimization(settings);
      return json({
        success: true,
        message: "Loja otimizada e sincronizada com a vitrine!",
        optimization,
        schemaInjection: settings.schemaInjection,
        score: calculateOptimizationScore(optimization),
        activeCount: countActiveOptimizations(optimization),
        currentLevel: detectOptimizationLevel(optimization),
      });
    }

    if (intent === "apply_level") {
      const level = parseInt(formData.get("level") as string) || 2;
      const settings = await applyOptimizationLevel(shop, level, admin);
      const optimization = settingsToOptimization(settings);
      return json({
        success: true,
        message: `Nível "${OPTIMIZATION_LEVELS.find((l) => l.value === level)?.label}" aplicado e sincronizado.`,
        optimization,
        schemaInjection: settings.schemaInjection,
        score: calculateOptimizationScore(optimization),
        activeCount: countActiveOptimizations(optimization),
        currentLevel: level,
      });
    }

    if (intent === "scan_speed") {
      await prisma.optimizationLog.create({
        data: { shop, action: "scan_speed", details: "Análise de velocidade" },
      });
      return json({ success: true, message: "Análise de velocidade atualizada." });
    }

    if (intent === "optimize_images") {
      await saveOptimizationSettings(shop, { webpEnabled: true, lazyLoadEnabled: true }, admin);
      await prisma.optimizationLog.create({
        data: { shop, action: "optimize_images", details: "WebP + lazy load ativados" },
      });
      const settings = await getOrCreateSettings(shop);
      const optimization = settingsToOptimization(settings);
      return json({
        success: true,
        message: "WebP e lazy load ativados na vitrine.",
        optimization,
        schemaInjection: settings.schemaInjection,
        score: calculateOptimizationScore(optimization),
      });
    }

    if (intent === "toggle_script") {
      const id = formData.get("id") as string;
      const script = await prisma.managedScript.findUnique({ where: { id } });
      if (script) {
        await prisma.managedScript.update({
          where: { id },
          data: { enabled: !script.enabled },
        });
      }
      return json({ success: true, message: "Script atualizado." });
    }

    if (intent === "add_pixel") {
      const templateKey = formData.get("template") as PixelTemplateKey;
      const template = PIXEL_TEMPLATES[templateKey];
      if (template) {
        await prisma.managedScript.create({
          data: {
            shop,
            name: template.name,
            scriptType: template.type,
            placement: template.placement,
            content: template.content,
            displayRule: "all",
          },
        });
      }
      return json({ success: true, message: `${template?.name ?? "Pixel"} adicionado.` });
    }

    const settings = await saveOptimizationSettings(shop, parseSettings(formData), admin);
    const optimization = settingsToOptimization(settings);

    return json({
      success: true,
      message: "Configurações salvas e sincronizadas com a vitrine.",
      optimization,
      schemaInjection: settings.schemaInjection,
      score: calculateOptimizationScore(optimization),
      activeCount: countActiveOptimizations(optimization),
      currentLevel: detectOptimizationLevel(optimization),
    });
  } catch (error) {
    console.error("[otimizacao]", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Erro ao salvar." },
      { status: 500 },
    );
  }
};

export default function Otimizacao() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [tab, setTab] = useState(0);
  const isLoading = fetcher.state !== "idle";

  const s = fetcher.data?.optimization ?? loaderData.optimization;
  const schemaOn = fetcher.data?.schemaInjection ?? loaderData.schemaInjection;
  const score = fetcher.data?.score ?? loaderData.score;
  const activeCount = fetcher.data?.activeCount ?? loaderData.activeCount;
  const currentLevel = fetcher.data?.currentLevel ?? loaderData.currentLevel;
  const { performance, scripts, pagespeedUrl, lastRun } = loaderData;

  const delayTriggerValue = s.delayJsEnabled ? s.delayJsTrigger : "disabled";

  const save = useCallback(
    (updates: Record<string, string | boolean>) => {
      fetcher.submit(
        {
          intent: "save",
          lazyLoadEnabled: String(s.lazyLoadEnabled),
          delayJsEnabled: String(s.delayJsEnabled),
          dnsPrefetchEnabled: String(s.dnsPrefetchEnabled),
          preconnectEnabled: String(s.preconnectEnabled),
          preloadEnabled: String(s.preloadEnabled),
          prefetchEnabled: String(s.prefetchEnabled),
          fontOptimization: String(s.fontOptimization),
          webpEnabled: String(s.webpEnabled ?? true),
          resourceHintsLevel: String(s.resourceHintsLevel),
          delayJsTrigger: delayTriggerValue,
          schemaInjection: String(schemaOn),
          ...updates,
        },
        { method: "POST" },
      );
    },
    [fetcher, s, schemaOn, delayTriggerValue],
  );

  const scoreTone = score >= 80 ? "success" : score >= 50 ? "highlight" : "critical";
  const mobileTone =
    performance.mobileScore >= 90 ? "success" : performance.mobileScore >= 50 ? "highlight" : "critical";

  const cacheLevels = [
    { label: "Desativado", value: "0" },
    { label: "Nível 1 — Essencial (preconnect)", value: "1" },
    { label: "Nível 2 — Padrão (+ preload)", value: "2" },
    { label: "Nível 3 — Agressivo (+ prefetch)", value: "3" },
  ];

  const heavyRows = performance.heavyImages.map((img) => [
    img.url.split("/").pop()?.slice(0, 30) ?? "—",
    `${img.sizeKb} KB`,
    img.format.toUpperCase(),
    img.needsWebp ? <Badge tone="warning">Converter WebP</Badge> : <Badge tone="success">OK</Badge>,
  ]);

  const scriptRows = scripts.map((sc) => [
    sc.name,
    sc.placement,
    <Badge key={sc.id} tone={sc.enabled ? "success" : "critical"}>
      {sc.enabled ? "Ativo" : "Inativo"}
    </Badge>,
    <Button
      key={`t-${sc.id}`}
      size="slim"
      onClick={() => fetcher.submit({ intent: "toggle_script", id: sc.id }, { method: "POST" })}
    >
      {sc.enabled ? "Desativar" : "Ativar"}
    </Button>,
  ]);

  const tabs = [
    { id: "velocidade", content: "Velocidade", panelID: "velocidade" },
    { id: "config", content: "Configurações", panelID: "config" },
    { id: "imagens", content: "Imagens", panelID: "imagens" },
    { id: "scripts", content: "Scripts", panelID: "scripts" },
  ];

  return (
    <Page
      title="Otimização"
      subtitle="Performance premium — velocidade, cache, imagens e scripts"
      primaryAction={{
        content: "Otimizar loja agora",
        loading: isLoading && fetcher.formData?.get("intent") === "optimize_now",
        onAction: () => fetcher.submit({ intent: "optimize_now" }, { method: "POST" }),
      }}
      secondaryActions={[
        {
          content: "Analisar velocidade",
          loading: isLoading && fetcher.formData?.get("intent") === "scan_speed",
          onAction: () => fetcher.submit({ intent: "scan_speed" }, { method: "POST" }),
        },
      ]}
    >
      <BlockStack gap="500">
        {fetcher.data?.success && fetcher.data.message && (
          <Banner tone="success">{fetcher.data.message}</Banner>
        )}
        {fetcher.data?.error && <Banner tone="critical">{fetcher.data.error}</Banner>}

        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h2" variant="headingLg">Score de otimização</Text>
              <Text as="p" tone="subdued">{activeCount} recursos ativos · sincronizado com vitrine</Text>
            </BlockStack>
            <Text as="p" variant="heading3xl" fontWeight="bold">{score}%</Text>
          </InlineStack>
          <Box paddingBlockStart="300">
            <ProgressBar progress={score} tone={scoreTone} size="small" />
          </Box>
          {lastRun && (
            <Box paddingBlockStart="200">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ClockIcon} tone="subdued" />
                <Text as="p" variant="bodySm" tone="subdued">Última ação: {lastRun.date}</Text>
              </InlineStack>
            </Box>
          )}
        </Card>

        <Tabs tabs={tabs} selected={tab} onSelect={setTab}>
          {tab === 0 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Layout>
                  <Layout.Section variant="oneHalf">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Mobile</Text>
                        <Text as="p" variant="heading2xl" fontWeight="bold">{performance.mobileScore}</Text>
                        <ProgressBar progress={performance.mobileScore} tone={mobileTone} size="small" />
                        <Text as="p" tone="subdued">Estimativa baseada em peso, imagens e configs ativas</Text>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                  <Layout.Section variant="oneHalf">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Desktop</Text>
                        <Text as="p" variant="heading2xl" fontWeight="bold">{performance.desktopScore}</Text>
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
              </BlockStack>
            </Box>
          )}

          {tab === 1 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">Níveis rápidos (WP Rocket)</Text>
                    <Layout>
                      {OPTIMIZATION_LEVELS.map((level) => (
                        <Layout.Section key={level.value} variant="oneHalf">
                          <Box padding="300" borderWidth="025" borderRadius="200"
                            borderColor={currentLevel === level.value ? "border-success" : "border"}>
                            <BlockStack gap="200">
                              <InlineStack align="space-between">
                                <Text as="span" fontWeight="semibold">{level.label}</Text>
                                <Badge>{level.badge}</Badge>
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">{level.description}</Text>
                              <Button size="slim" variant={currentLevel === level.value ? "primary" : "secondary"}
                                onClick={() => fetcher.submit({ intent: "apply_level", level: String(level.value) }, { method: "POST" })}>
                                {currentLevel === level.value ? "Ativo" : "Aplicar"}
                              </Button>
                            </BlockStack>
                          </Box>
                        </Layout.Section>
                      ))}
                    </Layout>
                  </BlockStack>
                </Card>

                <Layout>
                  <Layout.Section>
                    <Card>
                      <BlockStack gap="400">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={CheckCircleIcon} tone="success" />
                          <Text as="h3" variant="headingMd">Cache e preload</Text>
                        </InlineStack>
                        <Select
                          label="Nível de cache"
                          options={cacheLevels}
                          value={String(s.resourceHintsLevel)}
                          onChange={(v) => save({ resourceHintsLevel: v === "0" ? "0" : v, dnsPrefetchEnabled: v !== "0", preconnectEnabled: v !== "0" })}
                        />
                        <Checkbox label="DNS Prefetch" checked={s.dnsPrefetchEnabled} onChange={(v) => save({ dnsPrefetchEnabled: v })} />
                        <Checkbox label="Preconnect" checked={s.preconnectEnabled} onChange={(v) => save({ preconnectEnabled: v })} />
                        <Checkbox label="Preload imagens críticas" checked={s.preloadEnabled} onChange={(v) => save({ preloadEnabled: v })} />
                        <Checkbox label="Prefetch de páginas" checked={s.prefetchEnabled} onChange={(v) => save({ prefetchEnabled: v })} />
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                  <Layout.Section variant="oneHalf">
                    <BlockStack gap="400">
                      <Card>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">Imagens e fontes</Text>
                          <Checkbox label="Lazy load" checked={s.lazyLoadEnabled} onChange={(v) => save({ lazyLoadEnabled: v })} />
                          <Checkbox label="WebP automático (CDN Shopify)" checked={s.webpEnabled ?? true} onChange={(v) => save({ webpEnabled: v })} />
                          <Checkbox label="Otimização de fontes" checked={s.fontOptimization} onChange={(v) => save({ fontOptimization: v })} />
                        </BlockStack>
                      </Card>
                      <Card>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">JavaScript</Text>
                          <Select
                            label="Delay JS — disparar após"
                            options={[
                              { label: "Desativado", value: "disabled" },
                              { label: "Scroll", value: "scroll" },
                              { label: "Primeiro clique", value: "click" },
                              { label: "Qualquer interação", value: "interaction" },
                            ]}
                            value={delayTriggerValue}
                            onChange={(v) => save({ delayJsTrigger: v, delayJsEnabled: v !== "disabled" })}
                          />
                          <Text as="p" variant="bodySm" tone="subdued">
                            Scripts: {DELAY_JS_TARGETS.map((t) => t.replace(/_/g, " ")).join(", ")}
                          </Text>
                        </BlockStack>
                      </Card>
                      <Card>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">SEO na vitrine</Text>
                          <Checkbox label="Schema JSON-LD" checked={schemaOn} onChange={(v) => save({ schemaInjection: v })} />
                        </BlockStack>
                      </Card>
                    </BlockStack>
                  </Layout.Section>
                </Layout>
              </BlockStack>
            </Box>
          )}

          {tab === 2 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">
                    {performance.metrics.heavyImages} imagens pesadas · {performance.metrics.imageCount} total
                  </Text>
                  <Button
                    loading={isLoading && fetcher.formData?.get("intent") === "optimize_images"}
                    onClick={() => fetcher.submit({ intent: "optimize_images" }, { method: "POST" })}
                  >
                    Ativar WebP + Lazy Load
                  </Button>
                </InlineStack>
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

          {tab === 3 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Pixels e scripts</Text>
                <InlineStack gap="200" wrap>
                  {(Object.keys(PIXEL_TEMPLATES) as PixelTemplateKey[]).map((key) => (
                    <Button key={key} size="slim"
                      onClick={() => fetcher.submit({ intent: "add_pixel", template: key }, { method: "POST" })}>
                      + {PIXEL_TEMPLATES[key].name}
                    </Button>
                  ))}
                </InlineStack>
                <Card>
                  {scriptRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={["text", "text", "text", "text"]}
                      headings={["Nome", "Posição", "Status", "Ação"]}
                      rows={scriptRows}
                    />
                  ) : (
                    <Text as="p" tone="subdued">Nenhum script gerenciado. Adicione um pixel acima.</Text>
                  )}
                </Card>
              </BlockStack>
            </Box>
          )}
        </Tabs>

        <Banner tone="info">
          Ative o app embed <strong>Dreams SEO</strong> em Loja online → Temas → Personalizar → App embeds.
          As configs do app sincronizam automaticamente com a vitrine.
        </Banner>
      </BlockStack>
    </Page>
  );
}
