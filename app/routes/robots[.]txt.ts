import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const origin = new URL(request.url).origin;

  const body = `# Dreams SEO Pro — backend do app Shopify (não indexar)
User-agent: *
Disallow: /

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
