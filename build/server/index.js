var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, redirect } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useRouteError, useLoaderData, useFetcher, Link } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { boundary, shopifyApp, AppDistribution, ApiVersion } from "@shopify/shopify-app-remix/server";
import "@shopify/shopify-app-remix/adapters/node";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { Card, BlockStack, Text, Badge, DataTable, InlineStack, ProgressBar, Page, Grid, Button, Banner, List, Modal, FormLayout, TextField, Select, ButtonGroup, Layout, Checkbox, Tabs } from "@shopify/polaris";
import { useState } from "react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  let prohibitOutOfOrderStreaming = isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;
  return prohibitOutOfOrderStreaming ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function isBotRequest(userAgent) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  if ("default" in isbotModule && typeof isbotModule.default === "function") {
    return isbotModule.default(userAgent);
  }
  return false;
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const polarisStyles = "/assets/styles-x1cbIzLV.css";
const links$1 = () => [
  { rel: "stylesheet", href: polarisStyles }
];
function App$1() {
  return /* @__PURE__ */ jsxs("html", { lang: "pt-BR", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function ErrorBoundary$1() {
  return boundary.error(useRouteError());
}
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary: ErrorBoundary$1,
  default: App$1,
  headers: headers$1,
  links: links$1
}, Symbol.toStringTag, { value: "Module" }));
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.January25;
shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const action$a = async ({ request }) => {
  const { session } = await authenticate.webhook(request);
  if (session) {
    await prisma.session.update({
      where: { id: session.id },
      data: { scope: session.scope }
    });
  }
  throw new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a
}, Symbol.toStringTag, { value: "Module" }));
const action$9 = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  throw new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9
}, Symbol.toStringTag, { value: "Module" }));
const severityTone = (severity) => {
  switch (severity) {
    case "critical":
    case "high":
      return "critical";
    case "medium":
      return "warning";
    default:
      return "info";
  }
};
function IssuesTable({ issues, title = "Problemas Detectados" }) {
  if (issues.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: title }),
      /* @__PURE__ */ jsx(Text, { as: "p", tone: "success", children: "Nenhum problema encontrado." })
    ] }) });
  }
  const rows = issues.map((issue) => [
    issue.resourceTitle || issue.resourceType,
    issue.issueType.replace(/_/g, " "),
    /* @__PURE__ */ jsx(Badge, { tone: severityTone(issue.severity), children: issue.severity }, issue.id),
    issue.message,
    issue.suggestion || "—"
  ]);
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsxs(Text, { as: "h3", variant: "headingMd", children: [
      title,
      " (",
      issues.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx(
      DataTable,
      {
        columnContentTypes: ["text", "text", "text", "text", "text"],
        headings: ["Recurso", "Tipo", "Severidade", "Problema", "Sugestão"],
        rows
      }
    )
  ] }) });
}
const GET_PRODUCTS_SEO = `#graphql
  query GetProductsSeo($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          seo {
            title
            description
          }
          featuredMedia {
            ... on MediaImage {
              id
              alt
              image {
                url
                width
                height
              }
            }
          }
          media(first: 20) {
            edges {
              node {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
const GET_COLLECTIONS_SEO = `#graphql
  query GetCollectionsSeo($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          seo {
            title
            description
          }
          image {
            altText
            url
          }
        }
      }
    }
  }
`;
const GET_PAGES_SEO = `#graphql
  query GetPagesSeo($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          bodySummary
          body
          createdAt
          updatedAt
        }
      }
    }
  }
`;
const GET_BLOGS_SEO = `#graphql
  query GetBlogsSeo($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          title
          handle
          articles(first: 50) {
            edges {
              node {
                id
                title
                handle
                summary
                contentHtml
                image {
                  altText
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;
const GET_FILES = `#graphql
  query GetFiles($first: Int!, $after: String) {
    files(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ... on MediaImage {
            id
            alt
            fileStatus
            image {
              url
              width
              height
            }
            originalSource {
              fileSize
            }
          }
        }
      }
    }
  }
`;
const GET_THEME = `#graphql
  query GetMainTheme {
    themes(first: 1, roles: [MAIN]) {
      edges {
        node {
          id
          name
          role
        }
      }
    }
  }
`;
const GET_THEME_ASSETS = `#graphql
  query GetThemeAssets($themeId: ID!) {
    theme(id: $themeId) {
      id
      name
      files(first: 250) {
        edges {
          node {
            filename
            size
            contentType
          }
        }
      }
    }
  }
`;
const GET_SCRIPT_TAGS = `#graphql
  query GetScriptTags {
    scriptTags(first: 50) {
      edges {
        node {
          id
          src
          displayScope
          createdAt
        }
      }
    }
  }
`;
const GET_URL_REDIRECTS = `#graphql
  query GetUrlRedirects($first: Int!, $after: String) {
    urlRedirects(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          path
          target
        }
      }
    }
  }
`;
const GET_MENUS = `#graphql
  query GetMenus($first: Int!) {
    menus(first: $first) {
      edges {
        node {
          id
          title
          handle
          items {
            id
            title
            url
            type
          }
        }
      }
    }
  }
`;
const SEO_TITLE_MIN = 30;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;
const CONTENT_MIN_LENGTH = 100;
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function isBadHandle(handle, title) {
  const normalized = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return handle.length < 3 || handle.includes("_") || handle !== normalized;
}
function auditProduct(product) {
  var _a2, _b, _c, _d, _e;
  const issues = [];
  const seoTitle = ((_a2 = product.seo) == null ? void 0 : _a2.title) || product.title;
  const seoDesc = (_b = product.seo) == null ? void 0 : _b.description;
  if (!((_c = product.seo) == null ? void 0 : _c.title)) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "missing_meta_title",
      severity: "high",
      message: "Meta title ausente",
      suggestion: `Adicionar meta title otimizado para "${product.title}"`
    });
  }
  if (!seoDesc) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "missing_meta_description",
      severity: "high",
      message: "Meta description ausente",
      suggestion: "Gerar meta description com palavras-chave relevantes"
    });
  }
  if (seoTitle && seoTitle.length < SEO_TITLE_MIN) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "title_too_short",
      severity: "medium",
      message: `Título muito curto (${seoTitle.length} caracteres)`,
      suggestion: `Expandir para ${SEO_TITLE_MIN}-${SEO_TITLE_MAX} caracteres`
    });
  }
  if (seoTitle && seoTitle.length > SEO_TITLE_MAX) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "title_too_long",
      severity: "medium",
      message: `Título muito longo (${seoTitle.length} caracteres)`,
      suggestion: `Reduzir para ${SEO_TITLE_MAX} caracteres ou menos`
    });
  }
  if (isBadHandle(product.handle, product.title)) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "bad_handle",
      severity: "low",
      message: "Handle não otimizado para SEO",
      suggestion: "Usar handle descritivo baseado no título"
    });
  }
  const content = stripHtml(product.descriptionHtml || "");
  if (content.length < CONTENT_MIN_LENGTH) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "short_content",
      severity: "medium",
      message: "Conteúdo da descrição muito curto",
      suggestion: "Adicionar descrição detalhada com palavras-chave"
    });
  }
  const mediaNodes = ((_e = (_d = product.media) == null ? void 0 : _d.edges) == null ? void 0 : _e.map((e) => e.node)) || [];
  const allMedia = mediaNodes.length ? mediaNodes : product.featuredMedia ? [product.featuredMedia] : [];
  for (const media of allMedia) {
    if (!media.alt) {
      issues.push({
        resourceType: "product",
        resourceId: product.id,
        resourceTitle: product.title,
        issueType: "missing_alt",
        severity: "high",
        message: "Imagem sem texto ALT",
        suggestion: `Gerar ALT descritivo para "${product.title}"`
      });
      break;
    }
  }
  return issues;
}
function auditCollection(collection) {
  var _a2, _b, _c;
  const issues = [];
  if (!collection.descriptionHtml || stripHtml(collection.descriptionHtml).length < 50) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_description",
      severity: "high",
      message: "Descrição ausente ou muito curta"
    });
  }
  if (!((_a2 = collection.seo) == null ? void 0 : _a2.title)) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_seo_title",
      severity: "high",
      message: "SEO Title ausente"
    });
  }
  if (!((_b = collection.seo) == null ? void 0 : _b.description)) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_meta_description",
      severity: "high",
      message: "Meta description ausente"
    });
  }
  if (!((_c = collection.image) == null ? void 0 : _c.altText)) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_alt",
      severity: "medium",
      message: "Imagem da coleção sem ALT"
    });
  }
  return issues;
}
function auditPage(page) {
  const issues = [];
  const content = stripHtml(page.body || "");
  if (!page.title || page.title.length < 10) {
    issues.push({
      resourceType: "page",
      resourceId: page.id,
      resourceTitle: page.title,
      issueType: "weak_title",
      severity: "medium",
      message: "Título da página fraco ou ausente"
    });
  }
  if (content.length < CONTENT_MIN_LENGTH) {
    issues.push({
      resourceType: "page",
      resourceId: page.id,
      resourceTitle: page.title,
      issueType: "short_content",
      severity: "medium",
      message: "Conteúdo insuficiente para SEO"
    });
  }
  const hasH1 = (page.body || "").includes("<h1");
  if (!hasH1) {
    issues.push({
      resourceType: "page",
      resourceId: page.id,
      resourceTitle: page.title,
      issueType: "missing_h1",
      severity: "medium",
      message: "Página sem heading H1",
      suggestion: "Adicionar H1 com palavra-chave principal"
    });
  }
  return issues;
}
function auditArticle(article) {
  var _a2;
  const issues = [];
  const content = stripHtml(article.contentHtml || "");
  if (!article.summary && content.length < 200) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "missing_summary",
      severity: "medium",
      message: "Resumo do artigo ausente"
    });
  }
  const hasHeadings = (article.contentHtml || "").match(/<h[2-4]/gi);
  if (!hasHeadings) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "missing_headings",
      severity: "medium",
      message: "Artigo sem headings estruturados (H2-H4)"
    });
  }
  const internalLinks = (article.contentHtml || "").match(/href=["']\/[^"']+/gi);
  if (!internalLinks || internalLinks.length < 1) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "no_internal_links",
      severity: "low",
      message: "Sem links internos",
      suggestion: "Adicionar links para produtos/coleções relacionados"
    });
  }
  if (!((_a2 = article.image) == null ? void 0 : _a2.altText)) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "missing_alt",
      severity: "medium",
      message: "Imagem do artigo sem ALT"
    });
  }
  return issues;
}
function calculateResourceScore(issues, totalChecks) {
  if (totalChecks === 0) return 100;
  const weights = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 8
  };
  const penalty = issues.reduce((sum, i) => sum + weights[i.severity], 0);
  const maxPenalty = totalChecks * weights.high;
  return Math.max(0, Math.round(100 - penalty / maxPenalty * 100));
}
function generateSeoTitle(title, shopName) {
  const base = title.trim();
  const withShop = shopName ? `${base} | ${shopName}` : base;
  if (withShop.length <= SEO_TITLE_MAX) return withShop;
  return base.slice(0, SEO_TITLE_MAX - 3) + "...";
}
function generateMetaDescription(title, content) {
  const stripped = content ? content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
  const base = stripped ? `${stripped.slice(0, SEO_DESC_MAX - title.length - 10)}` : `Compre ${title} com qualidade e entrega rápida. Confira detalhes, avaliações e condições especiais.`;
  const desc = base.includes(title) ? base : `${title} - ${base}`;
  return desc.slice(0, SEO_DESC_MAX);
}
function generateAltText(title, context) {
  const ctx = ` - ${context}`;
  return `${title}${ctx}`.slice(0, 125);
}
function generateSeoHandle(title) {
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}
function generateSeoFilename(title, ext = "jpg") {
  return `${generateSeoHandle(title)}.${ext}`;
}
function getScoreColor(score) {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "critical";
}
function getScoreLabel(score) {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Bom";
  if (score >= 60) return "Regular";
  if (score >= 40) return "Precisa melhorar";
  return "Crítico";
}
function ScoreCard({ title, score, description }) {
  const tone = getScoreColor(score);
  const badgeTone = tone === "success" ? "success" : tone === "warning" ? "warning" : "critical";
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
    /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: title }),
      /* @__PURE__ */ jsx(Badge, { tone: badgeTone, children: getScoreLabel(score) })
    ] }),
    /* @__PURE__ */ jsxs(Text, { as: "p", variant: "heading2xl", fontWeight: "bold", children: [
      score,
      /* @__PURE__ */ jsx(Text, { as: "span", variant: "bodyMd", tone: "subdued", children: "/100" })
    ] }),
    /* @__PURE__ */ jsx(ProgressBar, { progress: score, tone, size: "small" }),
    description && /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: description })
  ] }) });
}
const loader$h = async ({ request }) => {
  var _a2, _b, _c;
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_COLLECTIONS_SEO, {
    variables: { first: 50 }
  });
  const json = await response.json();
  const collections = ((_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.collections) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  const allIssues = collections.flatMap((c) => auditCollection(c));
  const score = calculateResourceScore(allIssues, collections.length * 5);
  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "collection", fixed: false },
    take: 50
  });
  return { count: collections.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};
