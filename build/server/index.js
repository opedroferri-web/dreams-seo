var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useRouteError, useLoaderData, useFetcher, useActionData, Form, Link as Link$1 } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { boundary, shopifyApp, AppDistribution, ApiVersion, LoginErrorType } from "@shopify/shopify-app-remix/server";
import "@shopify/shopify-app-remix/adapters/node";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { useState } from "react";
import { Badge, InlineStack, Button, Page, BlockStack, Banner, Card, Text, Box, List, Tabs, Layout, ProgressBar, Link, Grid, DataTable, EmptyState, Modal, FormLayout, TextField, Select, ButtonGroup } from "@shopify/polaris";
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
const db_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: prisma
}, Symbol.toStringTag, { value: "Module" }));
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
const action$5 = async ({ request }) => {
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
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
const action$4 = async ({ request }) => {
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
  action: action$4
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
const GET_SHOP = `#graphql
  query GetShop {
    shop {
      id
      name
      myshopifyDomain
      primaryDomain {
        url
        host
      }
      currencyCode
      description
    }
  }
`;
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
                body
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
          }
        }
      }
    }
  }
`;
async function adminGraphql(admin, query, variables) {
  var _a2;
  try {
    const response = await admin.graphql(query, variables ? { variables } : void 0);
    const json2 = await response.json();
    const errors = ((_a2 = json2.errors) == null ? void 0 : _a2.map((e) => e.message)) ?? [];
    if (errors.length > 0) {
      console.error("[GraphQL]", errors.join("; "));
    }
    return { data: json2.data ?? null, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na API GraphQL";
    console.error("[GraphQL throw]", message);
    return { data: null, errors: [message] };
  }
}
async function syncScriptsToMetafield(admin, shop) {
  var _a2, _b, _c;
  try {
    const prisma2 = (await Promise.resolve().then(() => db_server)).default;
    const scripts = await prisma2.managedScript.findMany({
      where: { shop },
      orderBy: { priority: "desc" }
    });
    const { data, errors } = await adminGraphql(admin, GET_SHOP);
    if (errors.length > 0) return { ok: false, error: errors.join(", ") };
    const shopId = (_a2 = data == null ? void 0 : data.shop) == null ? void 0 : _a2.id;
    if (!shopId) return { ok: false, error: "Loja não encontrada" };
    const payload = scripts.map((s) => ({
      name: s.name,
      placement: s.placement,
      content: s.content,
      enabled: s.enabled,
      type: s.scriptType
    }));
    const response = await admin.graphql(CREATE_METAFIELD, {
      variables: {
        metafields: [{
          ownerId: shopId,
          namespace: "dreams_seo",
          key: "scripts",
          type: "json",
          value: JSON.stringify(payload)
        }]
      }
    });
    const json2 = await response.json();
    const userErrors = ((_c = (_b = json2.data) == null ? void 0 : _b.metafieldsSet) == null ? void 0 : _c.userErrors) ?? [];
    if (userErrors.length > 0) {
      return { ok: false, error: userErrors.map((e) => e.message).join(", ") };
    }
    return { ok: true };
  } catch (error) {
    console.error("[metafield-sync scripts]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erro" };
  }
}
function calculateOptimizationScore(settings) {
  const checks = [
    settings.dnsPrefetchEnabled,
    settings.preconnectEnabled,
    settings.preloadEnabled,
    settings.prefetchEnabled,
    settings.lazyLoadEnabled,
    settings.delayJsEnabled,
    settings.fontOptimization,
    settings.resourceHintsLevel >= 2,
    settings.webpEnabled
  ];
  const active = checks.filter(Boolean).length;
  return Math.round(active / checks.length * 100);
}
function guessFormat(url) {
  const match = url.match(/\.(webp|png|jpe?g|gif|svg)(\?|$)/i);
  return match ? match[1].toLowerCase() : "desconhecido";
}
function emptyPerformanceReport(shopUrl, optimization, error) {
  const optScore = calculateOptimizationScore(optimization);
  return {
    mobileScore: Math.round(optScore * 0.7),
    desktopScore: Math.min(100, Math.round(optScore * 0.7) + 7),
    metrics: {
      lcpMs: 0,
      fcpMs: 0,
      tbtMs: 0,
      pageWeightKb: 0,
      imageCount: 0,
      heavyImages: 0,
      scriptEstimate: 0
    },
    heavyImages: [],
    recommendations: [
      "Análise parcial — configure o app e clique em Otimizar loja agora.",
      ...error ? [`Detalhe: ${error.slice(0, 120)}`] : []
    ],
    storefrontUrl: shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`,
    analysisError: error
  };
}
async function analyzeStorePerformance(shop, admin, optimization, shopUrl) {
  var _a2, _b, _c, _d, _e, _f;
  try {
    const [filesResult, managedScripts] = await Promise.all([
      adminGraphql(admin, GET_FILES, { first: 100 }),
      prisma.managedScript.count({ where: { shop, enabled: true } })
    ]);
    if (filesResult.errors.length > 0 && !filesResult.data) {
      return emptyPerformanceReport(shopUrl, optimization, filesResult.errors.join("; "));
    }
    const heavyImages = [];
    let estimatedImageKb = 0;
    for (const edge of ((_b = (_a2 = filesResult.data) == null ? void 0 : _a2.files) == null ? void 0 : _b.edges) ?? []) {
      const node = edge.node;
      if (!node.id || !((_c = node.image) == null ? void 0 : _c.url)) continue;
      const url = node.image.url;
      const w = node.image.width ?? 800;
      const h = node.image.height ?? 800;
      const estimatedBytes = Math.round(w * h / 12);
      estimatedImageKb += Math.round(estimatedBytes / 1024);
      const format = guessFormat(url);
      const sizeKb = Math.round(estimatedBytes / 1024);
      if (sizeKb >= 120 || format === "png") {
        heavyImages.push({
          id: node.id,
          url,
          alt: node.alt ?? null,
          sizeKb,
          format,
          needsWebp: format !== "webp" && format !== "svg"
        });
      }
    }
    heavyImages.sort((a, b) => b.sizeKb - a.sizeKb);
    const pageWeightKb = estimatedImageKb + 200;
    const scriptEstimate = managedScripts + 2;
    const optScore = calculateOptimizationScore(optimization);
    const mobileScore = Math.max(
      25,
      Math.min(
        98,
        Math.round(
          optScore * 0.5 + (pageWeightKb < 900 ? 22 : pageWeightKb < 1800 ? 12 : 4) + (heavyImages.length === 0 ? 12 : heavyImages.length < 8 ? 6 : 0) - scriptEstimate * 2
        )
      )
    );
    const recommendations = [];
    if (heavyImages.length > 0) {
      recommendations.push(
        `${heavyImages.length} imagens podem ser otimizadas. Ative WebP e lazy load.`
      );
    }
    if (!optimization.lazyLoadEnabled) {
      recommendations.push("Ative lazy load para melhorar LCP.");
    }
    if (!optimization.preloadEnabled) {
      recommendations.push("Ative preload da imagem hero.");
    }
    if (!optimization.delayJsEnabled) {
      recommendations.push("Adie JavaScript de analytics (Delay JS).");
    }
    if (optimization.resourceHintsLevel < 2) ;
    if (!optimization.webpEnabled) {
      recommendations.push("Ative WebP automático na aba Imagens.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Loja bem otimizada. Valide no PageSpeed Insights.");
    }
    return {
      mobileScore,
      desktopScore: Math.min(100, mobileScore + 7),
      metrics: {
        lcpMs: Math.round(1100 + pageWeightKb * 0.7 + heavyImages.length * 35),
        fcpMs: Math.round(750 + pageWeightKb * 0.35),
        tbtMs: scriptEstimate * 110,
        pageWeightKb,
        imageCount: ((_f = (_e = (_d = filesResult.data) == null ? void 0 : _d.files) == null ? void 0 : _e.edges) == null ? void 0 : _f.length) ?? 0,
        heavyImages: heavyImages.length,
        scriptEstimate
      },
      heavyImages: heavyImages.slice(0, 15),
      recommendations,
      storefrontUrl: shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`
    };
  } catch (error) {
    console.error("[performance-analysis]", error);
    return emptyPerformanceReport(
      shopUrl,
      optimization,
      error instanceof Error ? error.message : "Erro na análise"
    );
  }
}
const loader$7 = async ({ request }) => {
  var _a2, _b, _c;
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const [scripts, shopData] = await Promise.all([
    prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } }),
    adminGraphql(admin, GET_SHOP)
  ]);
  const shopUrl = ((_c = (_b = (_a2 = shopData.data) == null ? void 0 : _a2.shop) == null ? void 0 : _b.primaryDomain) == null ? void 0 : _c.url) ?? `https://${shop}`;
  let performance;
  try {
    performance = await analyzeStorePerformance(shop, admin, {
      lazyLoadEnabled: true,
      delayJsEnabled: false,
      dnsPrefetchEnabled: true,
      preconnectEnabled: true,
      preloadEnabled: true,
      prefetchEnabled: false,
      fontOptimization: true,
      resourceHintsLevel: 2,
      delayJsTrigger: "scroll",
      webpEnabled: true
    }, shopUrl);
  } catch {
    performance = emptyPerformanceReport(shopUrl, {
      lazyLoadEnabled: true,
      delayJsEnabled: false,
      dnsPrefetchEnabled: true,
      preconnectEnabled: true,
      preloadEnabled: true,
      prefetchEnabled: false,
      fontOptimization: true,
      resourceHintsLevel: 2,
      webpEnabled: true
    });
  }
  return json({
    scripts,
    performance,
    pagespeedUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(shopUrl)}`
  });
};
async function syncAndReloadScripts(admin, shop, message) {
  await syncScriptsToMetafield(admin, shop);
  const scripts = await prisma.managedScript.findMany({ where: { shop }, orderBy: { priority: "desc" } });
  return json({ success: true, message, scripts });
}
const action$3 = async ({ request }) => {
  var _a2, _b;
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "create_script") {
      const name = (_a2 = formData.get("name")) == null ? void 0 : _a2.trim();
      const content = (_b = formData.get("content")) == null ? void 0 : _b.trim();
      if (!name || !content) {
        return json({ success: false, error: "Nome e conteúdo são obrigatórios." }, { status: 400 });
      }
      await prisma.managedScript.create({
        data: {
          shop,
          name,
          scriptType: formData.get("scriptType") || "javascript",
          placement: formData.get("placement") || "head",
          content,
          displayRule: "all"
        }
      });
      return syncAndReloadScripts(admin, shop, `Script "${name}" adicionado.`);
    }
    if (intent === "toggle_script") {
      const id = formData.get("id");
      const script = await prisma.managedScript.findUnique({ where: { id } });
      if (script) await prisma.managedScript.update({ where: { id }, data: { enabled: !script.enabled } });
      return syncAndReloadScripts(admin, shop, "Script atualizado.");
    }
    if (intent === "delete_script") {
      await prisma.managedScript.delete({ where: { id: formData.get("id") } });
      return syncAndReloadScripts(admin, shop, "Script removido.");
    }
    return json({ success: false, error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    console.error("[otimizacao action]", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
};
const OTIMIZACOES_ATIVAS = [
  "Preconnect e DNS prefetch para CDNs da Shopify",
  "Preload da imagem principal do produto/coleção",
  "Font-display: swap (fontes sem FOIT)",
  "Schema JSON-LD em produtos e organização",
  "Lazy load de imagens (abaixo da dobra)",
  "Conversão automática para WebP via CDN Shopify",
  "Vídeos com autoplay carregam imediatamente",
  "Carrinho e checkout protegidos (sem interferência)"
];
function Otimizacao() {
  var _a2, _b, _c, _d;
  const { scripts, performance, pagespeedUrl } = useLoaderData();
  const fetcher = useFetcher();
  const [tab, setTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", placement: "head", scriptType: "javascript", content: "" });
  const isLoading = fetcher.state !== "idle";
  const activeScripts = ((_a2 = fetcher.data) == null ? void 0 : _a2.scripts) ?? scripts;
  const mobileTone = performance.mobileScore >= 80 ? "success" : performance.mobileScore >= 50 ? "highlight" : "critical";
  const heavyRows = performance.heavyImages.map((img) => {
    var _a3;
    return [
      ((_a3 = img.url.split("/").pop()) == null ? void 0 : _a3.slice(0, 35)) ?? "—",
      `${img.sizeKb} KB`,
      img.format.toUpperCase(),
      img.needsWebp ? /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Converter WebP" }) : /* @__PURE__ */ jsx(Badge, { tone: "success", children: "OK" })
    ];
  });
  const placementLabel = {
    head: "Header (<head>)",
    body_start: "Início do body",
    body_end: "Final do body"
  };
  const scriptRows = activeScripts.map((sc) => {
    var _a3, _b2;
    return [
      sc.name,
      placementLabel[sc.placement] ?? sc.placement,
      /* @__PURE__ */ jsx(Badge, { tone: sc.enabled ? "success" : "critical", children: sc.enabled ? "Ativo" : "Inativo" }, sc.id),
      /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "slim",
            loading: isLoading && ((_a3 = fetcher.formData) == null ? void 0 : _a3.get("id")) === sc.id && ((_b2 = fetcher.formData) == null ? void 0 : _b2.get("intent")) === "toggle_script",
            onClick: () => fetcher.submit({ intent: "toggle_script", id: sc.id }, { method: "POST" }),
            children: sc.enabled ? "Desativar" : "Ativar"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "slim",
            tone: "critical",
            onClick: () => fetcher.submit({ intent: "delete_script", id: sc.id }, { method: "POST" }),
            children: "Excluir"
          }
        )
      ] }, `a-${sc.id}`)
    ];
  });
  const tabs = [
    { id: "velocidade", content: "Velocidade", panelID: "velocidade" },
    { id: "imagens", content: "Imagens", panelID: "imagens" },
    { id: "scripts", content: "Scripts", panelID: "scripts" }
  ];
  return /* @__PURE__ */ jsxs(
    Page,
    {
      title: "Otimização",
      subtitle: "Performance automática aplicada na sua loja",
      children: [
        /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
          ((_b = fetcher.data) == null ? void 0 : _b.success) && fetcher.data.message && /* @__PURE__ */ jsx(Banner, { tone: "success", onDismiss: () => {
          }, children: fetcher.data.message }),
          ((_c = fetcher.data) == null ? void 0 : _c.error) && /* @__PURE__ */ jsx(Banner, { tone: "critical", onDismiss: () => {
          }, children: fetcher.data.error }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
              /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
                /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Otimizações ativas" }),
                /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", variant: "bodySm", children: "Aplicadas automaticamente em toda a loja — nenhuma configuração necessária." })
              ] }),
              /* @__PURE__ */ jsx(Badge, { tone: "success", size: "large", children: "ON" })
            ] }),
            /* @__PURE__ */ jsx(Box, { paddingBlockStart: "300", children: /* @__PURE__ */ jsx(List, { type: "bullet", children: OTIMIZACOES_ATIVAS.map((o) => /* @__PURE__ */ jsx(List.Item, { children: o }, o)) }) })
          ] }),
          /* @__PURE__ */ jsxs(Tabs, { tabs, selected: tab, onSelect: setTab, children: [
            tab === 0 && /* @__PURE__ */ jsx(Box, { paddingBlockStart: "400", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
              performance.analysisError && /* @__PURE__ */ jsxs(Banner, { tone: "warning", children: [
                "Análise parcial: ",
                performance.analysisError
              ] }),
              /* @__PURE__ */ jsxs(Layout, { children: [
                /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
                  /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Mobile" }),
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "heading2xl", fontWeight: "bold", children: performance.mobileScore }),
                  /* @__PURE__ */ jsx(ProgressBar, { progress: performance.mobileScore, tone: mobileTone, size: "small" }),
                  /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", variant: "bodySm", children: "Estimativa baseada em peso, imagens e otimizações ativas" })
                ] }) }) }),
                /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
                  /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Desktop" }),
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "heading2xl", fontWeight: "bold", children: performance.desktopScore }),
                  /* @__PURE__ */ jsx(ProgressBar, { progress: performance.desktopScore, tone: "success", size: "small" }),
                  /* @__PURE__ */ jsx(Link, { url: pagespeedUrl, target: "_blank", children: "Abrir no PageSpeed Insights →" })
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
                /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Core Web Vitals (estimativa)" }),
                /* @__PURE__ */ jsx(Grid, { children: [
                  { label: "LCP", value: `${performance.metrics.lcpMs} ms`, hint: "Largest Contentful Paint" },
                  { label: "FCP", value: `${performance.metrics.fcpMs} ms`, hint: "First Contentful Paint" },
                  { label: "TBT", value: `${performance.metrics.tbtMs} ms`, hint: "Total Blocking Time" },
                  { label: "Peso", value: `${performance.metrics.pageWeightKb} KB`, hint: "Peso estimado" }
                ].map((m) => /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: m.label }),
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingMd", fontWeight: "bold", children: m.value }),
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: m.hint })
                ] }) }, m.label)) })
              ] }) }),
              performance.recommendations.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
                /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Recomendações" }),
                /* @__PURE__ */ jsx(Box, { paddingBlockStart: "300", children: /* @__PURE__ */ jsx(List, { type: "bullet", children: performance.recommendations.map((r) => /* @__PURE__ */ jsx(List.Item, { children: r }, r)) }) })
              ] })
            ] }) }),
            tab === 1 && /* @__PURE__ */ jsx(Box, { paddingBlockStart: "400", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
              /* @__PURE__ */ jsx(InlineStack, { align: "space-between", children: /* @__PURE__ */ jsxs(Text, { as: "p", tone: "subdued", children: [
                performance.metrics.heavyImages,
                " imagens pesadas · ",
                performance.metrics.imageCount,
                " total"
              ] }) }),
              /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Imagens da Shopify são convertidas para WebP automaticamente via CDN. Imagens abaixo da dobra só carregam quando o visitante está próximo." }),
              /* @__PURE__ */ jsx(Card, { children: heavyRows.length > 0 ? /* @__PURE__ */ jsx(
                DataTable,
                {
                  columnContentTypes: ["text", "numeric", "text", "text"],
                  headings: ["Arquivo", "Peso", "Formato", "Status"],
                  rows: heavyRows
                }
              ) : /* @__PURE__ */ jsx(Text, { as: "p", tone: "success", children: "Nenhuma imagem pesada detectada. Excelente!" }) })
            ] }) }),
            tab === 2 && /* @__PURE__ */ jsx(Box, { paddingBlockStart: "400", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
              /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
                /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
                  /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Scripts injetados na loja" }),
                  /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", variant: "bodySm", children: "Cole qualquer HTML, JS ou tag de rastreamento — entram direto no <head> ou body da vitrine." })
                ] }),
                /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => setModalOpen(true), children: "+ Novo script" })
              ] }),
              /* @__PURE__ */ jsx(Card, { children: scriptRows.length > 0 ? /* @__PURE__ */ jsx(
                DataTable,
                {
                  columnContentTypes: ["text", "text", "text", "text"],
                  headings: ["Nome", "Posição", "Status", "Ações"],
                  rows: scriptRows
                }
              ) : /* @__PURE__ */ jsx(
                EmptyState,
                {
                  heading: "Nenhum script adicionado",
                  image: "",
                  action: { content: "+ Novo script", onAction: () => setModalOpen(true) },
                  children: /* @__PURE__ */ jsx("p", { children: "Cole tags de rastreamento, pixels ou scripts customizados. Injetados automaticamente na vitrine." })
                }
              ) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Banner, { tone: "info", children: [
            /* @__PURE__ */ jsx("strong", { children: "Como ativar:" }),
            " Loja online → Temas → Personalizar → App embeds → ative ",
            /* @__PURE__ */ jsx("strong", { children: "Dreams SEO" }),
            " → Salvar."
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: modalOpen,
            onClose: () => setModalOpen(false),
            title: "Novo script",
            primaryAction: {
              content: "Salvar na vitrine",
              loading: isLoading && ((_d = fetcher.formData) == null ? void 0 : _d.get("intent")) === "create_script",
              onAction: () => {
                fetcher.submit({ intent: "create_script", ...form }, { method: "POST" });
                setModalOpen(false);
                setForm({ name: "", placement: "head", scriptType: "javascript", content: "" });
              }
            },
            secondaryActions: [{ content: "Cancelar", onAction: () => setModalOpen(false) }],
            children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsxs(FormLayout, { children: [
              /* @__PURE__ */ jsx(
                TextField,
                {
                  label: "Nome",
                  value: form.name,
                  onChange: (v) => setForm({ ...form, name: v }),
                  autoComplete: "off",
                  placeholder: "Ex: Google Tag Manager"
                }
              ),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Posição",
                  options: [
                    { label: "Header (<head>)", value: "head" },
                    { label: "Início do body", value: "body_start" },
                    { label: "Final do body", value: "body_end" }
                  ],
                  value: form.placement,
                  onChange: (v) => setForm({ ...form, placement: v })
                }
              ),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "Tipo",
                  options: [
                    { label: "JavaScript", value: "javascript" },
                    { label: "HTML / Tag", value: "html" },
                    { label: "Pixel", value: "pixel" }
                  ],
                  value: form.scriptType,
                  onChange: (v) => setForm({ ...form, scriptType: v })
                }
              ),
              /* @__PURE__ */ jsx(
                TextField,
                {
                  label: "Conteúdo",
                  value: form.content,
                  onChange: (v) => setForm({ ...form, content: v }),
                  multiline: 8,
                  autoComplete: "off",
                  helpText: "Cole o código completo, incluindo as tags <script>...<\/script>"
                }
              )
            ] }) })
          }
        )
      ]
    }
  );
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: Otimizacao,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
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
const severityLabel = {
  critical: "crítica",
  high: "alta",
  medium: "média",
  low: "baixa"
};
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
    /* @__PURE__ */ jsx(Badge, { tone: severityTone(issue.severity), children: severityLabel[issue.severity] || issue.severity }, issue.id),
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
  const content = stripHtml(page.bodySummary || page.body || "");
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
  const hasH1 = (page.bodySummary || page.body || "").includes("<h1");
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
  const content = stripHtml(article.body || article.summary || "");
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
  const bodyHtml = article.body || "";
  const hasHeadings = bodyHtml.match(/<h[2-4]/gi);
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
  const internalLinks = bodyHtml.match(/href=["']\/[^"']+/gi);
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
const ISSUE_BATCH_SIZE = 50;
async function createIssuesInBatches(shop, issues) {
  for (let i = 0; i < issues.length; i += ISSUE_BATCH_SIZE) {
    const batch = issues.slice(i, i + ISSUE_BATCH_SIZE);
    await prisma.auditIssue.createMany({
      data: batch.map((issue) => ({
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
}
async function fetchAllProducts(admin) {
  const products = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const { data, errors } = await adminGraphql(admin, GET_PRODUCTS_SEO, { first: 50, after: cursor });
    if (errors.length > 0 || !(data == null ? void 0 : data.products)) break;
    for (const edge of data.products.edges) {
      products.push(edge.node);
    }
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
    if (products.length >= 500) break;
  }
  return products;
}
async function fetchAllCollections(admin) {
  const collections = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const { data, errors } = await adminGraphql(admin, GET_COLLECTIONS_SEO, { first: 50, after: cursor });
    if (errors.length > 0 || !(data == null ? void 0 : data.collections)) break;
    for (const edge of data.collections.edges) {
      collections.push(edge.node);
    }
    hasNext = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }
  return collections;
}
async function runFullAudit(shop, admin) {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const [products, collections, pagesResult, blogsResult, filesResult] = await Promise.all([
    fetchAllProducts(admin),
    fetchAllCollections(admin),
    adminGraphql(admin, GET_PAGES_SEO, { first: 100 }),
    adminGraphql(admin, GET_BLOGS_SEO, { first: 10 }),
    adminGraphql(admin, GET_FILES, { first: 100 })
  ]);
  const pages = ((_c = (_b = (_a2 = pagesResult.data) == null ? void 0 : _a2.pages) == null ? void 0 : _b.edges) == null ? void 0 : _c.map((e) => e.node)) || [];
  const blogs = ((_e = (_d = blogsResult.data) == null ? void 0 : _d.blogs) == null ? void 0 : _e.edges) || [];
  const articles = blogs.flatMap(
    (b) => b.node.articles.edges.map((e) => e.node)
  );
  const files = ((_h = (_g = (_f = filesResult.data) == null ? void 0 : _f.files) == null ? void 0 : _g.edges) == null ? void 0 : _h.map((e) => e.node)) || [];
  const scriptTags = 0;
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
    const w = ((_i = f.image) == null ? void 0 : _i.width) ?? 800;
    const h = ((_j = f.image) == null ? void 0 : _j.height) ?? 800;
    estimatedWeight += Math.round(w * h / 12);
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
    await createIssuesInBatches(shop, allIssues);
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
    const json2 = await response.json();
    const files = (_a2 = json2.data) == null ? void 0 : _a2.files;
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
    const json2 = await response.json();
    const products = (_a2 = json2.data) == null ? void 0 : _a2.products;
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
    const json2 = await response.json();
    const products = (_a2 = json2.data) == null ? void 0 : _a2.products;
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
    const json2 = await response.json();
    const products = (_a2 = json2.data) == null ? void 0 : _a2.products;
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
    const json2 = await response.json();
    const collections = (_a2 = json2.data) == null ? void 0 : _a2.collections;
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
const loader$6 = async ({ request }) => {
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
  return json({
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
  });
};
const action$2 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "run_audit") {
      await runFullAudit(session.shop, admin);
      return json({ success: true });
    }
    if (intent === "bulk_action") {
      const actionType = formData.get("action");
      const result = await runBulkAction(session.shop, admin, actionType);
      return json({ success: true, bulk: { action: actionType, updated: result.updated } });
    }
    return json({ success: false, error: "Ação desconhecida" });
  } catch (error) {
    console.error("[seo-audit action]", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao processar. Tente novamente."
      },
      { status: 500 }
    );
  }
};
function SeoAudit() {
  var _a2, _b, _c, _d;
  const { issues, scores, counts } = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Auditoria SEO",
      primaryAction: {
        content: "Escanear loja",
        loading: isLoading && ((_a2 = fetcher.formData) == null ? void 0 : _a2.get("intent")) === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        ((_b = fetcher.data) == null ? void 0 : _b.success) && !fetcher.data.error && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Auditoria atualizada!" }),
        ((_c = fetcher.data) == null ? void 0 : _c.error) && /* @__PURE__ */ jsx(Banner, { tone: "critical", children: fetcher.data.error }),
        /* @__PURE__ */ jsxs(Grid, { children: [
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Produtos", score: scores.products, description: `${counts.products} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Coleções", score: scores.collections, description: `${counts.collections} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Páginas", score: scores.pages, description: `${counts.pages} problemas` }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Blog", score: scores.articles, description: `${counts.articles} problemas` }) })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
          /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: "Verificações realizadas" }),
          /* @__PURE__ */ jsx(BlockStack, { gap: "100", children: [
            "Meta title ausente",
            "Meta description ausente",
            "Título curto ou longo",
            "Handle ruim",
            "ALT ausente",
            "Conteúdo curto"
          ].map((check) => /* @__PURE__ */ jsx(Badge, { tone: "info", children: check }, check)) })
        ] }) }),
        /* @__PURE__ */ jsxs(Layout, { children: [
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(IssuesTable, { issues }) }),
          /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(
            BulkActionsPanel,
            {
              loading: isLoading,
              lastResult: ((_d = fetcher.data) == null ? void 0 : _d.bulk) || null,
              onAction: (action2) => fetcher.submit({ intent: "bulk_action", action: action2 }, { method: "POST" })
            }
          ) })
        ] })
      ] })
    }
  );
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: SeoAudit,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = ({ request }) => {
  const origin = new URL(request.url).origin;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
  </url>
</urlset>
`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = ({ request }) => {
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
      "Cache-Control": "public, max-age=86400"
    }
  });
};
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$4
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
const loader$3 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const [latestSnapshot, history] = await Promise.all([
    prisma.auditSnapshot.findFirst({
      where: { shop },
      orderBy: { createdAt: "desc" }
    }),
    getHistoricalScores(shop),
    getOrCreateSettings(shop)
  ]);
  return json({
    snapshot: latestSnapshot,
    history: history.map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("pt-BR"),
      seoScore: h.seoScore,
      performanceScore: h.performanceScore,
      technicalScore: h.technicalScore,
      optimizationScore: h.optimizationScore
    }))
  });
};
const action$1 = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "run_audit") {
      const result = await runFullAudit(session.shop, admin);
      return json({ success: true, audit: result.scores });
    }
    return json({ success: false, error: "Ação desconhecida" });
  } catch (error) {
    console.error("[run_audit]", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao executar auditoria. Tente novamente."
      },
      { status: 500 }
    );
  }
};
function Dashboard() {
  var _a2, _b, _c;
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
    { label: "Meta descriptions ausentes", value: snapshot.missingMetaDesc },
    { label: "Schemas ausentes", value: snapshot.missingSchemas },
    { label: "Links quebrados", value: snapshot.brokenLinks },
    { label: "Scripts ativos", value: snapshot.activeScripts },
    { label: "Peso estimado da página", value: snapshot.estimatedPageWeight, suffix: " KB" },
    { label: "Otimizações aplicadas", value: snapshot.totalOptimizations }
  ] : [];
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Painel",
      primaryAction: {
        content: "Executar auditoria",
        loading: isLoading && ((_a2 = fetcher.formData) == null ? void 0 : _a2.get("intent")) === "run_audit",
        onAction: () => fetcher.submit({ intent: "run_audit" }, { method: "POST" })
      },
      children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        !snapshot && /* @__PURE__ */ jsx(Banner, { tone: "info", children: "Execute sua primeira auditoria para ver os scores e métricas da loja." }),
        ((_b = fetcher.data) == null ? void 0 : _b.success) && fetcher.data.audit && /* @__PURE__ */ jsx(Banner, { tone: "success", children: "Auditoria concluída com sucesso!" }),
        ((_c = fetcher.data) == null ? void 0 : _c.error) && /* @__PURE__ */ jsx(Banner, { tone: "critical", children: fetcher.data.error }),
        /* @__PURE__ */ jsxs(Grid, { children: [
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Score SEO", score: scores.seo }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Performance", score: scores.performance }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Técnico", score: scores.technical }) }),
          /* @__PURE__ */ jsx(Grid.Cell, { columnSpan: { xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }, children: /* @__PURE__ */ jsx(ScoreCard, { title: "Otimização", score: scores.optimization }) })
        ] }),
        metrics.length > 0 && /* @__PURE__ */ jsx(MetricsGrid, { metrics }),
        /* @__PURE__ */ jsx(HistoryChart, { history })
      ] })
    }
  );
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: Dashboard,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  const errors = await login(request);
  return json({ errors });
};
const action = async ({ request }) => {
  const errors = await login(request);
  return json({ errors });
};
function Index() {
  const { errors: loaderErrors } = useLoaderData();
  const actionData = useActionData();
  const errors = (actionData == null ? void 0 : actionData.errors) ?? loaderErrors;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        fontFamily: "system-ui, sans-serif",
        maxWidth: "420px",
        margin: "4rem auto",
        padding: "0 1rem"
      },
      children: [
        /* @__PURE__ */ jsx("h1", { style: { fontSize: "1.5rem", marginBottom: "0.5rem" }, children: "Dreams SEO" }),
        /* @__PURE__ */ jsx("p", { style: { color: "#666", marginBottom: "1.5rem" }, children: "Informe o domínio da loja para acessar o app." }),
        /* @__PURE__ */ jsxs(Form, { method: "post", children: [
          /* @__PURE__ */ jsxs("label", { style: { display: "block", marginBottom: "1rem" }, children: [
            /* @__PURE__ */ jsx("span", { style: { display: "block", marginBottom: "0.25rem", fontWeight: 500 }, children: "Loja Shopify" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "shop",
                placeholder: "sua-loja.myshopify.com",
                style: {
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }
              }
            )
          ] }),
          (errors == null ? void 0 : errors.shop) === LoginErrorType.MissingShop && /* @__PURE__ */ jsx("p", { style: { color: "#b00020", marginBottom: "1rem" }, children: "Informe o domínio da loja." }),
          (errors == null ? void 0 : errors.shop) === LoginErrorType.InvalidShop && /* @__PURE__ */ jsx("p", { style: { color: "#b00020", marginBottom: "1rem" }, children: "Domínio inválido. Use o formato sua-loja.myshopify.com" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              style: {
                padding: "0.5rem 1rem",
                background: "#008060",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              },
              children: "Entrar"
            }
          )
        ] })
      ]
    }
  );
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Index,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
function Auth() {
  return null;
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Auth,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const NAV_ITEMS = [
  { label: "Otimização", url: "/app/otimizacao" },
  { label: "Auditoria SEO", url: "/app/seo-audit" }
];
const links = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};
function App() {
  const { apiKey } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider, { isEmbeddedApp: true, apiKey, children: [
    /* @__PURE__ */ jsxs(NavMenu, { children: [
      /* @__PURE__ */ jsx(Link$1, { to: "/app", rel: "home", children: "Painel" }),
      NAV_ITEMS.map((item) => /* @__PURE__ */ jsx(Link$1, { to: item.url, children: item.label }, item.url))
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
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  links,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DHYqDkop.js", "imports": ["/assets/components-dsXXdAyd.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-CWYk2QRg.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/index-CKvyvi-L.js", "/assets/styles-BXy9s1Pu.js"], "css": [] }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.otimizacao": { "id": "routes/app.otimizacao", "parentId": "routes/app", "path": "otimizacao", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.otimizacao-FW3_ImAU.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/ProgressBar-C3u_7Nuu.js", "/assets/context-DNyOYiBw.js", "/assets/context-CLTb2Hpw.js", "/assets/Layout-BlY7AXO4.js"], "css": [] }, "routes/app.seo-audit": { "id": "routes/app.seo-audit", "parentId": "routes/app", "path": "seo-audit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.seo-audit-B4Psms-p.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/ScoreCard-DzyqVeg_.js", "/assets/ProgressBar-C3u_7Nuu.js", "/assets/Layout-BlY7AXO4.js", "/assets/context-DNyOYiBw.js"], "css": [] }, "routes/sitemap[.]xml": { "id": "routes/sitemap[.]xml", "parentId": "root", "path": "sitemap.xml", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/sitemap_._xml-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/robots[.]txt": { "id": "routes/robots[.]txt", "parentId": "root", "path": "robots.txt", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/robots_._txt-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-CCE-Eyr3.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/ScoreCard-DzyqVeg_.js", "/assets/ProgressBar-C3u_7Nuu.js", "/assets/context-DNyOYiBw.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-BcGrwWsa.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/index-CKvyvi-L.js"], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-CSxRPO1x.js", "imports": [], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-Ckym0NFr.js", "imports": ["/assets/components-dsXXdAyd.js", "/assets/index-CKvyvi-L.js", "/assets/styles-BXy9s1Pu.js", "/assets/context-DNyOYiBw.js", "/assets/context-CLTb2Hpw.js"], "css": [] } }, "url": "/assets/manifest-ca52f70f.js", "version": "ca52f70f" };
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
  "routes/app.otimizacao": {
    id: "routes/app.otimizacao",
    parentId: "routes/app",
    path: "otimizacao",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app.seo-audit": {
    id: "routes/app.seo-audit",
    parentId: "routes/app",
    path: "seo-audit",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/sitemap[.]xml": {
    id: "routes/sitemap[.]xml",
    parentId: "root",
    path: "sitemap.xml",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/robots[.]txt": {
    id: "routes/robots[.]txt",
    parentId: "root",
    path: "robots.txt",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route8
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route10
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
