import { Card, Text, ProgressBar, InlineStack, BlockStack, Badge } from "@shopify/polaris";
import { getScoreColor, getScoreLabel } from "~/lib/scoring";

interface ScoreCardProps {
  title: string;
  score: number;
  description?: string;
}

export function ScoreCard({ title, score, description }: ScoreCardProps) {
  const tone = getScoreColor(score);
  const badgeTone = tone === "success" ? "success" : tone === "warning" ? "warning" : "critical";

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
          <Badge tone={badgeTone}>{getScoreLabel(score)}</Badge>
        </InlineStack>
        <Text as="p" variant="heading2xl" fontWeight="bold">
          {score}
          <Text as="span" variant="bodyMd" tone="subdued">
            /100
          </Text>
        </Text>
        <ProgressBar progress={score} tone={tone} size="small" />
        {description && (
          <Text as="p" variant="bodySm" tone="subdued">
            {description}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}
