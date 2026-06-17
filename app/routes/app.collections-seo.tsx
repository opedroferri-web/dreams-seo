import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, BlockStack, Grid } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { IssuesTable } from "~/components/IssuesTable";
import { GET_COLLECTIONS_SEO } from "~/graphql/queries.server";
import { auditCollection, calculateResourceScore } from "~/lib/seo-rules.server";
import { ScoreCard } from "~/components/ScoreCard";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(GET_COLLECTIONS_SEO, {
    variables: { first: 50 },
  });
  const json = await response.json();
  const collections = json.data?.collections?.edges?.map((e: { node: unknown }) => e.node) || [];

  const allIssues = collections.flatMap((c: Parameters<typeof auditCollection>[0]) => auditCollection(c));
  const score = calculateResourceScore(allIssues, collections.length * 5);

  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "collection", fixed: false },
    take: 50,
  });

  return { count: collections.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};

export default function CollectionsSeo() {
  const { count, score, issues } = useLoaderData<typeof loader>();

  return (
    <Page title="Collections SEO" subtitle={`${count} coleções analisadas`}>
      <BlockStack gap="500">
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <ScoreCard title="Score de Coleções" score={score} />
          </Grid.Cell>
        </Grid>
        <IssuesTable issues={issues.map((i, idx) => ({ ...i, id: i.id || String(idx) }))} title="Problemas em Coleções" />
      </BlockStack>
    </Page>
  );
}
