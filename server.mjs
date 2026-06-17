import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import morgan from "morgan";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const buildPath = path.join(rootDir, "build/server/index.js");
const publicDir = path.join(rootDir, "public");
const port = Number(process.env.PORT) || 3000;

const ROBOTS = `# Dreams SEO Pro — backend do app Shopify (não indexar)
User-agent: *
Disallow: /

Sitemap: https://seo.dreamsnutrition.com.br/sitemap.xml
`;

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://seo.dreamsnutrition.com.br/</loc>
  </url>
</urlset>
`;

function readPublic(file, fallback) {
  const filePath = path.join(publicDir, file);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

async function start() {
  const app = express();
  app.disable("x-powered-by");
  app.use(compression());

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8").send(readPublic("robots.txt", ROBOTS));
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml; charset=utf-8").send(readPublic("sitemap.xml", SITEMAP));
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "dreams-seo" });
  });

  try {
    const build = await import(pathToFileURL(buildPath).href);
    installGlobals({ nativeFetch: build.future?.v3_singleFetch });

    app.use(
      build.publicPath,
      express.static(path.join(rootDir, build.assetsBuildDirectory), {
        immutable: true,
        maxAge: "1y",
      }),
    );
    app.use(express.static(publicDir, { maxAge: "1h" }));
    app.use(morgan("tiny"));
    app.all(
      "*",
      createRequestHandler({
        build,
        mode: process.env.NODE_ENV ?? "production",
      }),
    );

    console.log("[dreams-seo] Remix app carregado");
  } catch (error) {
    console.error("[dreams-seo] Falha ao carregar Remix (robots.txt continua ativo):", error);
  }

  const server = app.listen(port, () => {
    console.log(`[dreams-seo] Pronto em http://0.0.0.0:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`[dreams-seo] ${signal} recebido, encerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("[dreams-seo] Falha fatal ao iniciar:", error);
  process.exit(1);
});
