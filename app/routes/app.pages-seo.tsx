import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, BlockStack, Grid } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { IssuesTable } from "~/components/IssuesTable";
import { GET_PAGES_SEO } from "~/graphql/queries.server";
import { auditPage, calculateResourceScore } from "~/lib/seo-rules.server";
import { ScoreCard } from "~/components/ScoreCard";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(GET_PAGES_SEO, {
    variables: { first: 50 },
  });
  const json = await response.json();
  const pages = json.data?.pages?.edges?.map((e: { node: unknown }) => e.node) || [];

  const allIssues = pages.flatMap((p: Parameters<typeof auditPage>[0]) => auditPage(p));
  const score = calculateResourceScore(allIssues, pages.length * 4);

  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "page", fixed: false },
    take: 50,
  });

  return { count: pages.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};

export default function PagesSeo() {
  const { count, score, issues } = useLoaderData<typeof loader>();

  return (
    <Page title="Pages SEO" subtitle={`${count} páginas analisadas`}>
      <BlockStack gap="500">
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <ScoreCard title="Score de Páginas" score={score} />
          </Grid.Cell>
        </Grid>
        <IssuesTable issues={issues.map((i, idx) => ({ ...i, id: i.id || String(idx) }))} title="Problemas em Páginas" />
      </BlockStack>
    </Page>
  );
}
