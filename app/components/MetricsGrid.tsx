import { Card, Grid, Text, BlockStack } from "@shopify/polaris";

interface MetricItem {
  label: string;
  value: number | string;
  suffix?: string;
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <Grid>
      {metrics.map((metric) => (
        <Grid.Cell key={metric.label} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
          <Card>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                {metric.label}
              </Text>
              <Text as="p" variant="headingLg" fontWeight="bold">
                {metric.value}
                {metric.suffix && (
                  <Text as="span" variant="bodySm" tone="subdued">
                    {metric.suffix}
                  </Text>
                )}
              </Text>
            </BlockStack>
          </Card>
        </Grid.Cell>
      ))}
    </Grid>
  );
}
