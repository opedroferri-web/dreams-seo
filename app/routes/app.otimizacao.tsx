import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
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
import {
  OPTIMIZATION_LEVELS,
  calculateOptimizationScore,
  countActiveOptimizations,
  detectOptimizationLevel,
  type OptimizationSettings,
} from "~/lib/optimization-presets";
import { DELAY_JS_TARGETS } from "~/lib/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [settings, lastRun] = await Promise.all([
    getOrCreateSettings(session.shop),
    getLastOptimization(session.shop),
  ]);

  const optimization = settingsToOptimization(settings);

  return json({
    settings,
    optimization,
    score: calculateOptimizationScore(optimization),
    activeCount: countActiveOptimizations(optimization),
    currentLevel: detectOptimizationLevel(optimization),
    lastRun: lastRun
      ? {
          action: lastRun.action,
          date: lastRun.createdAt.toLocaleString("pt-BR"),
        }
      : null,
  });
};

function parseSettings(formData: FormData): Partial<OptimizationSettings> {
  return {
    lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
    delayJsEnabled: formData.get("delayJsEnabled") === "true",
    dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
    preconnectEnabled: formData.get("preconnectEnabled") === "true",
    preloadEnabled: formData.get("preloadEnabled") === "true",
    prefetchEnabled: formData.get("prefetchEnabled") === "true",
    fontOptimization: formData.get("fontOptimization") === "true",
    resourceHintsLevel: parseInt(formData.get("resourceHintsLevel") as string) || 1,
    delayJsTrigger: (formData.get("delayJsTrigger") as string) || "scroll",
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "optimize_now") {
      const settings = await runStoreOptimization(session.shop);
      const optimization = settingsToOptimization(settings);
      return json({
        success: true,
        message: "Loja otimizada! Configurações avançadas aplicadas na vitrine.",
        optimization,
        score: calculateOptimizationScore(optimization),
        activeCount: countActiveOptimizations(optimization),
        currentLevel: detectOptimizationLevel(optimization),
      });
    }

    if (intent === "apply_level") {
      const level = parseInt(formData.get("level") as string) || 2;
      const settings = await applyOptimizationLevel(session.shop, level);
      const optimization = settingsToOptimization(settings);
      return json({
        success: true,
        message: `Nível "${OPTIMIZATION_LEVELS.find((l) => l.value === level)?.label}" aplicado.`,
        optimization,
        score: calculateOptimizationScore(optimization),
        activeCount: countActiveOptimizations(optimization),
        currentLevel: level,
      });
    }

    const settings = await saveOptimizationSettings(
      session.shop,
      parseSettings(formData),
    );
    const optimization = settingsToOptimization(settings);

    return json({
      success: true,
      message: "Configurações salvas.",
      optimization,
      score: calculateOptimizationScore(optimization),
      activeCount: countActiveOptimizations(optimization),
      currentLevel: detectOptimizationLevel(optimization),
    });
  } catch (error) {
    console.error("[otimizacao]", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao otimizar.",
      },
      { status: 500 },
    );
  }
};

