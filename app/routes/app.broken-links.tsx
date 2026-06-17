import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Card,
  DataTable,
  Badge,
  Banner,
  Button,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { scanBrokenLinks } from "~/services/audit.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const links = await prisma.brokenLink.findMany({
    where: { shop: session.shop, fixed: false },
    orderBy: { lastChecked: "desc" },
    take: 100,
  });
  return { links };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "scan") {
    const found = await scanBrokenLinks(session.shop, admin);
    return { scanned: found.length };
  }

  if (intent === "create_redirect") {
    const linkId = formData.get("linkId") as string;
    const link = await prisma.brokenLink.findUnique({ where: { id: linkId } });
    if (link) {
      await prisma.redirect.create({
        data: {
          shop: session.shop,
          fromPath: link.targetUrl,
          toPath: "/",
          type: 301,
        },
      });
      await prisma.brokenLink.update({
        where: { id: linkId },
        data: { fixed: true },
      });
    }
  }

  return { success: true };
};

export default function BrokenLinks() {
  const { links } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const rows = links.map((l) => [
    l.sourceType,
    l.sourceUrl,
    l.targetUrl,
    l.statusCode ? String(l.statusCode) : "—",
    <Badge key={l.id} tone={l.statusCode === 404 ? "critical" : "warning"}>
      {l.linkType}
    </Badge>,
    <Button
      key={`fix-${l.id}`}
      size="slim"
      onClick={() => fetcher.submit({ intent: "create_redirect", linkId: l.id }, { method: "POST" })}
    >
      Criar Redirect
    </Button>,
  ]);

  return (
    <Page
      title="Broken Links"
      primaryAction={{
        content: "Escanear Links",
        loading: fetcher.state !== "idle",
        onAction: () => fetcher.submit({ intent: "scan" }, { method: "POST" }),
      }}
    >
      <BlockStack gap="500">
        {fetcher.data?.scanned !== undefined && (
          <Banner tone="info">Varredura concluída. {fetcher.data.scanned} novos links detectados.</Banner>
        )}
        <Card>
          {rows.length > 0 ? (
            <DataTable
              columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
              headings={["Origem", "Página fonte", "URL alvo", "Status", "Tipo", "Ação"]}
              rows={rows}
            />
          ) : (
            <Banner tone="success">Nenhum link quebrado detectado.</Banner>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}