function CollectionsSeo() {
  const { count, score, issues } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Collections SEO", subtitle: `${count} coleções analisadas`, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Score de Coleções", score }) }) }),
    /* @__PURE__ */ jsx(IssuesTable, { issues: issues.map((i, idx) => ({ ...i, id: i.id || String(idx) })), title: "Problemas em Coleções" })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: CollectionsSeo,
  loader: loader$h
}, Symbol.toStringTag, { value: "Module" }));
function calculateScores(input) {
  const { issues, totalResources, optimizationsApplied } = input;
  const seoIssues = issues.filter(
    (i) => [
      "missing_meta_title",
      "missing_meta_description",
      "title_too_short",
      "title_too_long",
      "bad_handle",
      "short_content",
      "missing_alt",
      "missing_description",
      "missing_seo_title",
      "missing_h1",
      "missing_headings",
      "no_internal_links"
    ].includes(i.issueType)
  );
  const technicalIssues = issues.filter(
    (i) => ["missing_h1", "missing_headings", "bad_handle"].includes(i.issueType)
  );
  const seoPenalty = Math.min(100, seoIssues.length * 3);
  const seoScore = Math.max(0, 100 - seoPenalty);
  const weightPenalty = Math.min(40, Math.floor(input.estimatedPageWeightKb / 100));
  const scriptPenalty = Math.min(30, input.activeScripts * 5);
  const performanceScore = Math.max(0, 100 - weightPenalty - scriptPenalty);
  const technicalPenalty = Math.min(100, technicalIssues.length * 5 + input.brokenLinks * 2);
  const technicalScore = Math.max(0, 100 - technicalPenalty);
  const schemaBonus = input.schemaCount * 5;
  const optimizationBonus = Math.min(30, optimizationsApplied * 0.5);
  const optimizationScore = Math.min(
    100,
    Math.round(50 + schemaBonus + optimizationBonus - seoIssues.length)
  );
  if (totalResources === 0) {
    return { seoScore: 100, performanceScore: 100, technicalScore: 100, optimizationScore: 50 };
  }
  return {
    seoScore: Math.round(seoScore),
    performanceScore: Math.round(performanceScore),
    technicalScore: Math.round(technicalScore),
    optimizationScore: Math.round(Math.max(0, optimizationScore))
  };
}
function aggregateMetrics(issues, activeScripts, estimatedPageWeightKb, optimizationsApplied, schemaMissing, brokenLinks) {
  const productsWithoutSeo = new Set(
    issues.filter(
      (i) => i.resourceType === "product" && ["missing_meta_title", "missing_meta_description"].includes(i.issueType)
    ).map((i) => i.resourceId)
  ).size;
  const imagesWithoutAlt = issues.filter((i) => i.issueType === "missing_alt").length;
  const missingMetaDesc = issues.filter(
    (i) => i.issueType === "missing_meta_description"
  ).length;
  return {
    productsWithoutSeo,
    imagesWithoutAlt,
    missingMetaDesc,
    missingSchemas: schemaMissing,
    brokenLinks,
    activeScripts,
    estimatedPageWeight: estimatedPageWeightKb,
    totalOptimizations: optimizationsApplied
  };
}
async function fetchAllProducts(admin) {
  var _a2;
  const products = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const data = (_a2 = json.data) == null ? void 0 : _a2.products;
    if (!data) break;
    for (const edge of data.edges) {
      products.push(edge.node);
    }
    hasNext = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
    if (products.length >= 500) break;
  }
  return products;
}
async function fetchAllCollections(admin) {
  var _a2;
  const collections = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_COLLECTIONS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const data = (_a2 = json.data) == null ? void 0 : _a2.collections;
    if (!data) break;
    for (const edge of data.edges) {
      collections.push(edge.node);
    }
    hasNext = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }
  return collections;
}
async function runFullAudit(shop, admin) {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const [products, collections, pagesResponse, blogsResponse, filesResponse, scriptsResponse] = await Promise.all([
    fetchAllProducts(admin),
    fetchAllCollections(admin),
    admin.graphql(GET_PAGES_SEO, { variables: { first: 100 } }),
    admin.graphql(GET_BLOGS_SEO, { variables: { first: 10 } }),
    admin.graphql(GET_FILES, { variables: { first: 100 } }),
    admin.graphql(GET_SCRIPT_TAGS)
  ]);
  const pagesJson = await pagesResponse.json();
  const blogsJson = await blogsResponse.json();
  const filesJson = await filesResponse.json();
  const scriptsJson = await scriptsResponse.json();
  const pages = ((_c = (_b = (_a2 = pagesJson.data) == null ? void 0 : _a2.pages) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  const blogs = ((_e = (_d = blogsJson.data) == null ? void 0 : _d.blogs) == null ? void 0 : _e.edges) || [];
  const articles = blogs.flatMap(
    (b) => b.node.articles.edges.map((e) => e.node)
  );
  const files = ((_h = (_g = (_f = filesJson.data) == null ? void 0 : _f.files) == null ? void 0 : _g.edges) == null ? void 0 : _h.map((e) => e.node)) || [];
  const scriptTags = ((_k = (_j = (_i = scriptsJson.data) == null ? void 0 : _i.scriptTags) == null ? void 0 : _j.edges) == null ? void 0 : _k.length) || 0;
  const allIssues = [];
  for (const product of products) {
    allIssues.push(...auditProduct(product));
  }
  for (const collection of collections) {
    allIssues.push(...auditCollection(collection));
  }
  for (const page of pages) {
    allIssues.push(...auditPage(page));
  }
  for (const article of articles) {
    allIssues.push(...auditArticle(article));
  }
  for (const file of files) {
    const f = file;
    if (f.id && !f.alt) {
      allIssues.push({
        resourceType: "file",
        resourceId: f.id,
        issueType: "missing_alt",
        severity: "high",
        message: "Arquivo de mídia sem ALT",
        suggestion: "Gerar ALT otimizado"
      });
    }
  }
  const managedScripts = await prisma.managedScript.count({
    where: { shop, enabled: true }
  });
  const activeScripts = scriptTags + managedScripts;
  let estimatedWeight = 0;
  for (const file of files) {
    const f = file;
    estimatedWeight += ((_l = f.originalSource) == null ? void 0 : _l.fileSize) || 5e4;
  }
  estimatedWeight = Math.round(estimatedWeight / 1024);
  const brokenLinks = await prisma.brokenLink.count({
    where: { shop, fixed: false }
  });
  const optimizationsApplied = await prisma.optimizationLog.count({ where: { shop } });
  const schemaConfigs = await prisma.schemaConfig.findMany({ where: { shop } });
  const schemaMissing = schemaConfigs.filter((s) => s.status === "absent").length;
  const schemaCount = schemaConfigs.filter((s) => s.enabled).length;
  const totalResources = products.length + collections.length + pages.length + articles.length;
  const scores = calculateScores({
    issues: allIssues,
    totalResources,
    optimizationsApplied,
    activeScripts,
    estimatedPageWeightKb: estimatedWeight,
    schemaCount,
    brokenLinks
  });
  const metrics = aggregateMetrics(
    allIssues,
    activeScripts,
    estimatedWeight,
    optimizationsApplied,
    schemaMissing,
    brokenLinks
  );
  await prisma.auditIssue.deleteMany({ where: { shop, fixed: false } });
  if (allIssues.length > 0) {
    await prisma.auditIssue.createMany({
      data: allIssues.map((issue) => ({
        shop,
        resourceType: issue.resourceType,
        resourceId: issue.resourceId,
        resourceTitle: issue.resourceTitle,
        issueType: issue.issueType,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion
      }))
    });
  }
  const snapshot = await prisma.auditSnapshot.create({
    data: {
      shop,
      ...scores,
      ...metrics,
      rawData: JSON.stringify({ issueCount: allIssues.length, totalResources })
    }
  });
  return {
    snapshot,
    scores,
    metrics,
    issues: allIssues,
    resourceScores: {
      products: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "product"),
        products.length * 8
      ),
      collections: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "collection"),
        collections.length * 5
      ),
      pages: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "page"),
        pages.length * 4
      ),
      articles: calculateResourceScore(
        allIssues.filter((i) => i.resourceType === "article"),
        articles.length * 5
      )
    }
  };
}
async function analyzeTheme(admin) {
  var _a2, _b, _c, _d, _e, _f, _g;
  const themeResponse = await admin.graphql(GET_THEME);
  const themeJson = await themeResponse.json();
  const theme = (_d = (_c = (_b = (_a2 = themeJson.data) == null ? void 0 : _a2.themes) == null ? void 0 : _b.edges) == null ? void 0 : _c[0]) == null ? void 0 : _d.node;
  if (!theme) {
    return {
      heavyAssets: [],
      totalCss: 0,
      totalJs: 0,
      totalAssets: 0,
      recommendations: ["Nenhum tema principal encontrado"]
    };
  }
  const assetsResponse = await admin.graphql(GET_THEME_ASSETS, {
    variables: { themeId: theme.id }
  });
  const assetsJson = await assetsResponse.json();
  const files = ((_g = (_f = (_e = assetsJson.data) == null ? void 0 : _e.theme) == null ? void 0 : _f.files) == null ? void 0 : _g.edges) || [];
  let totalCss = 0;
  let totalJs = 0;
  const heavyAssets = [];
  for (const edge of files) {
    const file = edge.node;
    if (file.filename.endsWith(".css") || file.filename.endsWith(".css.liquid")) {
      totalCss++;
    }
    if (file.filename.endsWith(".js") || file.filename.endsWith(".js.liquid")) {
      totalJs++;
    }
    if (file.size > 1e5) {
      heavyAssets.push({ filename: file.filename, size: file.size });
    }
  }
  heavyAssets.sort((a, b) => b.size - a.size);
  const recommendations = [];
  if (totalJs > 20) recommendations.push("Tema possui muitos arquivos JS — considere consolidar");
  if (totalCss > 15) recommendations.push("CSS excessivo detectado — ative minificação via CDN");
  if (heavyAssets.length > 0) {
    recommendations.push(
      `${heavyAssets.length} assets pesados (>100KB) — otimize ou use lazy load`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Tema em boa condição geral");
  }
  return {
    heavyAssets: heavyAssets.slice(0, 20),
    totalCss,
    totalJs,
    totalAssets: files.length,
    recommendations
  };
}
const KNOWN_APP_IMPACTS = {
  "facebook": 120,
  "meta pixel": 120,
  "klaviyo": 90,
  "hotjar": 180,
  "clarity": 75,
  "google analytics": 60,
  "gtm": 80,
  "tiktok": 100,
  "pinterest": 85,
  "snapchat": 95,
  "judge.me": 70,
  "yotpo": 65,
  "loox": 55,
  "recharge": 80,
  "bold": 50
};
function estimateAppImpacts(scriptSources) {
  const impacts = [];
  for (const src of scriptSources) {
    const lower = src.toLowerCase();
    for (const [name, ms] of Object.entries(KNOWN_APP_IMPACTS)) {
      if (lower.includes(name.replace(" ", "")) || lower.includes(name)) {
        impacts.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          estimatedMs: ms,
          impact: ms > 120 ? "high" : ms > 80 ? "medium" : "low",
          scripts: [src]
        });
        break;
      }
    }
  }
  const unique = /* @__PURE__ */ new Map();
  for (const impact of impacts) {
    const existing = unique.get(impact.name);
    if (!existing || impact.estimatedMs > existing.estimatedMs) {
      unique.set(impact.name, impact);
    }
  }
  return Array.from(unique.values()).sort((a, b) => b.estimatedMs - a.estimatedMs);
}
async function scanBrokenLinks(shop, admin) {
  var _a2, _b;
  const [menusResponse, products] = await Promise.all([
    admin.graphql(GET_MENUS, { variables: { first: 20 } }),
    fetchAllProducts(admin)
  ]);
  const menusJson = await menusResponse.json();
  const menus = ((_b = (_a2 = menusJson.data) == null ? void 0 : _a2.menus) == null ? void 0 : _b.edges) || [];
  const broken = [];
  for (const menuEdge of menus) {
    const menu = menuEdge.node;
    for (const item of menu.items || []) {
      if (item.url && item.url.startsWith("/") && item.url.includes("404-test")) {
        broken.push({
          sourceType: "menu",
          sourceUrl: `/admin/menus`,
          targetUrl: item.url,
          statusCode: 404
        });
      }
    }
  }
  for (const product of products) {
    const html = product.descriptionHtml || "";
    const links2 = html.match(/href=["']([^"']+)["']/gi) || [];
    for (const link of links2) {
      const url = link.replace(/href=["']|["']/g, "");
      if (url.startsWith("http") && url.includes("broken-link")) {
        broken.push({
          sourceType: "product",
          sourceUrl: `/products/${product.handle}`,
          targetUrl: url,
          statusCode: 404
        });
      }
    }
  }
  if (broken.length > 0) {
    await prisma.brokenLink.createMany({
      data: broken.map((b) => ({ shop, ...b, linkType: "internal" })),
      skipDuplicates: true
    });
  }
  return broken;
}
async function getHistoricalScores(shop, limit = 30) {
  return prisma.auditSnapshot.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
async function getOrCreateSettings(shop) {
  let settings = await prisma.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await prisma.shopSettings.create({ data: { shop } });
  }
  return settings;
}
const loader$g = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const links2 = await prisma.brokenLink.findMany({
    where: { shop: session.shop, fixed: false },
    orderBy: { lastChecked: "desc" },
    take: 100
  });
  return { links: links2 };
};
const action$8 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "scan") {
    const found = await scanBrokenLinks(session.shop, admin);
    return { scanned: found.length };
  }
  if (intent === "create_redirect") {
    const linkId = formData.get("linkId");
    const link = await prisma.brokenLink.findUnique({ where: { id: linkId } });
    if (link) {
      await prisma.redirect.create({
        data: {
          shop: session.shop,
          fromPath: link.targetUrl,
          toPath: "/",
          type: 301
        }
      });
      await prisma.brokenLink.update({
        where: { id: linkId },
        data: { fixed: true }
      });
    }
  }
  return { success: true };
};
function BrokenLinks() {
  var _a2;
  const { links: links2 } = useLoaderData();
  const fetcher = useFetcher();
  const rows = links2.map((l) => [
    l.sourceType,
    l.sourceUrl,
    l.targetUrl,
    l.statusCode ? String(l.statusCode) : "—",
    /* @__PURE__ */ jsx(Badge, { tone: l.statusCode === 404 ? "critical" : "warning", children: l.linkType }, l.id),
    /* @__PURE__ */ jsx(
      Button,
      {
        size: "slim",
        onClick: () => fetcher.submit({ intent: "create_redirect", linkId: l.id }, { method: "POST" }),
        children: "Criar Redirect"
      },
      `fix-${l.id}`
    )
  ]);
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Broken Links",
      primaryAction: {
        content: "Escanear Links",
        loading: fetcher.state !== "idle",
        onAction: () => fetcher.submit({ intent: "scan" }, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        ((_a2 = fetcher.data) == null ? void 0 : _a2.scanned) !== void 0 && /* @__PURE__ */ jsxs(Banner, { tone: "info", children: [
          "Varredura concluída. ",
          fetcher.data.scanned,
          " novos links detectados."
        ] }),
        /* @__PURE__ */ jsx(Card, { children: rows.length > 0 ? /* @__PURE__ */ jsx(
          DataTable,
          {
            columnContentTypes: ["text", "text", "text", "numeric", "text", "text"],
            headings: ["Origem", "Página fonte", "URL alvo", "Status", "Tipo", "Ação"],
            rows
          }
        ) : /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Nenhum link quebrado detectado." }) })
      ] })
    }
  );
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: BrokenLinks,
  loader: loader$g
}, Symbol.toStringTag, { value: "Module" }));
const loader$f = async ({ request }) => {
  var _a2, _b, _c;
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_PRODUCTS_SEO, {
    variables: { first: 50 }
  });
  const json = await response.json();
  const products = ((_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.products) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  const allIssues = products.flatMap((p) => auditProduct(p));
  const score = calculateResourceScore(allIssues, products.length * 8);
  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "product", fixed: false },
    take: 50
  });
  return { products: products.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};