export default function Otimizacao() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isLoading = fetcher.state !== "idle";

  const s = fetcher.data?.optimization ?? loaderData.optimization;
  const score = fetcher.data?.score ?? loaderData.score;
  const activeCount = fetcher.data?.activeCount ?? loaderData.activeCount;
  const currentLevel = fetcher.data?.currentLevel ?? loaderData.currentLevel;
  const lastRun = loaderData.lastRun;

  const scoreTone = score >= 80 ? "success" : score >= 50 ? "highlight" : "critical";

  const save = (updates: Record<string, string | boolean>) => {
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
        resourceHintsLevel: String(s.resourceHintsLevel),
        delayJsTrigger: s.delayJsTrigger,
        ...updates,
      },
      { method: "POST" },
    );
  };

  const cacheLevels = [
    { label: "Nível 1 — Essencial (preconnect)", value: "1" },
    { label: "Nível 2 — Padrão (+ preload de imagens)", value: "2" },
    { label: "Nível 3 — Agressivo (+ prefetch)", value: "3" },
  ];

  return (
    <Page
      title="Otimização"
      subtitle="Performance da vitrine no estilo WP Rocket — adaptado para Shopify"
      primaryAction={{
        content: "Otimizar loja agora",
        loading: isLoading && fetcher.formData?.get("intent") === "optimize_now",
        onAction: () => fetcher.submit({ intent: "optimize_now" }, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {fetcher.data?.success && fetcher.data.message && (
          <Banner tone="success">{fetcher.data.message}</Banner>
        )}
        {fetcher.data?.error && <Banner tone="critical">{fetcher.data.error}</Banner>}

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">
                  Score de otimização
                </Text>
                <Text as="p" tone="subdued">
                  {activeCount} otimizações ativas na vitrine via extensão de tema
                </Text>
              </BlockStack>
              <Text as="p" variant="heading3xl" fontWeight="bold">
                {score}%
              </Text>
            </InlineStack>
            <ProgressBar progress={score} tone={scoreTone} size="small" />
            {lastRun && (
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ClockIcon} tone="subdued" />
                <Text as="p" variant="bodySm" tone="subdued">
                  Última otimização: {lastRun.date}
                </Text>
              </InlineStack>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              Nível de otimização
            </Text>
            <Text as="p" tone="subdued">
              Escolha um preset — como no WP Rocket, aplica várias configurações de uma vez.
            </Text>
            <Layout>
              {OPTIMIZATION_LEVELS.map((level) => (
                <Layout.Section key={level.value} variant="oneHalf">
                  <Box
                    padding="400"
                    borderWidth="025"
                    borderColor={currentLevel === level.value ? "border-success" : "border"}
                    borderRadius="200"
                    background={currentLevel === level.value ? "bg-surface-success" : "bg-surface"}
                  >
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text as="h4" variant="headingSm">
                          {level.label}
                        </Text>
                        <Badge tone={level.value === 2 ? "success" : "info"}>{level.badge}</Badge>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {level.description}
                      </Text>
                      <Button
                        size="slim"
                        variant={currentLevel === level.value ? "primary" : "secondary"}
                        loading={isLoading && fetcher.formData?.get("level") === String(level.value)}
                        onClick={() =>
                          fetcher.submit(
                            { intent: "apply_level", level: String(level.value) },
                            { method: "POST" },
                          )
                        }
                      >
                        {currentLevel === level.value ? "Ativo" : "Aplicar nível"}
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
                  <Text as="h3" variant="headingMd">
                    Cache de navegador
                  </Text>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Resource hints e cache de recursos estáticos — equivalente ao cache de página
                  do WP Rocket, adaptado ao CDN da Shopify.
                </Text>
                <Select
                  label="Nível de cache"
                  options={cacheLevels}
                  value={String(s.resourceHintsLevel)}
                  onChange={(v) => save({ resourceHintsLevel: v })}
                  helpText="Quanto maior o nível, mais recursos são pré-carregados no navegador."
                />
                <Divider />
                <Checkbox
                  label="DNS Prefetch"
                  helpText="Resolve domínios de terceiros antes da requisição."
                  checked={s.dnsPrefetchEnabled}
                  onChange={(v) => save({ dnsPrefetchEnabled: v })}
                />
                <Checkbox
                  label="Preconnect"
                  helpText="Conexão antecipada com CDNs (Shopify, fontes, analytics)."
                  checked={s.preconnectEnabled}
                  onChange={(v) => save({ preconnectEnabled: v })}
                />
                <Checkbox
                  label="Preload de imagens críticas"
                  helpText="Carrega hero/featured image antes do restante da página."
                  checked={s.preloadEnabled}
                  onChange={(v) => save({ preloadEnabled: v })}
                />
                <Checkbox
                  label="Prefetch de páginas"
                  helpText="Antecipa navegação para links prováveis (nível agressivo)."
                  checked={s.prefetchEnabled}
                  onChange={(v) => save({ prefetchEnabled: v })}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Imagens e mídia
                  </Text>
                  <Checkbox
                    label="Lazy Load nativo"
                    helpText="Adia imagens, iframes e vídeos fora da tela."
                    checked={s.lazyLoadEnabled}
                    onChange={(v) => save({ lazyLoadEnabled: v })}
                  />
                  <Checkbox
                    label="Otimização de fontes"
                    helpText="font-display: swap em Google Fonts e fontes do tema."
                    checked={s.fontOptimization}
                    onChange={(v) => save({ fontOptimization: v })}
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    JavaScript
                  </Text>
                  <Checkbox
                    label="Adiar JavaScript (Delay JS)"
                    helpText="Scripts de analytics e pixels só após interação."
                    checked={s.delayJsEnabled}
                    onChange={(v) => save({ delayJsEnabled: v })}
                  />
                  <Select
                    label="Disparar após"
                    options={[
                      { label: "Scroll do visitante", value: "scroll" },
                      { label: "Primeiro clique", value: "click" },
                      { label: "Qualquer interação", value: "interaction" },
                    ]}
                    value={s.delayJsTrigger}
                    onChange={(v) => save({ delayJsTrigger: v })}
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Scripts afetados:{" "}
                    {DELAY_JS_TARGETS.map((t) => t.replace(/_/g, " ")).join(", ")}
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <Banner tone="info">
          Ative o app embed <strong>Dreams SEO</strong> em Loja online → Temas → Personalizar →
          App embeds para que as otimizações entrem em vigor na vitrine.
        </Banner>
      </BlockStack>
    </Page>
  );
}
