import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
      fontOptimization: formData.get("fontOptimization") === "true",
      schemaInjection: formData.get("schemaInjection") === "true",
      scriptManagerEnabled: formData.get("scriptManagerEnabled") === "true",
      redirectManagerEnabled: formData.get("redirectManagerEnabled") === "true",
    },
  });

  return { success: true, settings };
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
    <Page title="Settings">
      <BlockStack gap="500">
        {fetcher.data?.success && <Banner tone="success">Configurações salvas!</Banner>}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Performance</Text>
                <Checkbox label="Lazy Load" checked={s.lazyLoadEnabled} onChange={(v) => save("lazyLoadEnabled", v)} />
                <Checkbox label="Delay JS" checked={s.delayJsEnabled} onChange={(v) => save("delayJsEnabled", v)} />
                <Checkbox label="DNS Prefetch" checked={s.dnsPrefetchEnabled} onChange={(v) => save("dnsPrefetchEnabled", v)} />
                <Checkbox label="Preconnect" checked={s.preconnectEnabled} onChange={(v) => save("preconnectEnabled", v)} />
                <Checkbox label="Font Optimization" checked={s.fontOptimization} onChange={(v) => save("fontOptimization", v)} />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Módulos</Text>
                <Checkbox label="Schema Injection" checked={s.schemaInjection} onChange={(v) => save("schemaInjection", v)} />
                <Checkbox label="Script Manager" checked={s.scriptManagerEnabled} onChange={(v) => save("scriptManagerEnabled", v)} />
                <Checkbox label="Redirect Manager" checked={s.redirectManagerEnabled} onChange={(v) => save("redirectManagerEnabled", v)} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">Theme App Extension</Text>
            <Text as="p" tone="subdued">
              Ative os App Embeds em Online Store → Themes → Customize → App embeds:
              Dreams SEO Pro Scripts, Schema, Performance e Resource Hints.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
