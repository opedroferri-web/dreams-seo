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
  Tabs,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { PIXEL_TEMPLATES, type PixelTemplateKey } from "~/lib/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const scripts = await prisma.managedScript.findMany({
    where: { shop: session.shop },
    orderBy: { priority: "desc" },
  });
  return { scripts };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    await prisma.managedScript.create({
      data: {
        shop: session.shop,
        name: formData.get("name") as string,
        scriptType: formData.get("scriptType") as string,
        placement: formData.get("placement") as string,
        content: formData.get("content") as string,
        displayRule: formData.get("displayRule") as string,
        includeUrls: formData.get("includeUrls") as string || null,
        excludeUrls: formData.get("excludeUrls") as string || null,
      },
    });
  }

  if (intent === "toggle") {
    const id = formData.get("id") as string;
    const script = await prisma.managedScript.findUnique({ where: { id } });
    if (script) {
      await prisma.managedScript.update({
        where: { id },
        data: { enabled: !script.enabled },
      });
    }
  }

  if (intent === "delete") {
    await prisma.managedScript.delete({ where: { id: formData.get("id") as string } });
  }

  if (intent === "add_pixel") {
    const templateKey = formData.get("template") as PixelTemplateKey;
    const template = PIXEL_TEMPLATES[templateKey];
    if (template) {
      await prisma.managedScript.create({
        data: {
          shop: session.shop,
          name: template.name,
          scriptType: template.type,
          placement: template.placement,
          content: template.content,
          displayRule: "all",
        },
      });
    }
  }

  return { success: true };
};

export default function ScriptManager() {
  const { scripts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [form, setForm] = useState({
    name: "",
    scriptType: "javascript",
    placement: "body_end",
    content: "",
    displayRule: "all",
    includeUrls: "",
    excludeUrls: "",
  });

  const rows = scripts.map((s) => [
    s.name,
    s.scriptType,
    s.placement,
    s.displayRule,
    <Badge key={s.id} tone={s.enabled ? "success" : undefined}>{s.enabled ? "Ativo" : "Inativo"}</Badge>,
    <Button key={`toggle-${s.id}`} size="slim" onClick={() => fetcher.submit({ intent: "toggle", id: s.id }, { method: "POST" })}>
      {s.enabled ? "Desativar" : "Ativar"}
    </Button>,
  ]);

  const pixelTabs = Object.entries(PIXEL_TEMPLATES).map(([key, t]) => ({
    id: key,
    content: t.name,
    panelID: key,
  }));

  return (
    <Page
      title="Script Manager"
      subtitle="Gerenciador interno de scripts, pixels e tags"
      primaryAction={{ content: "Novo Script", onAction: () => setModalOpen(true) }}
    >
      <BlockStack gap="500">
        {fetcher.data?.success && <Banner tone="success">Operação realizada!</Banner>}

        <Card>
          <Tabs tabs={pixelTabs} selected={selectedTab} onSelect={setSelectedTab}>
            <BlockStack gap="300">
              <Banner tone="info">
                Templates prontos para pixels. Configure o ID no conteúdo do script após adicionar.
              </Banner>
              <Button
                onClick={() =>
                  fetcher.submit(
                    { intent: "add_pixel", template: pixelTabs[selectedTab].id },
                    { method: "POST" },
                  )
                }
              >
                Adicionar {pixelTabs[selectedTab]?.content}
              </Button>
            </BlockStack>
          </Tabs>
        </Card>

        <Card>
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "text", "text"]}
            headings={["Nome", "Tipo", "Posição", "Regra", "Status", "Ação"]}
            rows={rows}
          />
        </Card>
      </BlockStack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Script"
        primaryAction={{
          content: "Salvar",
          onAction: () => {
            fetcher.submit({ intent: "create", ...form }, { method: "POST" });
            setModalOpen(false);
          },
        }}
      >
        <Modal.Section>
          <FormLayout>
            <TextField label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="off" />
            <Select
              label="Tipo"
              options={[
                { label: "HTML", value: "html" },
                { label: "CSS", value: "css" },
                { label: "JavaScript", value: "javascript" },
                { label: "JSON-LD", value: "json_ld" },
                { label: "Pixel", value: "pixel" },
              ]}
              value={form.scriptType}
              onChange={(v) => setForm({ ...form, scriptType: v })}
            />
            <Select
              label="Posição"
              options={[
                { label: "Header (<head>)", value: "head" },
                { label: "Body Start", value: "body_start" },
                { label: "Body End", value: "body_end" },
              ]}
              value={form.placement}
              onChange={(v) => setForm({ ...form, placement: v })}
            />
            <Select
              label="Regra de exibição"
              options={[
                { label: "Todas as páginas", value: "all" },
                { label: "Homepage", value: "homepage" },
                { label: "Produtos", value: "products" },
                { label: "Coleções", value: "collections" },
                { label: "Blog", value: "blog" },
                { label: "URLs específicas", value: "specific_urls" },
              ]}
              value={form.displayRule}
              onChange={(v) => setForm({ ...form, displayRule: v })}
            />
            <TextField label="Conteúdo" value={form.content} onChange={(v) => setForm({ ...form, content: v })} multiline={6} autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
