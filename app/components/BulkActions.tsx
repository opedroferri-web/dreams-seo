import {
  Card,
  Text,
  BlockStack,
  Button,
  ButtonGroup,
  Banner,
  InlineStack,
} from "@shopify/polaris";
import type { BulkAction } from "~/services/optimization.server";

interface BulkActionsProps {
  onAction: (action: BulkAction) => void;
  loading?: boolean;
  lastResult?: { action: string; updated: number } | null;
}

const ACTIONS: Array<{ id: BulkAction; label: string }> = [
  { id: "generate_alt", label: "Gerar ALT para todas as imagens" },
  { id: "generate_meta_descriptions", label: "Gerar Meta Descriptions" },
  { id: "generate_seo_titles", label: "Gerar SEO Titles" },
  { id: "fix_handles", label: "Corrigir Handles" },
  { id: "update_schema", label: "Atualizar Schema" },
  { id: "generate_collection_seo", label: "Otimizar Coleções" },
];

export function BulkActionsPanel({ onAction, loading, lastResult }: BulkActionsProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Correção em Massa
        </Text>
        <Text as="p" tone="subdued">
          Aplique otimizações em lote via GraphQL Admin API.
        </Text>
        {lastResult && (
          <Banner tone="success">
            {lastResult.updated} recursos atualizados ({lastResult.action})
          </Banner>
        )}
        <ButtonGroup>
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              onClick={() => onAction(action.id)}
              loading={loading}
              size="slim"
            >
              {action.label}
            </Button>
          ))}
        </ButtonGroup>
      </BlockStack>
    </Card>
  );
}

interface AIAssistantProps {
  onAsk: (question: string) => void;
  answer?: string;
  loading?: boolean;
}

const SUGGESTIONS = [
  "Quais produtos possuem pior SEO?",
  "Como melhorar a velocidade da homepage?",
  "Quais páginas não possuem meta description?",
  "Qual app está mais impactando performance?",
];

export function AIAssistantPanel({ onAsk, answer, loading }: AIAssistantProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          SEO AI Assistant
        </Text>
        <Text as="p" tone="subdued">
          Perguntas sobre os dados da sua loja.
        </Text>
        <InlineStack gap="200" wrap>
          {SUGGESTIONS.map((q) => (
            <Button key={q} onClick={() => onAsk(q)} size="slim" loading={loading}>
              {q}
            </Button>
          ))}
        </InlineStack>
        {answer && (
          <Banner tone="info">
            <Text as="p">{answer}</Text>
          </Banner>
        )}
      </BlockStack>
    </Card>
  );
}
