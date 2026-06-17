import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  Checkbox,
  Banner,
  Text,
  Layout,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getOrCreateSettings } from "~/services/audit.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = await prisma.shopSettings.upsert({
    where: { shop: session.shop },
    update: {
      lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
      delayJsEnabled: formData.get("delayJsEnabled") === "true",
      dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
      preconnectEnabled: formData.get("preconnectEnabled") === "true",
      fontOptimization: formData.get("fontOptimization") === "true",
      schemaInjection: formData.get("schemaInjection") === "true",
      scriptManagerEnabled: formData.get("scriptManagerEnabled") === "true",
      redirectManagerEnabled: formData.get("redirectManagerEnabled") === "true",
    },
    create: {
      shop: session.shop,
      lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
      delayJsEnabled: formData.get("delayJsEnabled") === "true",
      dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
      preconnectEnabled: formData.get("preconnectEnabled") === "true",
      fontOptimization: formData.get("fontOptimization") === "true",
      schemaInjection: formData.get("schemaInjection") === "true",
      scriptManagerEnabled: formData.get("scriptManagerEnabled") === "true",
      redirectManagerEnabled: formData.get("redirectManagerEnabled") === "true",
    },
  });

  return json({ success: true, settings });
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const s = fetcher.data?.settings || settings;

  const save = (key: string, value: boolean) => {
    fetcher.submit(
      {
        lazyLoadEnabled: String(s.lazyLoadEnabled),
        delayJsEnabled: String(s.delayJsEnabled),
        dnsPrefetchEnabled: String(s.dnsPrefetchEnabled),
        preconnectEnabled: String(s.preconnectEnabled),
        fontOptimization: String(s.fontOptimization),
        schemaInjection: String(s.schemaInjection),
        scriptManagerEnabled: String(s.scriptManagerEnabled),
        redirectManagerEnabled: String(s.redirectManagerEnabled),
        [key]: String(value),
      },
      { method: "POST" },
    );
  };

  return (
    <Page title="Configurações">
      <BlockStack gap="500">
        {fetcher.data?.success && <Banner tone="success">Configurações salvas!</Banner>}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Performance</Text>
                <Checkbox label="Lazy load de imagens" checked={s.lazyLoadEnabled} onChange={(v) => save("lazyLoadEnabled", v)} />
                <Checkbox label="Adiar JavaScript" checked={s.delayJsEnabled} onChange={(v) => save("delayJsEnabled", v)} />
                <Checkbox label="DNS prefetch" checked={s.dnsPrefetchEnabled} onChange={(v) => save("dnsPrefetchEnabled", v)} />
                <Checkbox label="Preconnect" checked={s.preconnectEnabled} onChange={(v) => save("preconnectEnabled", v)} />
                <Checkbox label="Otimização de fontes" checked={s.fontOptimization} onChange={(v) => save("fontOptimization", v)} />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Módulos</Text>
                <Checkbox label="Injeção de schema" checked={s.schemaInjection} onChange={(v) => save("schemaInjection", v)} />
                <Checkbox label="Gerenciador de scripts" checked={s.scriptManagerEnabled} onChange={(v) => save("scriptManagerEnabled", v)} />
                <Checkbox label="Gerenciador de redirects" checked={s.redirectManagerEnabled} onChange={(v) => save("redirectManagerEnabled", v)} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">Extensão de tema</Text>
            <Text as="p" tone="subdued">
              Ative os app embeds em Loja online → Temas → Personalizar → App embeds → Dreams SEO.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
