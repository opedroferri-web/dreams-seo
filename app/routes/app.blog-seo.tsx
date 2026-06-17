import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, BlockStack, Grid } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { IssuesTable } from "~/components/IssuesTable";
import { GET_BLOGS_SEO } from "~/graphql/queries.server";
import { auditArticle, calculateResourceScore } from "~/lib/seo-rules.server";
import { ScoreCard } from "~/components/ScoreCard";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(GET_BLOGS_SEO, {
    variables: { first: 10 },
  });
  const json = await response.json();
  const blogs = json.data?.blogs?.edges || [];
  const articles = blogs.flatMap(
    (b: { node: { articles: { edges: Array<{ node: unknown }> } } }) =>
      b.node.articles.edges.map((e) => e.node),
  );

  const allIssues = articles.flatMap((a: Parameters<typeof auditArticle>[0]) => auditArticle(a));
  const score = calculateResourceScore(allIssues, articles.length * 5);

  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "article", fixed: false },
    take: 50,
  });

  return { count: articles.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};

export default function BlogSeo() {
  const { count, score, issues } = useLoaderData<typeof loader>();

  return (
    <Page title="Blog SEO" subtitle={`${count} artigos analisados`}>
      <BlockStack gap="500">
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <ScoreCard title="Score do Blog" score={score} />
          </Grid.Cell>
        </Grid>
        <IssuesTable issues={issues.map((i, idx) => ({ ...i, id: i.id || String(idx) }))} title="Problemas em Artigos" />
      </BlockStack>
    </Page>
  );
}