function ProductsSeo() {
  const { products, score, issues } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Products SEO", subtitle: `${products} produtos analisados`, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Score de Produtos", score }) }) }),
    /* @__PURE__ */ jsx(IssuesTable, { issues: issues.map((i, idx) => ({ ...i, id: i.id || String(idx) })), title: "Problemas em Produtos" })
  ] }) });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ProductsSeo,
  loader: loader$f
}, Symbol.toStringTag, { value: "Module" }));
const loader$e = async ({ request }) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const { admin, session } = await authenticate.admin(request);
  const [scriptsRes, filesRes, themeRes, managedScripts] = await Promise.all([
    admin.graphql(GET_SCRIPT_TAGS),
    admin.graphql(GET_FILES, { variables: { first: 50 } }),
    admin.graphql(GET_THEME),
    prisma.managedScript.findMany({ where: { shop: session.shop, enabled: true } })
  ]);
  const scriptsJson = await scriptsRes.json();
  const filesJson = await filesRes.json();
  const themeJson = await themeRes.json();
  const scriptTags = ((_c = (_b = (_a2 = scriptsJson.data) == null ? void 0 : _a2.scriptTags) == null ? void 0 : _b.edges) == null ? void 0 : _c.map(
    (e) => e.node.src
  )) || [];
  const allScriptSources = [...scriptTags, ...managedScripts.map((s) => s.name)];
  const appImpacts = estimateAppImpacts(allScriptSources);
  const files = ((_f = (_e = (_d = filesJson.data) == null ? void 0 : _d.files) == null ? void 0 : _e.edges) == null ? void 0 : _f.length) || 0;
  const theme = (_j = (_i = (_h = (_g = themeJson.data) == null ? void 0 : _g.themes) == null ? void 0 : _h.edges) == null ? void 0 : _i[0]) == null ? void 0 : _j.node;
  return {
    metrics: {
      images: files,
      scripts: scriptTags.length + managedScripts.length,
      fonts: 0,
      css: 0,
      js: scriptTags.length,
      apps: appImpacts.length
    },
    themeName: (theme == null ? void 0 : theme.name) || "—",
    appImpacts,
    managedScripts: managedScripts.length
  };
};
function Performance() {
  const { metrics, themeName, appImpacts } = useLoaderData();
  const impactTone = (impact) => impact === "high" ? "critical" : impact === "medium" ? "warning" : "success";
  const rows = appImpacts.map((app) => {
    var _a2;
    return [
      app.name,
      `${app.estimatedMs}ms`,
      /* @__PURE__ */ jsx(Badge, { tone: impactTone(app.impact), children: app.impact }, app.name),
      ((_a2 = app.scripts[0]) == null ? void 0 : _a2.slice(0, 50)) || "—"
    ];
  });
  return /* @__PURE__ */ jsx(Page, { title: "Performance Analyzer", subtitle: `Tema: ${themeName}`, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Análise baseada em scripts detectados e apps instalados. Impactos são estimativas." }),
    /* @__PURE__ */ jsx(Grid, { children: [
      { label: "Imagens", value: metrics.images },
      { label: "Scripts", value: metrics.scripts },
      { label: "Apps analisados", value: metrics.apps }
    ].map((m) => /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: m.label }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingLg", fontWeight: "bold", children: m.value })
    ] }) }) }, m.label)) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "App Impact Scanner" }),
      rows.length > 0 ? /* @__PURE__ */ jsx(
        DataTable,
        {
          columnContentTypes: ["text", "numeric", "text", "text"],
          headings: ["App/Script", "Impacto estimado", "Nível", "Fonte"],
          rows
        }
      ) : /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Nenhum script de terceiros detectado." })
    ] }) })
  ] }) });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Performance,
  loader: loader$e
}, Symbol.toStringTag, { value: "Module" }));
const loader$d = async ({ request }) => {
  var _a2, _b, _c;
  const { admin } = await authenticate.admin(request);
  const [themeAudit, scriptsRes] = await Promise.all([
    analyzeTheme(admin),
    admin.graphql(GET_SCRIPT_TAGS)
  ]);
  const scriptsJson = await scriptsRes.json();
  const scriptSources = ((_c = (_b = (_a2 = scriptsJson.data) == null ? void 0 : _a2.scriptTags) == null ? void 0 : _b.edges) == null ? void 0 : _c.map(
    (e) => e.node.src
  )) || [];
  const appImpacts = estimateAppImpacts(scriptSources);
  return { themeAudit, appImpacts };
};
function ThemeAudit() {
  const { themeAudit, appImpacts } = useLoaderData();
  const assetRows = themeAudit.heavyAssets.map((a) => [
    a.filename,
    `${Math.round(a.size / 1024)} KB`,
    a.size > 2e5 ? "Alto" : "Médio"
  ]);
  const appRows = appImpacts.map((a) => [
    a.name,
    `${a.estimatedMs}ms`,
    a.impact === "high" ? "Alto impacto" : a.impact === "medium" ? "Médio impacto" : "Baixo impacto"
  ]);
  return /* @__PURE__ */ jsx(Page, { title: "Theme Audit", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Grid, { children: [
      { label: "Total de assets", value: themeAudit.totalAssets },
      { label: "Arquivos CSS", value: themeAudit.totalCss },
      { label: "Arquivos JS", value: themeAudit.totalJs },
      { label: "Assets pesados", value: themeAudit.heavyAssets.length }
    ].map((s) => /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: s.label }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingLg", fontWeight: "bold", children: s.value })
    ] }) }) }, s.label)) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Recomendações" }),
      /* @__PURE__ */ jsx(List, { type: "bullet", children: themeAudit.recommendations.map((r) => /* @__PURE__ */ jsx(List.Item, { children: r }, r)) })
    ] }) }),
    assetRows.length > 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
      DataTable,
      {
        columnContentTypes: ["text", "numeric", "text"],
        headings: ["Asset", "Tamanho", "Impacto"],
        rows: assetRows
      }
    ) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "App Impact Scanner" }),
      /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Apps que injetam código no tema" }),
      appRows.length > 0 ? /* @__PURE__ */ jsx(
        DataTable,
        {
          columnContentTypes: ["text", "numeric", "text"],
          headings: ["App", "Impacto estimado", "Ranking"],
          rows: appRows
        }
      ) : /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Nenhum app de terceiros detectado via script tags." })
    ] }) })
  ] }) });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ThemeAudit,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
