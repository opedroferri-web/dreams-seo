import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  BlockStack,
  Card,
  DataTable,
  Badge,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { CREATE_URL_REDIRECT, DELETE_URL_REDIRECT } from "~/graphql/mutations.server";
import { GET_URL_REDIRECTS } from "~/graphql/queries.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [shopifyRedirects, localRedirects] = await Promise.all([
    admin.graphql(GET_URL_REDIRECTS, { variables: { first: 50 } }),
    prisma.redirect.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" } }),
  ]);

  const json = await shopifyRedirects.json();
  const shopify = json.data?.urlRedirects?.edges?.map(
    (e: { node: { id: string; path: string; target: string } }) => e.node,
  ) || [];

  return { shopifyRedirects: shopify, localRedirects };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const fromPath = formData.get("fromPath") as string;
    const toPath = formData.get("toPath") as string;
    const type = parseInt(formData.get("type") as string) || 301;

    await admin.graphql(CREATE_URL_REDIRECT, {
      variables: { urlRedirect: { path: fromPath, target: toPath } },
    });

    await prisma.redirect.create({
      data: { shop: session.shop, fromPath, toPath, type },
    });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await admin.graphql(DELETE_URL_REDIRECT, { variables: { id } }).catch(() => {});
    await prisma.redirect.delete({ where: { id: formData.get("localId") as string } }).catch(() => {});
  }

  if (intent === "import_csv") {
    const csv = formData.get("csv") as string;
    const lines = csv.split("\n").filter(Boolean);
    let imported = 0;

    for (const line of lines.slice(1)) {
      const [fromPath, toPath, typeStr] = line.split(",").map((s) => s.trim());
      if (fromPath && toPath) {
        await admin.graphql(CREATE_URL_REDIRECT, {
          variables: { urlRedirect: { path: fromPath, target: toPath } },
        }).catch(() => {});
        await prisma.redirect.create({
          data: {
            shop: session.shop,
            fromPath,
            toPath,
            type: parseInt(typeStr) || 301,
          },
        }).catch(() => {});
        imported++;
      }
    }
    return { imported };
  }

  if (intent === "export") {
    const redirects = await prisma.redirect.findMany({ where: { shop: session.shop } });
    const csv = "from,to,type\n" + redirects.map((r) => `${r.fromPath},${r.toPath},${r.type}`).join("\n");
    return { csv };
  }

  return { success: true };
};

export default function Redirects() {
  const { shopifyRedirects, localRedirects } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [modalOpen, setModalOpen] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [form, setForm] = useState({ fromPath: "", toPath: "", type: "301" });
  const [csvContent, setCsvContent] = useState("from,to,type\n/old-page,/new-page,301");

  const allRedirects = [
    ...shopifyRedirects.map((r: { id: string; path: string; target: string }) => ({
      id: r.id,
      from: r.path,
      to: r.target,
      type: 301,
      source: "shopify",
    })),
    ...localRedirects.map((r) => ({
      id: r.id,
      from: r.fromPath,
      to: r.toPath,
      type: r.type,
      source: "local",
    })),
  ];

  const rows = allRedirects.map((r) => [
    r.from,
    r.to,
    <Badge key={`type-${r.id}`} tone={r.type === 301 ? "info" : "warning"}>
      {r.type}
    </Badge>,
    r.source,
  ]);

  return (
    <Page
      title="Redirect Manager"
      primaryAction={{ content: "Novo Redirect", onAction: () => setModalOpen(true) }}
      secondaryActions={[
        { content: "Importar CSV", onAction: () => setImportModal(true) },
        {
          content: "Exportar CSV",
          onAction: () => fetcher.submit({ intent: "export" }, { method: "POST" }),
        },
      ]}
    >
      <BlockStack gap="500">
        {fetcher.data?.imported !== undefined && (
          <Banner tone="success">{fetcher.data.imported} redirects importados.</Banner>
        )}
        {fetcher.data?.csv && (
          <Banner tone="info">
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{fetcher.data.csv}</pre>
          </Banner>
        )}

        <Card>
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["De", "Para", "Tipo", "Origem"]}
            rows={rows}
          />
        </Card>
      </BlockStack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Redirect"
        primaryAction={{
          content: "Criar",
          onAction: () => {
            fetcher.submit({ intent: "create", ...form }, { method: "POST" });
            setModalOpen(false);
          },
        }}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="De (path)" value={form.fromPath} onChange={(v) => setForm({ ...form, fromPath: v })} autoComplete="off" />
            <TextField label="Para (URL ou path)" value={form.toPath} onChange={(v) => setForm({ ...form, toPath: v })} autoComplete="off" />
            <Select
              label="Tipo"
              options={[
                { label: "301 — Permanente", value: "301" },
                { label: "302 — Temporário", value: "302" },
              ]}
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={importModal}
        onClose={() => setImportModal(false)}
        title="Importar CSV"
        primaryAction={{
          content: "Importar",
          onAction: () => {
            fetcher.submit({ intent: "import_csv", csv: csvContent }, { method: "POST" });
            setImportModal(false);
          },
        }}
      >
        <Modal.Section>
          <TextField
            label="Conteúdo CSV"
            value={csvContent}
            onChange={setCsvContent}
            multiline={8}
            autoComplete="off"
            helpText="Formato: from,to,type"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
