import { Badge, DataTable, Text, BlockStack, Card } from "@shopify/polaris";

interface IssueRow {
  id: string;
  resourceType: string;
  resourceTitle: string | null;
  issueType: string;
  severity: string;
  message: string;
  suggestion: string | null;
}

interface IssuesTableProps {
  issues: IssueRow[];
  title?: string;
}

const severityLabel: Record<string, string> = {
  critical: "crítica",
  high: "alta",
  medium: "média",
  low: "baixa",
};

const severityTone = (severity: string) => {
  switch (severity) {
    case "critical":
    case "high":
      return "critical" as const;
    case "medium":
      return "warning" as const;
    default:
      return "info" as const;
  }
};

export function IssuesTable({ issues, title = "Problemas Detectados" }: IssuesTableProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
          <Text as="p" tone="success">
            Nenhum problema encontrado.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const rows = issues.map((issue) => [
    issue.resourceTitle || issue.resourceType,
    issue.issueType.replace(/_/g, " "),
    <Badge key={issue.id} tone={severityTone(issue.severity)}>
      {severityLabel[issue.severity] || issue.severity}
    </Badge>,
    issue.message,
    issue.suggestion || "—",
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          {title} ({issues.length})
        </Text>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text"]}
          headings={["Recurso", "Tipo", "Severidade", "Problema", "Sugestão"]}
          rows={rows}
        />
      </BlockStack>
    </Card>
  );
}