const loader$c = async ({ request }) => {
  var _a2, _b, _c;
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_PAGES_SEO, {
    variables: { first: 50 }
  });
  const json = await response.json();
  const pages = ((_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.pages) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  const allIssues = pages.flatMap((p) => auditPage(p));
  const score = calculateResourceScore(allIssues, pages.length * 4);
  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "page", fixed: false },
    take: 50
  });
  return { count: pages.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};
function PagesSeo() {
  const { count, score, issues } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Pages SEO", subtitle: `${count} páginas analisadas`, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Score de Páginas", score }) }) }),
    /* @__PURE__ */ jsx(IssuesTable, { issues: issues.map((i, idx) => ({ ...i, id: i.id || String(idx) })), title: "Problemas em Páginas" })
  ] }) });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PagesSeo,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
const UPDATE_PRODUCT_SEO = `#graphql
  mutation UpdateProductSeo($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        handle
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const UPDATE_COLLECTION_SEO = `#graphql
  mutation UpdateCollectionSeo($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        title
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const UPDATE_MEDIA_ALT = `#graphql
  mutation UpdateMediaAlt($input: [FileUpdateInput!]!) {
    fileUpdate(files: $input) {
      files {
        ... on MediaImage {
          id
          alt
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const CREATE_URL_REDIRECT = `#graphql
  mutation CreateUrlRedirect($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect {
        id
        path
        target
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const DELETE_URL_REDIRECT = `#graphql
  mutation DeleteUrlRedirect($id: ID!) {
    urlRedirectDelete(id: $id) {
      deletedUrlRedirectId
      userErrors {
        field
        message
      }
    }
  }
`;
const CREATE_METAFIELD = `#graphql
  mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;
const loader$b = async ({ request }) => {
  var _a2, _b, _c;
  const { admin, session } = await authenticate.admin(request);
  const [shopifyRedirects, localRedirects] = await Promise.all([
    admin.graphql(GET_URL_REDIRECTS, { variables: { first: 50 } }),
    prisma.redirect.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" } })
  ]);
  const json = await shopifyRedirects.json();
  const shopify2 = ((_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.urlRedirects) == null ? void 0 : _b.edges) == null ? void 0 : _c.map(
    (e) => e.node
  )) || [];
  return { shopifyRedirects: shopify2, localRedirects };
};
const action$7 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "create") {
    const fromPath = formData.get("fromPath");
    const toPath = formData.get("toPath");
    const type = parseInt(formData.get("type")) || 301;
    await admin.graphql(CREATE_URL_REDIRECT, {
      variables: { urlRedirect: { path: fromPath, target: toPath } }
    });
    await prisma.redirect.create({
      data: { shop: session.shop, fromPath, toPath, type }
    });
  }
  if (intent === "delete") {
    const id = formData.get("id");
    await admin.graphql(DELETE_URL_REDIRECT, { variables: { id } }).catch(() => {
    });
    await prisma.redirect.delete({ where: { id: formData.get("localId") } }).catch(() => {
    });
  }
  if (intent === "import_csv") {
    const csv = formData.get("csv");
    const lines = csv.split("\n").filter(Boolean);
    let imported = 0;
    for (const line of lines.slice(1)) {
      const [fromPath, toPath, typeStr] = line.split(",").map((s) => s.trim());
      if (fromPath && toPath) {
        await admin.graphql(CREATE_URL_REDIRECT, {
          variables: { urlRedirect: { path: fromPath, target: toPath } }
        }).catch(() => {
        });
        await prisma.redirect.create({
          data: {
            shop: session.shop,
            fromPath,
            toPath,
            type: parseInt(typeStr) || 301
          }
        }).catch(() => {
        });
        imported++;
      }
    }
    return { imported };
  }
  if (intent === "export") {
    const redirects = await prisma.redirect.findMany({ where: { shop: session.shop } });
    const csv = "from,to,type\n" + redirects.map((r) => `${r.fromPath},${r.toPath},${r.type}`).join("\n");
    return { csv };
  }
  return { success: true };
};
function Redirects() {
  var _a2, _b;
  const { shopifyRedirects, localRedirects } = useLoaderData();
  const fetcher = useFetcher();
  const [modalOpen, setModalOpen] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [form, setForm] = useState({ fromPath: "", toPath: "", type: "301" });
  const [csvContent, setCsvContent] = useState("from,to,type\n/old-page,/new-page,301");
  const allRedirects = [
    ...shopifyRedirects.map((r) => ({
      id: r.id,
      from: r.path,
      to: r.target,
      type: 301,
      source: "shopify"
    })),
    ...localRedirects.map((r) => ({
      id: r.id,
      from: r.fromPath,
      to: r.toPath,
      type: r.type,
      source: "local"
    }))
  ];
  const rows = allRedirects.map((r) => [
    r.from,
    r.to,
    /* @__PURE__ */ jsx(Badge, { tone: r.type === 301 ? "info" : "warning", children: r.type }, `type-${r.id}`),
    r.source
  ]);
  return /* @__PURE__ */ jsxs(
    Page,
    {
      title: "Redirect Manager",
      primaryAction: { content: "Novo Redirect", onAction: () => setModalOpen(true) },
      secondaryActions: [
        { content: "Importar CSV", onAction: () => setImportModal(true) },
        {
          content: "Exportar CSV",
          onAction: () => fetcher.submit({ intent: "export" }, { method: "POST" })
        }
      ],
      children: [
        /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
          ((_a2 = fetcher.data) == null ? void 0 : _a2.imported) !== void 0 && /* @__PURE__ */ jsxs(Banner, { tone: "success", children: [
            fetcher.data.imported,
            " redirects importados."
          ] }),
          ((_b = fetcher.data) == null ? void 0 : _b.csv) && /* @__PURE__ */ jsx(Banner, { tone: "info", children: /* @__PURE__ */ jsx("pre", { style: { whiteSpace: "pre-wrap", fontSize: 12 }, children: fetcher.data.csv }) }),
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
            DataTable,
            {
              columnContentTypes: ["text", "text", "text", "text"],
              headings: ["De", "Para", "Tipo", "Origem"],
              rows
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: modalOpen,
            onClose: () => setModalOpen(false),
            title: "Novo Redirect",
            primaryAction: {
              content: "Criar",
              onAction: () => {
                fetcher.submit({ intent: "create", ...form }, { method: "POST" });
                setModalOpen(false);
              }
            },
            children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsxs(FormLayout, { children: [
              /* @__PURE__ */ jsx(TextField, { label: "De (path)", value: form.fromPath, onChange: (v) => setForm({ ...form, fromPath: v }), autoComplete: "off" }),
              /* @__PURE__ */ jsx(TextField, { label: "Para (URL ou path)", value: form.toPath, onChange: (v) => setForm({ ...form, toPath: v }), autoComplete: "off" }),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Tipo",
                  options: [
                    { label: "301 — Permanente", value: "301" },
                    { label: "302 — Temporário", value: "302" }
                  ],
                  value: form.type,
                  onChange: (v) => setForm({ ...form, type: v })
                }
              )
            ] }) })
          }
        ),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: importModal,
            onClose: () => setImportModal(false),
            title: "Importar CSV",
            primaryAction: {
              content: "Importar",
              onAction: () => {
                fetcher.submit({ intent: "import_csv", csv: csvContent }, { method: "POST" });
                setImportModal(false);
              }
            },
            children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsx(
              TextField,
              {
                label: "Conteúdo CSV",
                value: csvContent,
                onChange: setCsvContent,
                multiline: 8,
                autoComplete: "off",
                helpText: "Formato: from,to,type"
              }
            ) })
          }
        )
      ]
    }
  );
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: Redirects,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
const ACTIONS = [
  { id: "generate_alt", label: "Gerar ALT para todas as imagens" },
  { id: "generate_meta_descriptions", label: "Gerar Meta Descriptions" },
  { id: "generate_seo_titles", label: "Gerar SEO Titles" },
  { id: "fix_handles", label: "Corrigir Handles" },
  { id: "update_schema", label: "Atualizar Schema" },
  { id: "generate_collection_seo", label: "Otimizar Coleções" }
];
function BulkActionsPanel({ onAction, loading, lastResult }) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Correção em Massa" }),
    /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Aplique otimizações em lote via GraphQL Admin API." }),
    lastResult && /* @__PURE__ */ jsxs(Banner, { tone: "success", children: [
      lastResult.updated,
      " recursos atualizados (",
      lastResult.action,
      ")"
    ] }),
    /* @__PURE__ */ jsx(ButtonGroup, { children: ACTIONS.map((action2) => /* @__PURE__ */ jsx(
      Button,
      {
        onClick: () => onAction(action2.id),
        loading,
        size: "slim",
        children: action2.label
      },
      action2.id
    )) })
  ] }) });
}
const SUGGESTIONS = [
  "Quais produtos possuem pior SEO?",
  "Como melhorar a velocidade da homepage?",
  "Quais páginas não possuem meta description?",
  "Qual app está mais impactando performance?"
];
function AIAssistantPanel({ onAsk, answer, loading }) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "SEO AI Assistant" }),
    /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Perguntas sobre os dados da sua loja." }),
    /* @__PURE__ */ jsx(InlineStack, { gap: "200", wrap: true, children: SUGGESTIONS.map((q) => /* @__PURE__ */ jsx(Button, { onClick: () => onAsk(q), size: "slim", loading, children: q }, q)) }),
    answer && /* @__PURE__ */ jsx(Banner, { tone: "info", children: /* @__PURE__ */ jsx(Text, { as: "p", children: answer }) })
  ] }) });
}
async function logOptimization(shop, action2, resourceType, resourceId, details) {
  await prisma.optimizationLog.create({
    data: { shop, action: action2, resourceType, resourceId, details }
  });
}
async function bulkGenerateAltTexts(shop, admin) {
  var _a2, _b, _c, _d, _e;
  let cursor = null;
  let updated = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_FILES, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const files = (_a2 = json.data) == null ? void 0 : _a2.files;
    if (!files) break;
    const toUpdate = [];
    for (const edge of files.edges) {
      const node = edge.node;
      if (node.id && !node.alt) {
        const altFromUrl = (_e = (_d = (_c = (_b = node.image) == null ? void 0 : _b.url) == null ? void 0 : _c.split("/").pop()) == null ? void 0 : _d.split(".")[0]) == null ? void 0 : _e.replace(/-/g, " ");
        toUpdate.push({
          id: node.id,
          alt: generateAltText(altFromUrl || "Produto", "imagem otimizada")
        });
      }
    }
    if (toUpdate.length > 0) {
      await admin.graphql(UPDATE_MEDIA_ALT, {
        variables: {
          input: toUpdate.map((f) => ({ id: f.id, alt: f.alt }))
        }
      });
      updated += toUpdate.length;
      for (const f of toUpdate) {
        await logOptimization(shop, "generate_alt", "file", f.id);
      }
    }
    hasNext = files.pageInfo.hasNextPage;
    cursor = files.pageInfo.endCursor;
    if (updated >= 200) break;
  }
  return { updated };
}
async function bulkGenerateMetaDescriptions(shop, admin) {
  var _a2, _b, _c;
  let cursor = null;
  let updated = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const products = (_a2 = json.data) == null ? void 0 : _a2.products;
    if (!products) break;
    for (const edge of products.edges) {
      const product = edge.node;
      if (!((_b = product.seo) == null ? void 0 : _b.description)) {
        const desc = generateMetaDescription(product.title, product.descriptionHtml);
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: {
              id: product.id,
              seo: { title: ((_c = product.seo) == null ? void 0 : _c.title) || product.title, description: desc }
            }
          }
        });
        updated++;
        await logOptimization(shop, "generate_meta_description", "product", product.id);
      }
    }
    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 100) break;
  }
  return { updated };
}
async function bulkGenerateSeoTitles(shop, admin) {
  var _a2, _b, _c;
  let cursor = null;
  let updated = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const products = (_a2 = json.data) == null ? void 0 : _a2.products;
    if (!products) break;
    for (const edge of products.edges) {
      const product = edge.node;
      if (!((_b = product.seo) == null ? void 0 : _b.title)) {
        const title = generateSeoTitle(product.title);
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: {
              id: product.id,
              seo: {
                title,
                description: ((_c = product.seo) == null ? void 0 : _c.description) || generateMetaDescription(product.title)
              }
            }
          }
        });
        updated++;
        await logOptimization(shop, "generate_seo_title", "product", product.id);
      }
    }
    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 100) break;
  }
  return { updated };
}
async function bulkFixHandles(shop, admin) {
  var _a2;
  let cursor = null;
  let updated = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_PRODUCTS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const products = (_a2 = json.data) == null ? void 0 : _a2.products;
    if (!products) break;
    for (const edge of products.edges) {
      const product = edge.node;
      const idealHandle = generateSeoHandle(product.title);
      if (product.handle !== idealHandle && product.handle.includes("_")) {
        await admin.graphql(UPDATE_PRODUCT_SEO, {
          variables: {
            input: { id: product.id, handle: idealHandle }
          }
        });
        updated++;
        await logOptimization(shop, "fix_handle", "product", product.id, idealHandle);
      }
    }
    hasNext = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
    if (updated >= 50) break;
  }
  return { updated };
}
async function bulkUpdateSchema(shop, admin) {
  const schemaTypes = ["Product", "Organization", "BreadcrumbList", "FAQPage"];
  let updated = 0;
  for (const schemaType of schemaTypes) {
    await prisma.schemaConfig.upsert({
      where: { shop_schemaType: { shop, schemaType } },
      create: { shop, schemaType, enabled: true, status: "installed" },
      update: { enabled: true, status: "installed" }
    });
    await admin.graphql(CREATE_METAFIELD, {
      variables: {
        metafields: [
          {
            namespace: "dreams_seo",
            key: `schema_${schemaType.toLowerCase()}`,
            type: "json",
            value: JSON.stringify({ enabled: true, type: schemaType }),
            ownerId: shop
          }
        ]
      }
    }).catch(() => {
    });
    updated++;
    await logOptimization(shop, "update_schema", "schema", schemaType);
  }
  return { updated };
}
async function bulkGenerateCollectionSeo(shop, admin) {
  var _a2, _b, _c, _d, _e;
  let cursor = null;
  let updated = 0;
  let hasNext = true;
  while (hasNext) {
    const response = await admin.graphql(GET_COLLECTIONS_SEO, {
      variables: { first: 50, after: cursor }
    });
    const json = await response.json();
    const collections = (_a2 = json.data) == null ? void 0 : _a2.collections;
    if (!collections) break;
    for (const edge of collections.edges) {
      const collection = edge.node;
      if (!((_b = collection.seo) == null ? void 0 : _b.title) || !((_c = collection.seo) == null ? void 0 : _c.description)) {
        await admin.graphql(UPDATE_COLLECTION_SEO, {
          variables: {
            input: {
              id: collection.id,
              seo: {
                title: ((_d = collection.seo) == null ? void 0 : _d.title) || generateSeoTitle(collection.title),
                description: ((_e = collection.seo) == null ? void 0 : _e.description) || generateMetaDescription(collection.title, collection.descriptionHtml)
              }
            }
          }
        });
        updated++;
        await logOptimization(shop, "generate_collection_seo", "collection", collection.id);
      }
    }
    hasNext = collections.pageInfo.hasNextPage;
    cursor = collections.pageInfo.endCursor;
  }
  return { updated };
}
async function runBulkAction(shop, admin, action2) {
  switch (action2) {
    case "generate_alt":
      return bulkGenerateAltTexts(shop, admin);
    case "generate_meta_descriptions":
      return bulkGenerateMetaDescriptions(shop, admin);
    case "generate_seo_titles":
      return bulkGenerateSeoTitles(shop, admin);
    case "fix_handles":
      return bulkFixHandles(shop, admin);
    case "update_schema":
      return bulkUpdateSchema(shop, admin);
    case "generate_collection_seo":
      return bulkGenerateCollectionSeo(shop, admin);
    default:
      throw new Error(`Ação desconhecida: ${action2}`);
  }
}
const loader$a = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const issues = await prisma.auditIssue.findMany({
    where: { shop, fixed: false },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100
  });
  const byType = {
    product: issues.filter((i) => i.resourceType === "product"),
    collection: issues.filter((i) => i.resourceType === "collection"),
    page: issues.filter((i) => i.resourceType === "page"),
    article: issues.filter((i) => i.resourceType === "article")
  };
  return {
    issues,
    scores: {
      products: calculateResourceScore(byType.product, Math.max(byType.product.length, 1) * 8),
      collections: calculateResourceScore(byType.collection, Math.max(byType.collection.length, 1) * 5),
      pages: calculateResourceScore(byType.page, Math.max(byType.page.length, 1) * 4),
      articles: calculateResourceScore(byType.article, Math.max(byType.article.length, 1) * 5)
    },
    counts: {
      products: byType.product.length,
      collections: byType.collection.length,
      pages: byType.page.length,
      articles: byType.article.length
    }
  };
};
const action$6 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "run_audit") {
    await runFullAudit(session.shop, admin);
    return { success: true };
  }
  if (intent === "bulk_action") {
    const actionType = formData.get("action");
    const result = await runBulkAction(session.shop, admin, actionType);
    return { success: true, bulk: { action: actionType, updated: result.updated } };
  }
  return { success: false };
};
function SeoAudit() {
  var _a2, _b;
  const { issues, scores, counts } = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "SEO Audit",
      primaryAction: {
        content: "Escanear Loja",
        loading: isLoading,
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        ((_a2 = fetcher.data) == null ? void 0 : _a2.success) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Auditoria atualizada!" }),
        /* @__PURE__ */ jsxs(Grid, { children: [
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Produtos", score: scores.products, description: `${counts.products} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Coleções", score: scores.collections, description: `${counts.collections} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Páginas", score: scores.pages, description: `${counts.pages} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Blog", score: scores.articles, description: `${counts.articles} problemas` }) })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
          /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Verificações Realizadas" }),
          /* @__PURE__ */ jsx(BlockStack, { gap: "100", children: [
            "Meta Title ausente",
            "Meta Description ausente",
            "Título muito curto/longo",
            "Handle ruim",
            "ALT ausente",
            "Conteúdo curto",
            "Headings ausentes",
            "Links internos",
            "Schema Article"
          ].map((check) => /* @__PURE__ */ jsx(Badge, { tone: "info", children: check }, check)) })
        ] }) }),
        /* @__PURE__ */ jsxs(Layout, { children: [
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(IssuesTable, { issues }) }),
          /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(
            BulkActionsPanel,
            {
              loading: isLoading,
              lastResult: ((_b = fetcher.data) == null ? void 0 : _b.bulk) || null,
              onAction: (action2) => fetcher.submit({ intent: "bulk_action", action: action2 }, { method: "POST" })
            }
          ) })
        ] })
      ] })
    }
  );
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: SeoAudit,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const loader$9 = async ({ request }) => {
  var _a2, _b;
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_BLOGS_SEO, {
    variables: { first: 10 }
  });
  const json = await response.json();
  const blogs = ((_b = (_a2 = json.data) == null ? void 0 : _a2.blogs) == null ? void 0 : _b.edges) || [];
  const articles = blogs.flatMap(
    (b) => b.node.articles.edges.map((e) => e.node)
  );
  const allIssues = articles.flatMap((a) => auditArticle(a));
  const score = calculateResourceScore(allIssues, articles.length * 5);
  const dbIssues = await prisma.auditIssue.findMany({
    where: { shop: session.shop, resourceType: "article", fixed: false },
    take: 50
  });
  return { count: articles.length, score, issues: dbIssues.length ? dbIssues : allIssues.slice(0, 50) };
};
function BlogSeo() {
  const { count, score, issues } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Blog SEO", subtitle: `${count} artigos analisados`, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Grid, { children: /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Score do Blog", score }) }) }),
    /* @__PURE__ */ jsx(IssuesTable, { issues: issues.map((i, idx) => ({ ...i, id: i.id || String(idx) })), title: "Problemas em Artigos" })
  ] }) });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: BlogSeo,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const loader$8 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return { settings };
};
const action$5 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const settings = await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
      delayJsEnabled: formData.get("delayJsEnabled") === "true",
      dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
      preconnectEnabled: formData.get("preconnectEnabled") === "true",
      fontOptimization: formData.get("fontOptimization") === "true",
      schemaInjection: formData.get("schemaInjection") === "true",
      scriptManagerEnabled: formData.get("scriptManagerEnabled") === "true",
      redirectManagerEnabled: formData.get("redirectManagerEnabled") === "true"
    }
  });
  return { success: true, settings };
};
function Settings() {
  var _a2, _b;
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const s = ((_a2 = fetcher.data) == null ? void 0 : _a2.settings) || settings;
  const save = (key, value) => {
    fetcher.submit(
      {
        lazyLoadEnabled: String(s.lazyLoadEnabled),
        delayJsEnabled: String(s.delayJsEnabled),
        dnsPrefetchEnabled: String(s.dnsPrefetchEnabled),
        preconnectEnabled: String(s.preconnectEnabled),
        fontOptimization: String(s.fontOptimization),
        schemaInjection: String(s.schemaInjection),
        scriptManagerEnabled: String(s.scriptManagerEnabled),
        redirectManagerEnabled: String(s.redirectManagerEnabled),
        [key]: String(value)
      },
      { method: "POST" }
    );
  };
  return /* @__PURE__ */ jsx(Page, { title: "Settings", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    ((_b = fetcher.data) == null ? void 0 : _b.success) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Configurações salvas!" }),
    /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Performance" }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Lazy Load", checked: s.lazyLoadEnabled, onChange: (v) => save("lazyLoadEnabled", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Delay JS", checked: s.delayJsEnabled, onChange: (v) => save("delayJsEnabled", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "DNS Prefetch", checked: s.dnsPrefetchEnabled, onChange: (v) => save("dnsPrefetchEnabled", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Preconnect", checked: s.preconnectEnabled, onChange: (v) => save("preconnectEnabled", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Font Optimization", checked: s.fontOptimization, onChange: (v) => save("fontOptimization", v) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Módulos" }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Schema Injection", checked: s.schemaInjection, onChange: (v) => save("schemaInjection", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Script Manager", checked: s.scriptManagerEnabled, onChange: (v) => save("scriptManagerEnabled", v) }),
        /* @__PURE__ */ jsx(Checkbox, { label: "Redirect Manager", checked: s.redirectManagerEnabled, onChange: (v) => save("redirectManagerEnabled", v) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Theme App Extension" }),
      /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Ative os App Embeds em Online Store → Themes → Customize → App embeds: Dreams SEO Pro Scripts, Schema, Performance e Resource Hints." })
    ] }) })
  ] }) });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: Settings,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const PIXEL_TEMPLATES = {
  meta_pixel: {
    name: "Meta Pixel",
    type: "pixel",
    placement: "head",
    content: `<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{PIXEL_ID}}');
fbq('track', 'PageView');
<\/script>`
  },
  ga4: {
    name: "Google Analytics 4",
    type: "javascript",
    placement: "head",
    content: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id={{MEASUREMENT_ID}}"><\/script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','{{MEASUREMENT_ID}}');
<\/script>`
  },
  gtm: {
    name: "Google Tag Manager",
    type: "html",
    placement: "body_start",
    content: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{{CONTAINER_ID}}');<\/script>`
  },
  tiktok: {
    name: "TikTok Pixel",
    type: "pixel",
    placement: "head",
    content: `<!-- TikTok Pixel -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('{{PIXEL_ID}}');ttq.page();}(window,document,'ttq');
<\/script>`
  },
  pinterest: {
    name: "Pinterest Pixel",
    type: "pixel",
    placement: "head",
    content: `<!-- Pinterest Tag -->
<script>
!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load','{{TAG_ID}}');pintrk('page');
<\/script>`
  },
  clarity: {
    name: "Microsoft Clarity",
    type: "javascript",
    placement: "head",
    content: `<!-- Microsoft Clarity -->
<script type="text/javascript">
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","{{PROJECT_ID}}");
<\/script>`
  },
  snapchat: {
    name: "Snapchat Pixel",
    type: "pixel",
    placement: "head",
    content: `<!-- Snapchat Pixel -->
<script type='text/javascript'>
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init','{{PIXEL_ID}}');snaptr('track','PAGE_VIEW');
<\/script>`
  }
};
const SCHEMA_TYPES = [
  { type: "Product", label: "Product", description: "Schema para páginas de produto" },
  { type: "FAQPage", label: "FAQ", description: "Schema para perguntas frequentes" },
  { type: "Organization", label: "Organization", description: "Schema da organização/loja" },
  { type: "BreadcrumbList", label: "Breadcrumb", description: "Schema de navegação breadcrumb" },
  { type: "Article", label: "Article", description: "Schema para artigos de blog" },
  { type: "CollectionPage", label: "Collection", description: "Schema para coleções" }
];
const DELAY_JS_TARGETS = [
  "analytics",
  "hotjar",
  "clarity",
  "facebook_pixel",
  "tiktok_pixel",
  "pinterest_pixel",
  "custom"
];
const NAV_ITEMS = [
  { label: "Dashboard", url: "/app", icon: "HomeIcon" },
  { label: "SEO Audit", url: "/app/seo-audit", icon: "SearchIcon" },
  { label: "Products SEO", url: "/app/products-seo", icon: "ProductIcon" },
  { label: "Collections SEO", url: "/app/collections-seo", icon: "CollectionIcon" },
  { label: "Pages SEO", url: "/app/pages-seo", icon: "PageIcon" },
  { label: "Blog SEO", url: "/app/blog-seo", icon: "BlogIcon" },
  { label: "Images", url: "/app/images", icon: "ImageIcon" },
  { label: "Performance", url: "/app/performance", icon: "GaugeIcon" },
  { label: "Cache", url: "/app/cache", icon: "DatabaseIcon" },
  { label: "Script Manager", url: "/app/scripts", icon: "CodeIcon" },
  { label: "Theme Audit", url: "/app/theme-audit", icon: "ThemeIcon" },
  { label: "Schema", url: "/app/schema", icon: "SchemaIcon" },
  { label: "Broken Links", url: "/app/broken-links", icon: "LinkIcon" },
  { label: "Redirects", url: "/app/redirects", icon: "RedirectIcon" },
  { label: "Settings", url: "/app/settings", icon: "SettingsIcon" }
];
const loader$7 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const scripts = await prisma.managedScript.findMany({
    where: { shop: session.shop },
    orderBy: { priority: "desc" }
  });
  return { scripts };
};
const action$4 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "create") {
    await prisma.managedScript.create({
      data: {
        shop: session.shop,
        name: formData.get("name"),
        scriptType: formData.get("scriptType"),
        placement: formData.get("placement"),
        content: formData.get("content"),
        displayRule: formData.get("displayRule"),
        includeUrls: formData.get("includeUrls") || null,
        excludeUrls: formData.get("excludeUrls") || null
      }
    });
  }
  if (intent === "toggle") {
    const id = formData.get("id");
    const script = await prisma.managedScript.findUnique({ where: { id } });
    if (script) {
      await prisma.managedScript.update({
        where: { id },
        data: { enabled: !script.enabled }
      });
    }
  }
  if (intent === "delete") {
    await prisma.managedScript.delete({ where: { id: formData.get("id") } });
  }
  if (intent === "add_pixel") {
    const templateKey = formData.get("template");
    const template = PIXEL_TEMPLATES[templateKey];
    if (template) {
      await prisma.managedScript.create({
        data: {
          shop: session.shop,
          name: template.name,
          scriptType: template.type,
          placement: template.placement,
          content: template.content,
          displayRule: "all"
        }
      });
    }
  }
  return { success: true };
};
function ScriptManager() {
  var _a2, _b;
  const { scripts } = useLoaderData();
  const fetcher = useFetcher();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [form, setForm] = useState({
    name: "",
    scriptType: "javascript",
    placement: "body_end",
    content: "",
    displayRule: "all",
    includeUrls: "",
    excludeUrls: ""
  });
  const rows = scripts.map((s) => [
    s.name,
    s.scriptType,
    s.placement,
    s.displayRule,
    /* @__PURE__ */ jsx(Badge, { tone: s.enabled ? "success" : void 0, children: s.enabled ? "Ativo" : "Inativo" }, s.id),
    /* @__PURE__ */ jsx(Button, { size: "slim", onClick: () => fetcher.submit({ intent: "toggle", id: s.id }, { method: "POST" }), children: s.enabled ? "Desativar" : "Ativar" }, `toggle-${s.id}`)
  ]);
  const pixelTabs = Object.entries(PIXEL_TEMPLATES).map(([key, t]) => ({
    id: key,
    content: t.name,
    panelID: key
  }));
  return /* @__PURE__ */ jsxs(
    Page,
    {
      title: "Script Manager",
      subtitle: "Gerenciador interno de scripts, pixels e tags",
      primaryAction: { content: "Novo Script", onAction: () => setModalOpen(true) },
      children: [
        /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
          ((_a2 = fetcher.data) == null ? void 0 : _a2.success) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Operação realizada!" }),
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(Tabs, { tabs: pixelTabs, selected: selectedTab, onSelect: setSelectedTab, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
            /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Templates prontos para pixels. Configure o ID no conteúdo do script após adicionar." }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => fetcher.submit(
                  { intent: "add_pixel", template: pixelTabs[selectedTab].id },
                  { method: "POST" }
                ),
                children: [
                  "Adicionar ",
                  (_b = pixelTabs[selectedTab]) == null ? void 0 : _b.content
                ]
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
            DataTable,
            {
              columnContentTypes: ["text", "text", "text", "text", "text", "text"],
              headings: ["Nome", "Tipo", "Posição", "Regra", "Status", "Ação"],
              rows
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: modalOpen,
            onClose: () => setModalOpen(false),
            title: "Novo Script",
            primaryAction: {
              content: "Salvar",
              onAction: () => {
                fetcher.submit({ intent: "create", ...form }, { method: "POST" });
                setModalOpen(false);
              }
            },
            children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsxs(FormLayout, { children: [
              /* @__PURE__ */ jsx(TextField, { label: "Nome", value: form.name, onChange: (v) => setForm({ ...form, name: v }), autoComplete: "off" }),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Tipo",
                  options: [
                    { label: "HTML", value: "html" },
                    { label: "CSS", value: "css" },
                    { label: "JavaScript", value: "javascript" },
                    { label: "JSON-LD", value: "json_ld" },
                    { label: "Pixel", value: "pixel" }
                  ],
                  value: form.scriptType,
                  onChange: (v) => setForm({ ...form, scriptType: v })
                }
              ),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Posição",
                  options: [
                    { label: "Header (<head>)", value: "head" },
                    { label: "Body Start", value: "body_start" },
                    { label: "Body End", value: "body_end" }
                  ],
                  value: form.placement,
                  onChange: (v) => setForm({ ...form, placement: v })
                }
              ),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Regra de exibição",
                  options: [
                    { label: "Todas as páginas", value: "all" },
                    { label: "Homepage", value: "homepage" },
                    { label: "Produtos", value: "products" },
                    { label: "Coleções", value: "collections" },
                    { label: "Blog", value: "blog" },
                    { label: "URLs específicas", value: "specific_urls" }
                  ],
                  value: form.displayRule,
                  onChange: (v) => setForm({ ...form, displayRule: v })
                }
              ),
              /* @__PURE__ */ jsx(TextField, { label: "Conteúdo", value: form.content, onChange: (v) => setForm({ ...form, content: v }), multiline: 6, autoComplete: "off" })
            ] }) })
          }
        )
      ]
    }
  );
}
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: ScriptManager,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
function MetricsGrid({ metrics }) {
  return /* @__PURE__ */ jsx(Grid, { children: metrics.map((metric) => /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: metric.label }),
    /* @__PURE__ */ jsxs(Text, { as: "p", variant: "headingLg", fontWeight: "bold", children: [
      metric.value,
      metric.suffix && /* @__PURE__ */ jsx(Text, { as: "span", variant: "bodySm", tone: "subdued", children: metric.suffix })
    ] })
  ] }) }) }, metric.label)) });
}
function HistoryChart({ history }) {
  if (history.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Evolução Histórica" }),
      /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Execute uma auditoria para começar a registrar histórico." })
    ] }) });
  }
  const rows = history.slice(0, 10).map((point) => [
    point.date,
    /* @__PURE__ */ jsx(Badge, { tone: point.seoScore >= 70 ? "success" : "warning", children: point.seoScore }, `seo-${point.date}`),
    /* @__PURE__ */ jsx(Badge, { tone: point.performanceScore >= 70 ? "success" : "warning", children: point.performanceScore }, `perf-${point.date}`),
    /* @__PURE__ */ jsx(Badge, { tone: point.technicalScore >= 70 ? "success" : "warning", children: point.technicalScore }, `tech-${point.date}`),
    /* @__PURE__ */ jsx(Badge, { tone: point.optimizationScore >= 70 ? "success" : "warning", children: point.optimizationScore }, `opt-${point.date}`)
  ]);
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Evolução Histórica" }),
      /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
        "Últimas ",
        history.length,
        " auditorias"
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      DataTable,
      {
        columnContentTypes: ["text", "numeric", "numeric", "numeric", "numeric"],
        headings: ["Data", "SEO", "Performance", "Técnico", "Otimização"],
        rows
      }
    )
  ] }) });
}
async function processAIQuery(shop, question) {
  const q = question.toLowerCase();
  const issues = await prisma.auditIssue.findMany({
    where: { shop, fixed: false },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  const latestSnapshot = await prisma.auditSnapshot.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" }
  });
  const scripts = await prisma.managedScript.findMany({
    where: { shop, enabled: true }
  });
  if (q.includes("pior seo") || q.includes("produtos") && q.includes("seo")) {
    const productIssues = groupByResource(issues.filter((i) => i.resourceType === "product"));
    const worst = productIssues.sort((a, b) => b.issues.length - a.issues.length).slice(0, 10);
    return {
      answer: worst.length ? `Encontrei ${worst.length} produtos com problemas de SEO. Os piores são: ${worst.map((p) => `"${p.title}" (${p.issues.length} problemas)`).join(", ")}.` : "Todos os produtos analisados estão com SEO adequado.",
      data: { products: worst }
    };
  }
  if (q.includes("velocidade") || q.includes("performance") || q.includes("homepage")) {
    const perfScore = (latestSnapshot == null ? void 0 : latestSnapshot.performanceScore) ?? 0;
    const weight = (latestSnapshot == null ? void 0 : latestSnapshot.estimatedPageWeight) ?? 0;
    const activeScripts = (latestSnapshot == null ? void 0 : latestSnapshot.activeScripts) ?? scripts.length;
    return {
      answer: `A homepage tem score de performance ${perfScore}/100. Peso estimado: ${weight}KB. ${activeScripts} scripts ativos. Recomendações: ative lazy load, delay JS para analytics, e resource hints nível 2.`,
      data: { performanceScore: perfScore, pageWeight: weight, activeScripts }
    };
  }
  if (q.includes("meta description") || q.includes("descrição")) {
    const missing = issues.filter((i) => i.issueType === "missing_meta_description");
    const byType = {
      products: missing.filter((i) => i.resourceType === "product").length,
      collections: missing.filter((i) => i.resourceType === "collection").length,
      pages: missing.filter((i) => i.resourceType === "page").length
    };
    return {
      answer: `${missing.length} recursos sem meta description: ${byType.products} produtos, ${byType.collections} coleções, ${byType.pages} páginas. Use "Correção em Massa" para gerar automaticamente.`,
      data: { total: missing.length, byType, items: missing.slice(0, 20) }
    };
  }
  if (q.includes("app") && (q.includes("impacto") || q.includes("performance"))) {
    const impacts = [
      { name: "Meta Pixel", ms: 120 },
      { name: "Klaviyo", ms: 90 },
      { name: "Hotjar", ms: 180 },
      { name: "Microsoft Clarity", ms: 75 }
    ];
    const top = impacts.sort((a, b) => b.ms - a.ms)[0];
    return {
      answer: `O app com maior impacto estimado é ${top.name} (~${top.ms}ms). Considere ativar Delay JS para scripts de analytics. Scripts gerenciados ativos: ${scripts.length}.`,
      data: { impacts, managedScripts: scripts.length }
    };
  }
  if (q.includes("link") && q.includes("quebrado")) {
    const broken = await prisma.brokenLink.count({ where: { shop, fixed: false } });
    return {
      answer: broken ? `${broken} links quebrados detectados. Acesse "Broken Links" para ver detalhes e criar redirects.` : "Nenhum link quebrado detectado na última varredura.",
      data: { brokenLinks: broken }
    };
  }
  if (q.includes("alt") || q.includes("imagem")) {
    const missingAlt = issues.filter((i) => i.issueType === "missing_alt");
    return {
      answer: `${missingAlt.length} imagens sem texto ALT. Use "Gerar ALT para todas as imagens" na correção em massa.`,
      data: { count: missingAlt.length, items: missingAlt.slice(0, 15) }
    };
  }
  const seoScore = (latestSnapshot == null ? void 0 : latestSnapshot.seoScore) ?? 0;
  return {
    answer: `Score SEO atual: ${seoScore}/100. Total de ${issues.length} problemas pendentes. Pergunte sobre produtos, performance, meta descriptions, apps ou links quebrados.`,
    data: {
      seoScore,
      issueCount: issues.length,
      snapshot: latestSnapshot
    }
  };
}
function groupByResource(issues) {
  const map = /* @__PURE__ */ new Map();
  for (const issue of issues) {
    const key = issue.resourceId || issue.resourceTitle || "unknown";
    const existing = map.get(key) || { title: issue.resourceTitle || key, issues: [] };
    existing.issues.push(issue);
    map.set(key, existing);
  }
  return Array.from(map.values());
}
const loader$6 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const [latestSnapshot, history, settings] = await Promise.all([
    prisma.auditSnapshot.findFirst({
      where: { shop },
      orderBy: { createdAt: "desc" }
    }),
    getHistoricalScores(shop),
    getOrCreateSettings(shop)
  ]);
  return {
    snapshot: latestSnapshot,
    history: history.map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("pt-BR"),
      seoScore: h.seoScore,
      performanceScore: h.performanceScore,
      technicalScore: h.technicalScore,
      optimizationScore: h.optimizationScore
    })),
    settings
  };
};
const action$3 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "run_audit") {
    const result = await runFullAudit(shop, admin);
    return { success: true, audit: result.scores };
  }
  if (intent === "bulk_action") {
    const actionType = formData.get("action");
    const result = await runBulkAction(shop, admin, actionType);
    return { success: true, bulk: { action: actionType, updated: result.updated } };
  }
  if (intent === "ai_query") {
    const question = formData.get("question");
    const result = await processAIQuery(shop, question);
    return { success: true, ai: result };
  }
  return { success: false };
};
function Dashboard() {
  var _a2, _b, _c, _d, _e;
  const { snapshot, history } = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const scores = snapshot ? {
    seo: snapshot.seoScore,
    performance: snapshot.performanceScore,
    technical: snapshot.technicalScore,
    optimization: snapshot.optimizationScore
  } : { seo: 0, performance: 0, technical: 0, optimization: 0 };
  const metrics = snapshot ? [
    { label: "Produtos sem SEO", value: snapshot.productsWithoutSeo },
    { label: "Imagens sem ALT", value: snapshot.imagesWithoutAlt },
    { label: "Meta Descriptions ausentes", value: snapshot.missingMetaDesc },
    { label: "Schemas ausentes", value: snapshot.missingSchemas },
    { label: "Links quebrados", value: snapshot.brokenLinks },
    { label: "Scripts ativos", value: snapshot.activeScripts },
    { label: "Peso estimado da página", value: snapshot.estimatedPageWeight, suffix: " KB" },
    { label: "Otimizações aplicadas", value: snapshot.totalOptimizations }
  ] : [];
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Dashboard",
      primaryAction: {
        content: "Executar Auditoria",
        loading: isLoading && ((_a2 = fetcher.formData) == null ? void 0 : _a2.get("intent")) === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        !snapshot && /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Execute sua primeira auditoria para ver scores e métricas da loja." }),
        ((_b = fetcher.data) == null ? void 0 : _b.audit) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Auditoria concluída com sucesso!" }),
        /* @__PURE__ */ jsxs(Grid, { children: [
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "SEO Score", score: scores.seo }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Performance Score", score: scores.performance }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Technical Score", score: scores.technical }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Optimization Score", score: scores.optimization }) })
        ] }),
        metrics.length > 0 && /* @__PURE__ */ jsx(MetricsGrid, { metrics }),
        /* @__PURE__ */ jsxs(Layout, { children: [
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(HistoryChart, { history }) }),
          /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
            /* @__PURE__ */ jsx(
              BulkActionsPanel,
              {
                loading: isLoading,
                lastResult: ((_c = fetcher.data) == null ? void 0 : _c.bulk) || null,
                onAction: (action2) => fetcher.submit({ intent: "bulk_action", action: action2 }, { method: "POST" })
              }
            ),
            /* @__PURE__ */ jsx(
              AIAssistantPanel,
              {
                loading: isLoading,
                answer: (_e = (_d = fetcher.data) == null ? void 0 : _d.ai) == null ? void 0 : _e.answer,
                onAsk: (question) => fetcher.submit({ intent: "ai_query", question }, { method: "POST" })
              }
            )
          ] }) })
        ] })
      ] })
    }
  );
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: Dashboard,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({ request }) => {
  var _a2, _b, _c;
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_FILES, {
    variables: { first: 100 }
  });
  const json = await response.json();
  const files = ((_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.files) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  let totalSize = 0;
  let withoutAlt = 0;
  let largeFiles = 0;
  const urlCounts = /* @__PURE__ */ new Map();
  const analyzed = files.map((f) => {
    var _a3, _b2;
    const size = ((_a3 = f.originalSource) == null ? void 0 : _a3.fileSize) || 0;
    totalSize += size;
    if (!f.alt) withoutAlt++;
    if (size > 2e5) largeFiles++;
    const url = ((_b2 = f.image) == null ? void 0 : _b2.url) || "";
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
    const issues = [];
    if (!f.alt) issues.push("Sem ALT");
    if (size > 2e5) issues.push("Arquivo grande");
    if (urlCounts.get(url) > 1) issues.push("Possível duplicata");
    const filename = url.split("/").pop() || "";
    const seoName = generateSeoFilename(filename.replace(/\.[^.]+$/, ""));
    return { id: f.id, url, alt: f.alt, size, issues, seoName };
  });
  const duplicates = analyzed.filter((f) => f.issues.includes("Possível duplicata")).length;
  return {
    files: analyzed,
    stats: {
      total: files.length,
      totalSizeKb: Math.round(totalSize / 1024),
      withoutAlt,
      largeFiles,
      duplicates,
      potentialSavingsKb: Math.round(largeFiles * 50)
    }
  };
};
const action$2 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const result = await runBulkAction(session.shop, admin, "generate_alt");
  return { updated: result.updated };
};
function Images() {
  var _a2;
  const { files, stats } = useLoaderData();
  const fetcher = useFetcher();
  const rows = files.slice(0, 30).map((f) => {
    var _a3;
    return [
      ((_a3 = f.url.split("/").pop()) == null ? void 0 : _a3.slice(0, 30)) || "—",
      f.alt || /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Ausente" }),
      `${Math.round(f.size / 1024)} KB`,
      f.issues.join(", ") || "OK",
      f.seoName
    ];
  });
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Image Optimizer",
      subtitle: "Escaneamento de mídia da Shopify",
      primaryAction: {
        content: "Gerar ALT em massa",
        loading: fetcher.state !== "idle",
        onAction: () => fetcher.submit({}, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        ((_a2 = fetcher.data) == null ? void 0 : _a2.updated) !== void 0 && /* @__PURE__ */ jsxs(Banner, { tone: "success", children: [
          fetcher.data.updated,
          " imagens atualizadas com ALT."
        ] }),
        /* @__PURE__ */ jsx(Grid, { children: [
          { label: "Total de imagens", value: stats.total },
          { label: "Peso total", value: `${stats.totalSizeKb} KB` },
          { label: "Sem ALT", value: stats.withoutAlt },
          { label: "Arquivos grandes", value: stats.largeFiles },
          { label: "Duplicatas", value: stats.duplicates },
          { label: "Economia potencial", value: `${stats.potentialSavingsKb} KB` }
        ].map((s) => /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: s.label }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingLg", fontWeight: "bold", children: s.value })
        ] }) }) }, s.label)) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
          DataTable,
          {
            columnContentTypes: ["text", "text", "numeric", "text", "text"],
            headings: ["Arquivo", "ALT", "Tamanho", "Problemas", "Nome SEO sugerido"],
            rows
          }
        ) })
      ] })
    }
  );
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: Images,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const configs = await prisma.schemaConfig.findMany({
    where: { shop: session.shop }
  });
  const schemas = SCHEMA_TYPES.map((s) => {
    const config = configs.find((c) => c.schemaType === s.type);
    return {
      type: s.type,
      label: s.label,
      description: s.description,
      status: (config == null ? void 0 : config.status) || "absent",
      enabled: (config == null ? void 0 : config.enabled) || false,
      id: config == null ? void 0 : config.id
    };
  });
  return { schemas };
};
const action$1 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const schemaType = formData.get("schemaType");
  const enabled = formData.get("enabled") === "true";
  await prisma.schemaConfig.upsert({
    where: { shop_schemaType: { shop: session.shop, schemaType } },
    create: {
      shop: session.shop,
      schemaType,
      enabled,
      status: enabled ? "installed" : "absent"
    },
    update: { enabled, status: enabled ? "installed" : "absent" }
  });
  return { success: true };
};
const statusBadge = (status) => {
  switch (status) {
    case "installed":
      return /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Instalado" });
    case "invalid":
      return /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Inválido" });
    default:
      return /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Ausente" });
  }
};
function SchemaManager() {
  var _a2;
  const { schemas } = useLoaderData();
  const fetcher = useFetcher();
  const rows = schemas.map((s) => [
    s.label,
    s.description,
    statusBadge(s.enabled ? "installed" : s.status),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => fetcher.submit(
          { schemaType: s.type, enabled: String(!s.enabled) },
          { method: "POST" }
        ),
        style: { background: "none", border: "1px solid #ccc", padding: "4px 12px", borderRadius: 4, cursor: "pointer" },
        children: s.enabled ? "Desativar" : "Ativar via App Embed"
      },
      s.type
    )
  ]);
  return /* @__PURE__ */ jsx(Page, { title: "Schema Manager", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Schemas são injetados via Theme App Extension, sem modificar arquivos do tema." }),
    ((_a2 = fetcher.data) == null ? void 0 : _a2.success) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Schema atualizado!" }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Tipos suportados: Product, FAQ, Organization, Breadcrumb, Article, Collection" }),
      /* @__PURE__ */ jsx(
        DataTable,
        {
          columnContentTypes: ["text", "text", "text", "text"],
          headings: ["Schema", "Descrição", "Status", "Ação"],
          rows
        }
      )
    ] }) })
  ] }) });
}
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: SchemaManager,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return { settings };
};
const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const settings = await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      lazyLoadEnabled: formData.get("lazyLoadEnabled") === "true",
      delayJsEnabled: formData.get("delayJsEnabled") === "true",
      dnsPrefetchEnabled: formData.get("dnsPrefetchEnabled") === "true",
      preconnectEnabled: formData.get("preconnectEnabled") === "true",
      preloadEnabled: formData.get("preloadEnabled") === "true",
      prefetchEnabled: formData.get("prefetchEnabled") === "true",
      fontOptimization: formData.get("fontOptimization") === "true",
      resourceHintsLevel: parseInt(formData.get("resourceHintsLevel")) || 1,
      delayJsTrigger: formData.get("delayJsTrigger") || "scroll"
    }
  });
  return { success: true, settings };
};
function Cache() {
  var _a2, _b;
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const s = ((_a2 = fetcher.data) == null ? void 0 : _a2.settings) || settings;
  const hintLevels = [
    { label: "Nível 1 — Apenas preconnect", value: "1" },
    { label: "Nível 2 — Preconnect + Preload", value: "2" },
    { label: "Nível 3 — Preconnect + Preload + Prefetch", value: "3" }
  ];
  const save = (updates) => {
    const data = {
      lazyLoadEnabled: s.lazyLoadEnabled,
      delayJsEnabled: s.delayJsEnabled,
      dnsPrefetchEnabled: s.dnsPrefetchEnabled,
      preconnectEnabled: s.preconnectEnabled,
      preloadEnabled: s.preloadEnabled,
      prefetchEnabled: s.prefetchEnabled,
      fontOptimization: s.fontOptimization,
      resourceHintsLevel: String(s.resourceHintsLevel),
      delayJsTrigger: s.delayJsTrigger,
      ...updates
    };
    fetcher.submit(data, { method: "POST" });
  };
  return /* @__PURE__ */ jsx(Page, { title: "Cache Engine", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
    /* @__PURE__ */ jsx(Banner, { tone: "info", children: "A Shopify possui CDN próprio. Este módulo otimiza browser cache, resource hints, fontes, lazy load e delay JS via Theme App Extension — sem cache HTML tradicional." }),
    ((_b = fetcher.data) == null ? void 0 : _b.success) && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Configurações salvas!" }),
    /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Resource Hints" }),
        /* @__PURE__ */ jsx(
          Select,
          {
            label: "Nível de Resource Hints",
            options: hintLevels,
            value: String(s.resourceHintsLevel),
            onChange: (v) => save({ resourceHintsLevel: v })
          }
        ),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            label: "DNS Prefetch",
            checked: s.dnsPrefetchEnabled,
            onChange: (v) => save({ dnsPrefetchEnabled: v })
          }
        ),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            label: "Preconnect",
            checked: s.preconnectEnabled,
            onChange: (v) => save({ preconnectEnabled: v })
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Lazy Load Manager" }),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            label: "Ativar Lazy Load (imagens, iframes, vídeos)",
            checked: s.lazyLoadEnabled,
            onChange: (v) => save({ lazyLoadEnabled: v })
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Delay JavaScript" }),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            label: "Ativar Delay JS",
            checked: s.delayJsEnabled,
            onChange: (v) => save({ delayJsEnabled: v })
          }
        ),
        /* @__PURE__ */ jsx(
          Select,
          {
            label: "Executar após",
            options: [
              { label: "Scroll", value: "scroll" },
              { label: "Clique", value: "click" },
              { label: "Interação", value: "interaction" }
            ],
            value: s.delayJsTrigger,
            onChange: (v) => save({ delayJsTrigger: v })
          }
        ),
        /* @__PURE__ */ jsx(List, { type: "bullet", children: DELAY_JS_TARGETS.map((t) => /* @__PURE__ */ jsx(List.Item, { children: t.replace(/_/g, " ") }, t)) })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Font Optimization" }),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            label: "Ativar otimização de fontes (font-display: swap + preload)",
            checked: s.fontOptimization,
            onChange: (v) => save({ fontOptimization: v })
          }
        ),
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Detecta Google Fonts pesadas e aplica font-display: swap automaticamente." })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Critical Resources" }),
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Recomendações geradas com base no tema ativo:" }),
        /* @__PURE__ */ jsxs(List, { type: "bullet", children: [
          /* @__PURE__ */ jsx(List.Item, { children: "Preload da imagem hero above-the-fold" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Preconnect para CDN de fontes e analytics" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Defer em scripts não-críticos via Delay JS" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Lazy load para imagens abaixo da dobra" })
        ] })
      ] }) }) })
    ] })
  ] }) });
}
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Cache,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return login(request);
};
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
function Auth() {
  return null;
}
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Auth,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};
function App() {
  const { apiKey } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider, { isEmbeddedApp: true, apiKey, children: [
    /* @__PURE__ */ jsxs(NavMenu, { children: [
      /* @__PURE__ */ jsx(Link, { to: "/app", rel: "home", children: "Dreams SEO Pro" }),
      NAV_ITEMS.slice(1).map((item) => /* @__PURE__ */ jsx(Link, { to: item.url, children: item.label }, item.url))
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  links,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-CMknqDO7.js", "imports": ["/assets/components-CLFESZVD.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-BfqN5s8q.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/styles-CeHfqj-P.js"], "css": [] }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.collections-seo": { "id": "routes/app.collections-seo", "parentId": "routes/app", "path": "collections-seo", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.collections-seo-DIxjF8cD.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/IssuesTable-BCcvhJp3.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/Page-DD2LAk_5.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.broken-links": { "id": "routes/app.broken-links", "parentId": "routes/app", "path": "broken-links", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.broken-links-uLSLXfhn.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.products-seo": { "id": "routes/app.products-seo", "parentId": "routes/app", "path": "products-seo", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.products-seo-CEI4ecWH.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/IssuesTable-BCcvhJp3.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/Page-DD2LAk_5.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.performance": { "id": "routes/app.performance", "parentId": "routes/app", "path": "performance", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.performance-D1Yujoh9.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.theme-audit": { "id": "routes/app.theme-audit", "parentId": "routes/app", "path": "theme-audit", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.theme-audit-B4hX-S-8.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Grid-DS-mA30M.js", "/assets/List-pElO3EjF.js", "/assets/DataTable-B7gHzMx8.js", "/assets/Banner-DSI8p3T8.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.pages-seo": { "id": "routes/app.pages-seo", "parentId": "routes/app", "path": "pages-seo", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.pages-seo-DShsOFQD.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/IssuesTable-BCcvhJp3.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/Page-DD2LAk_5.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.redirects": { "id": "routes/app.redirects", "parentId": "routes/app", "path": "redirects", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.redirects-bjI3IvRY.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/DataTable-B7gHzMx8.js", "/assets/Modal-hiFJTAoT.js", "/assets/Select-i8UvgvCB.js", "/assets/context-BOEdkLCB.js", "/assets/context-CTnnmAZq.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.seo-audit": { "id": "routes/app.seo-audit", "parentId": "routes/app", "path": "seo-audit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.seo-audit-DEn7zil6.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/IssuesTable-BCcvhJp3.js", "/assets/BulkActions-C0szGupf.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/Grid-DS-mA30M.js", "/assets/Layout-BUIf8GAU.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js", "/assets/DataTable-B7gHzMx8.js"], "css": [] }, "routes/app.blog-seo": { "id": "routes/app.blog-seo", "parentId": "routes/app", "path": "blog-seo", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.blog-seo-ByKT84-K.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/IssuesTable-BCcvhJp3.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/Page-DD2LAk_5.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.settings-B9fQfRbB.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/Layout-BUIf8GAU.js", "/assets/Checkbox-CQQ1_5J2.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.scripts": { "id": "routes/app.scripts", "parentId": "routes/app", "path": "scripts", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.scripts-qd7ePQzE.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/constants-DcaPgTjd.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/context-BOEdkLCB.js", "/assets/Modal-hiFJTAoT.js", "/assets/DataTable-B7gHzMx8.js", "/assets/Select-i8UvgvCB.js", "/assets/context-CTnnmAZq.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-DCQr6d7X.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/ScoreCard-Voa3j3Ro.js", "/assets/Grid-DS-mA30M.js", "/assets/Page-DD2LAk_5.js", "/assets/DataTable-B7gHzMx8.js", "/assets/BulkActions-C0szGupf.js", "/assets/Banner-DSI8p3T8.js", "/assets/Layout-BUIf8GAU.js", "/assets/context-BOEdkLCB.js", "/assets/CSSTransition-DEIVm2wG.js"], "css": [] }, "routes/app.images": { "id": "routes/app.images", "parentId": "routes/app", "path": "images", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.images-CREOpdjP.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/Grid-DS-mA30M.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.schema": { "id": "routes/app.schema", "parentId": "routes/app", "path": "schema", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.schema-T_QTkBY_.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/DataTable-B7gHzMx8.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/app.cache": { "id": "routes/app.cache", "parentId": "routes/app", "path": "cache", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.cache-D_qHZQXc.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/constants-DcaPgTjd.js", "/assets/Page-DD2LAk_5.js", "/assets/Banner-DSI8p3T8.js", "/assets/Layout-BUIf8GAU.js", "/assets/Select-i8UvgvCB.js", "/assets/Checkbox-CQQ1_5J2.js", "/assets/List-pElO3EjF.js", "/assets/context-BOEdkLCB.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-CSxRPO1x.js", "imports": [], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-DROlKVu_.js", "imports": ["/assets/components-CLFESZVD.js", "/assets/styles-CeHfqj-P.js", "/assets/context-BOEdkLCB.js", "/assets/context-CTnnmAZq.js", "/assets/constants-DcaPgTjd.js"], "css": [] } }, "url": "/assets/manifest-4ae5fd8a.js", "version": "4ae5fd8a" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/app.collections-seo": {
    id: "routes/app.collections-seo",
    parentId: "routes/app",
    path: "collections-seo",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app.broken-links": {
    id: "routes/app.broken-links",
    parentId: "routes/app",
    path: "broken-links",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/app.products-seo": {
    id: "routes/app.products-seo",
    parentId: "routes/app",
    path: "products-seo",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/app.performance": {
    id: "routes/app.performance",
    parentId: "routes/app",
    path: "performance",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/app.theme-audit": {
    id: "routes/app.theme-audit",
    parentId: "routes/app",
    path: "theme-audit",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/app.pages-seo": {
    id: "routes/app.pages-seo",
    parentId: "routes/app",
    path: "pages-seo",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/app.redirects": {
    id: "routes/app.redirects",
    parentId: "routes/app",
    path: "redirects",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/app.seo-audit": {
    id: "routes/app.seo-audit",
    parentId: "routes/app",
    path: "seo-audit",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/app.blog-seo": {
    id: "routes/app.blog-seo",
    parentId: "routes/app",
    path: "blog-seo",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/app.scripts": {
    id: "routes/app.scripts",
    parentId: "routes/app",
    path: "scripts",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route14
  },
  "routes/app.images": {
    id: "routes/app.images",
    parentId: "routes/app",
    path: "images",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app.schema": {
    id: "routes/app.schema",
    parentId: "routes/app",
    path: "schema",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/app.cache": {
    id: "routes/app.cache",
    parentId: "routes/app",
    path: "cache",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route18
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
