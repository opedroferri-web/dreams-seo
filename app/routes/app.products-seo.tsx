import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, BlockStack } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { IssuesTable } from "~/components/IssuesTable";
import { GET_PRODUCTS_SEO } from "~/graphql/queries.server";
import { auditProduct, calculateResourceScore } from "~/lib/seo-rules.server";
import { ScoreCard } from "~/components/ScoreCard";
import { Grid } from "@shopify/polaris";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(GET_PRODUCTS_SEO, {
    variables: { first: 50 },
  });
  const json = await response.json();
  const products = json.data?.products?.edges?.map((e: { node: unknown }) => e.node) || [];

  const allIssues = products.flatMap((p: Parameters<typeof auditProduct>[0]) => auditProduct(p));
  const score = calculateResourceScore(allIssues, products.length * 8);

  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "product", fixed: false },
    take: 50,
  });

  return { products: products.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};

export default function ProductsSeo() {
  const { products, score, issues } = useLoaderData<typeof loader>();

  return (
    <Page title="Products SEO" subtitle={`${products} produtos analisados`}>
      <BlockStack gap="500">
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <ScoreCard title="Score de Produtos" score={score} />
          </Grid.Cell>
        </Grid>
        <IssuesTable issues={issues.map((i, idx) => ({ ...i, id: i.id || String(idx) }))} title="Problemas em Produtos" />
      </BlockStack>
    </Page>
  );
}
