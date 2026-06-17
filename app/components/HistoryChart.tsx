import { Card, Text, BlockStack, InlineStack, Badge, DataTable } from "@shopify/polaris";

interface HistoryPoint {
  date: string;
  seoScore: number;
  performanceScore: number;
  technicalScore: number;
  optimizationScore: number;
}

interface HistoryChartProps {
  history: HistoryPoint[];
}

export function HistoryChart({ history }: HistoryChartProps) {
  if (history.length === 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Evolução Histórica
          </Text>
          <Text as="p" tone="subdued">
            Execute uma auditoria para começar a registrar histórico.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const rows = history.slice(0, 10).map((point) => [
    point.date,
    <Badge key={`seo-${point.date}`} tone={point.seoScore >= 70 ? "success" : "warning"}>
      {point.seoScore}
    </Badge>,
    <Badge key={`perf-${point.date}`} tone={point.performanceScore >= 70 ? "success" : "warning"}>
      {point.performanceScore}
    </Badge>,
    <Badge key={`tech-${point.date}`} tone={point.technicalScore >= 70 ? "success" : "warning"}>
      {point.technicalScore}
    </Badge>,
    <Badge key={`opt-${point.date}`} tone={point.optimizationScore >= 70 ? "success" : "warning"}>
      {point.optimizationScore}
    </Badge>,
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            Evolução Histórica
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Últimas {history.length} auditorias
          </Text>
        </InlineStack>
        <DataTable
          columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
          headings={["Data", "SEO", "Performance", "Técnico", "Otimização"]}
          rows={rows}
        />
      </BlockStack>
    </Card>
  );
}
