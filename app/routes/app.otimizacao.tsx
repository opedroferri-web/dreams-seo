import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
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
  Modal,
  FormLayout,
  TextField,
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
import { analyzeStorePerformance, emptyPerformanceReport } from "~/services/performance-analysis.server";
import { syncScriptsToMetafield } from "~/services/metafield-sync.server";
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

  let performance;
  try {
    performance = await analyzeStorePerformance(shop, admin, optimization, shopUrl);
  } catch (error) {
    console.error("[otimizacao loader]", error);
    performance = emptyPerformanceReport(
      shopUrl,
      optimization,
      error instanceof Error ? error.message : undefined,
    );
  }

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

async function reloadScripts(shop: string) {
  return prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } });
}

async function scriptActionResponse(
  admin: Parameters<typeof syncScriptsToMetafield>[0],
  shop: string,
  message: string,
) {
  await syncScriptsToMetafield(admin, shop);
  const scripts = await reloadScripts(shop);
  return json({ success: true, message, scripts });
}

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
      return scriptActionResponse(admin, shop, "Script atualizado.");
    }

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
      return scriptActionResponse(admin, shop, `Script "${name}" adicionado e sincronizado com a vitrine.`);
    }

    if (intent === "delete_script") {
      const id = formData.get("id") as string;
      await prisma.managedScript.delete({ where: { id } });
      return scriptActionResponse(admin, shop, "Script removido.");
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
      return scriptActionResponse(admin, shop, `${template?.name ?? "Pixel"} adicionado.`);
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
  const revalidator = useRevalidator();
  const [tab, setTab] = useState(0);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptForm, setScriptForm] = useState({
    name: "",
    scriptType: "javascript",
    placement: "head",
    content: "",
  });
  const [localSettings, setLocalSettings] = useState<{
    optimization: OptimizationSettings;
    schemaInjection: boolean;
    score: number;
    activeCount: number;
    currentLevel: number;
  } | null>(null);

  const isLoading = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
      if (fetcher.data.optimization) {
        setLocalSettings(null);
      }
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  useEffect(() => {
    setLocalSettings(null);
  }, [loaderData.optimization, loaderData.schemaInjection, loaderData.score]);

  const base = localSettings ?? {
    optimization: fetcher.data?.optimization ?? loaderData.optimization,
    schemaInjection: fetcher.data?.schemaInjection ?? loaderData.schemaInjection,
    score: fetcher.data?.score ?? loaderData.score,
    activeCount: fetcher.data?.activeCount ?? loaderData.activeCount,
    currentLevel: fetcher.data?.currentLevel ?? loaderData.currentLevel,
  };

  const s = base.optimization;
  const schemaOn = base.schemaInjection;
  const score = base.score;
  const activeCount = base.activeCount;
  const currentLevel = base.currentLevel;
  const scripts = fetcher.data?.scripts ?? loaderData.scripts;
  const { performance, pagespeedUrl, lastRun } = loaderData;

  const pending = fetcher.formData;
  const delayTriggerValue =
    (pending?.get("delayJsTrigger") as string | null) ??
    (s.delayJsEnabled ? s.delayJsTrigger : "disabled");
  const cacheLevelValue =
    (pending?.get("resourceHintsLevel") as string | null) ?? String(s.resourceHintsLevel);

  const boolFromPending = (key: string, fallback: boolean) => {
    const v = pending?.get(key);
    return v != null ? v === "true" : fallback;
  };

  const save = useCallback(
    (updates: Record<string, string | boolean>) => {
      const merged = {
        lazyLoadEnabled: updates.lazyLoadEnabled ?? s.lazyLoadEnabled,
        delayJsEnabled: updates.delayJsEnabled ?? s.delayJsEnabled,
        dnsPrefetchEnabled: updates.dnsPrefetchEnabled ?? s.dnsPrefetchEnabled,
        preconnectEnabled: updates.preconnectEnabled ?? s.preconnectEnabled,
        preloadEnabled: updates.preloadEnabled ?? s.preloadEnabled,
        prefetchEnabled: updates.prefetchEnabled ?? s.prefetchEnabled,
        fontOptimization: updates.fontOptimization ?? s.fontOptimization,
        webpEnabled: updates.webpEnabled ?? s.webpEnabled ?? true,
        resourceHintsLevel: updates.resourceHintsLevel != null
          ? parseInt(String(updates.resourceHintsLevel))
          : s.resourceHintsLevel,
        delayJsTrigger: updates.delayJsTrigger ?? (s.delayJsEnabled ? s.delayJsTrigger : "disabled"),
        schemaInjection: updates.schemaInjection ?? schemaOn,
      };

      setLocalSettings({
        optimization: {
          ...s,
          lazyLoadEnabled: Boolean(merged.lazyLoadEnabled),
          delayJsEnabled: Boolean(merged.delayJsEnabled),
          dnsPrefetchEnabled: Boolean(merged.dnsPrefetchEnabled),
          preconnectEnabled: Boolean(merged.preconnectEnabled),
          preloadEnabled: Boolean(merged.preloadEnabled),
          prefetchEnabled: Boolean(merged.prefetchEnabled),
          fontOptimization: Boolean(merged.fontOptimization),
          webpEnabled: Boolean(merged.webpEnabled),
          resourceHintsLevel: merged.resourceHintsLevel as OptimizationSettings["resourceHintsLevel"],
          delayJsTrigger: merged.delayJsTrigger as OptimizationSettings["delayJsTrigger"],
        },
        schemaInjection: Boolean(merged.schemaInjection),
        score: base.score,
        activeCount: base.activeCount,
        currentLevel: base.currentLevel,
      });

      fetcher.submit(
        {
          intent: "save",
          lazyLoadEnabled: String(merged.lazyLoadEnabled),
          delayJsEnabled: String(merged.delayJsEnabled),
          dnsPrefetchEnabled: String(merged.dnsPrefetchEnabled),
          preconnectEnabled: String(merged.preconnectEnabled),
          preloadEnabled: String(merged.preloadEnabled),
          prefetchEnabled: String(merged.prefetchEnabled),
          fontOptimization: String(merged.fontOptimization),
          webpEnabled: String(merged.webpEnabled),
          resourceHintsLevel: String(merged.resourceHintsLevel),
          delayJsTrigger: String(merged.delayJsTrigger),
          schemaInjection: String(merged.schemaInjection),
        },
        { method: "POST" },
      );
    },
    [fetcher, s, schemaOn, base.score, base.activeCount, base.currentLevel],
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

  const placementLabels: Record<string, string> = {
    head: "Header (<head>)",
    body_start: "Início do body",
    body_end: "Final do body",
  };

  const scriptRows = scripts.map((sc) => [
    sc.name,
    placementLabels[sc.placement] ?? sc.placement,
    <Badge key={sc.id} tone={sc.enabled ? "success" : "critical"}>
      {sc.enabled ? "Ativo" : "Inativo"}
    </Badge>,
    <InlineStack key={`a-${sc.id}`} gap="200">
      <Button
        size="slim"
        onClick={() => fetcher.submit({ intent: "toggle_script", id: sc.id }, { method: "POST" })}
      >
        {sc.enabled ? "Desativar" : "Ativar"}
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => fetcher.submit({ intent: "delete_script", id: sc.id }, { method: "POST" })}
      >
        Excluir
      </Button>
    </InlineStack>,
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
        {performance.analysisError && (
          <Banner tone="warning">
            Análise parcial: {performance.analysisError}. As configurações continuam funcionando.
          </Banner>
        )}

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
                          value={cacheLevelValue}
                          onChange={(v) => save({ resourceHintsLevel: v === "0" ? "0" : v, dnsPrefetchEnabled: v !== "0", preconnectEnabled: v !== "0" })}
                        />
                        <Checkbox label="DNS Prefetch" checked={boolFromPending("dnsPrefetchEnabled", s.dnsPrefetchEnabled)} onChange={(v) => save({ dnsPrefetchEnabled: v })} />
                        <Checkbox label="Preconnect" checked={boolFromPending("preconnectEnabled", s.preconnectEnabled)} onChange={(v) => save({ preconnectEnabled: v })} />
                        <Checkbox label="Preload imagens críticas" checked={boolFromPending("preloadEnabled", s.preloadEnabled)} onChange={(v) => save({ preloadEnabled: v })} />
                        <Checkbox label="Prefetch de páginas" checked={boolFromPending("prefetchEnabled", s.prefetchEnabled)} onChange={(v) => save({ prefetchEnabled: v })} />
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                  <Layout.Section variant="oneHalf">
                    <BlockStack gap="400">
                      <Card>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">Imagens e fontes</Text>
                          <Checkbox label="Lazy load" checked={boolFromPending("lazyLoadEnabled", s.lazyLoadEnabled)} onChange={(v) => save({ lazyLoadEnabled: v })} />
                          <Checkbox label="WebP automático (CDN Shopify)" checked={boolFromPending("webpEnabled", s.webpEnabled ?? true)} onChange={(v) => save({ webpEnabled: v })} />
                          <Checkbox label="Otimização de fontes" checked={boolFromPending("fontOptimization", s.fontOptimization)} onChange={(v) => save({ fontOptimization: v })} />
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
                          <Checkbox label="Schema JSON-LD" checked={boolFromPending("schemaInjection", schemaOn)} onChange={(v) => save({ schemaInjection: v })} />
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
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">Scripts e pixels</Text>
                  <Button variant="primary" onClick={() => setScriptModalOpen(true)}>
                    + Novo script
                  </Button>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Cole HTML, JavaScript ou tags de rastreamento. Scripts no header entram no &lt;head&gt; da loja.
                </Text>
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
                      headings={["Nome", "Posição", "Status", "Ações"]}
                      rows={scriptRows}
                    />
                  ) : (
                    <Text as="p" tone="subdued">Nenhum script ainda. Clique em &quot;Novo script&quot; ou adicione um pixel acima.</Text>
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

      <Modal
        open={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
        title="Novo script"
        primaryAction={{
          content: "Salvar na vitrine",
          loading: isLoading && fetcher.formData?.get("intent") === "create_script",
          onAction: () => {
            fetcher.submit(
              { intent: "create_script", ...scriptForm },
              { method: "POST" },
            );
            setScriptModalOpen(false);
            setScriptForm({ name: "", scriptType: "javascript", placement: "head", content: "" });
          },
        }}
        secondaryActions={[{ content: "Cancelar", onAction: () => setScriptModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Nome"
              value={scriptForm.name}
              onChange={(v) => setScriptForm({ ...scriptForm, name: v })}
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
              value={scriptForm.placement}
              onChange={(v) => setScriptForm({ ...scriptForm, placement: v })}
            />
            <Select
              label="Tipo"
              options={[
                { label: "JavaScript", value: "javascript" },
                { label: "HTML", value: "html" },
                { label: "Pixel", value: "pixel" },
              ]}
              value={scriptForm.scriptType}
              onChange={(v) => setScriptForm({ ...scriptForm, scriptType: v })}
            />
            <TextField
              label="Conteúdo do script"
              value={scriptForm.content}
              onChange={(v) => setScriptForm({ ...scriptForm, content: v })}
              multiline={8}
              autoComplete="off"
              helpText='Ex: <script>...</script> ou código JS completo'
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
