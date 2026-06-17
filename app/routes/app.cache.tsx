import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
  List,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getOrCreateSettings } from "~/services/audit.server";
import prisma from "~/db.server";
import { DELAY_JS_TARGETS } from "~/lib/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
      delayJsEnabled: formData.get("delayJsEnabled") === "true",
      dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
      preconnectEnabled: formData.get("preconnectEnabled") === "true",
      preloadEnabled: formData.get("preloadEnabled") === "true",
      prefetchEnabled: formData.get("prefetchEnabled") === "true",
      fontOptimization: formData.get("fontOptimization") === "true",
      resourceHintsLevel: parseInt(formData.get("resourceHintsLevel") as string) || 1,
      delayJsTrigger: formData.get("delayJsTrigger") as string || "scroll",
    },
  });

  return { success: true, settings };
};

export default function Cache() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const s = fetcher.data?.settings || settings;

  const hintLevels = [
    { label: "Nível 1 — Apenas preconnect", value: "1" },
    { label: "Nível 2 — Preconnect + Preload", value: "2" },
    { label: "Nível 3 — Preconnect + Preload + Prefetch", value: "3" },
  ];

  const save = (updates: Record<string, string | boolean>) => {
    const data = {
      lazyLoadEnabled: s.lazyLoadEnabled,
      delayJsEnabled: s.delayJsEnabled,
      dnsPrefetchEnabled: s.dnsPrefetchEnabled,
      preconnectEnabled: s.preconnectEnabled,
      preloadEnabled: s.preloadEnabled,
      prefetchEnabled: s.prefetchEnabled,
      fontOptimization: s.fontOptimization,
      resourceHintsLevel: String(s.resourceHintsLevel),
      delayJsTrigger: s.delayJsTrigger,
      ...updates,
    };
    fetcher.submit(data, { method: "POST" });
  };

  return (
    <Page title="Cache Engine">
      <BlockStack gap="500">
        <Banner tone="info">
          A Shopify possui CDN próprio. Este módulo otimiza browser cache, resource hints,
          fontes, lazy load e delay JS via Theme App Extension — sem cache HTML tradicional.
        </Banner>

        {fetcher.data?.success && <Banner tone="success">Configurações salvas!</Banner>}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Resource Hints</Text>
                <Select
                  label="Nível de Resource Hints"
                  options={hintLevels}
                  value={String(s.resourceHintsLevel)}
                  onChange={(v) => save({ resourceHintsLevel: v })}
                />
                <Checkbox
                  label="DNS Prefetch"
                  checked={s.dnsPrefetchEnabled}
                  onChange={(v) => save({ dnsPrefetchEnabled: v })}
                />
                <Checkbox
                  label="Preconnect"
                  checked={s.preconnectEnabled}
                  onChange={(v) => save({ preconnectEnabled: v })}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Lazy Load Manager</Text>
                <Checkbox
                  label="Ativar Lazy Load (imagens, iframes, vídeos)"
                  checked={s.lazyLoadEnabled}
                  onChange={(v) => save({ lazyLoadEnabled: v })}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Delay JavaScript</Text>
                <Checkbox
                  label="Ativar Delay JS"
                  checked={s.delayJsEnabled}
                  onChange={(v) => save({ delayJsEnabled: v })}
                />
                <Select
                  label="Executar após"
                  options={[
                    { label: "Scroll", value: "scroll" },
                    { label: "Clique", value: "click" },
                    { label: "Interação", value: "interaction" },
                  ]}
                  value={s.delayJsTrigger}
                  onChange={(v) => save({ delayJsTrigger: v })}
                />
                <List type="bullet">
                  {DELAY_JS_TARGETS.map((t) => (
                    <List.Item key={t}>{t.replace(/_/g, " ")}</List.Item>
                  ))}
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Font Optimization</Text>
                <Checkbox
                  label="Ativar otimização de fontes (font-display: swap + preload)"
                  checked={s.fontOptimization}
                  onChange={(v) => save({ fontOptimization: v })}
                />
                <Text as="p" tone="subdued">
                  Detecta Google Fonts pesadas e aplica font-display: swap automaticamente.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Critical Resources</Text>
                <Text as="p" tone="subdued">
                  Recomendações geradas com base no tema ativo:
                </Text>
                <List type="bullet">
                  <List.Item>Preload da imagem hero above-the-fold</List.Item>
                  <List.Item>Preconnect para CDN de fontes e analytics</List.Item>
                  <List.Item>Defer em scripts não-críticos via Delay JS</List.Item>
                  <List.Item>Lazy load para imagens abaixo da dobra</List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
