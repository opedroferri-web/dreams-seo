import type {
  AuditIssueInput,
  CollectionNode,
  PageNode,
  ProductNode,
  ArticleNode,
  Severity,
} from "./types";
import {
  SEO_TITLE_MIN,
  SEO_TITLE_MAX,
  SEO_DESC_MIN,
  SEO_DESC_MAX,
  CONTENT_MIN_LENGTH,
} from "./types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isBadHandle(handle: string, title: string): boolean {
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return handle.length < 3 || handle.includes("_") || handle !== normalized;
}

export function auditProduct(product: ProductNode): AuditIssueInput[] {
  const issues: AuditIssueInput[] = [];
  const seoTitle = product.seo?.title || product.title;
  const seoDesc = product.seo?.description;

  if (!product.seo?.title) {
    issues.push({
      resourceType: "product",
      resourceId: product.id,
      resourceTitle: product.title,
      issueType: "missing_meta_title",
      severity: "high",
      message: "Meta title ausente",
      suggestion: `Adicionar meta title otimizado para "${product.title}"`,
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
      suggestion: "Gerar meta description com palavras-chave relevantes",
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
      suggestion: `Expandir para ${SEO_TITLE_MIN}-${SEO_TITLE_MAX} caracteres`,
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
      suggestion: `Reduzir para ${SEO_TITLE_MAX} caracteres ou menos`,
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
      suggestion: "Usar handle descritivo baseado no título",
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
      suggestion: "Adicionar descrição detalhada com palavras-chave",
    });
  }

  const mediaNodes = product.media?.edges?.map((e) => e.node) || [];
  const allMedia = mediaNodes.length
    ? mediaNodes
    : product.featuredMedia
      ? [product.featuredMedia]
      : [];

  for (const media of allMedia) {
    if (!media.alt) {
      issues.push({
        resourceType: "product",
        resourceId: product.id,
        resourceTitle: product.title,
        issueType: "missing_alt",
        severity: "high",
        message: "Imagem sem texto ALT",
        suggestion: `Gerar ALT descritivo para "${product.title}"`,
      });
      break;
    }
  }

  return issues;
}

export function auditCollection(collection: CollectionNode): AuditIssueInput[] {
  const issues: AuditIssueInput[] = [];

  if (!collection.descriptionHtml || stripHtml(collection.descriptionHtml).length < 50) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_description",
      severity: "high",
      message: "Descrição ausente ou muito curta",
    });
  }

  if (!collection.seo?.title) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_seo_title",
      severity: "high",
      message: "SEO Title ausente",
    });
  }

  if (!collection.seo?.description) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_meta_description",
      severity: "high",
      message: "Meta description ausente",
    });
  }

  if (!collection.image?.altText) {
    issues.push({
      resourceType: "collection",
      resourceId: collection.id,
      resourceTitle: collection.title,
      issueType: "missing_alt",
      severity: "medium",
      message: "Imagem da coleção sem ALT",
    });
  }

  return issues;
}

export function auditPage(page: PageNode): AuditIssueInput[] {
  const issues: AuditIssueInput[] = [];
  const content = stripHtml(page.bodySummary || page.body || "");

  if (!page.title || page.title.length < 10) {
    issues.push({
      resourceType: "page",
      resourceId: page.id,
      resourceTitle: page.title,
      issueType: "weak_title",
      severity: "medium",
      message: "Título da página fraco ou ausente",
    });
  }

  if (content.length < CONTENT_MIN_LENGTH) {
    issues.push({
      resourceType: "page",
      resourceId: page.id,
      resourceTitle: page.title,
      issueType: "short_content",
      severity: "medium",
      message: "Conteúdo insuficiente para SEO",
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
      suggestion: "Adicionar H1 com palavra-chave principal",
    });
  }

  return issues;
}

export function auditArticle(article: ArticleNode): AuditIssueInput[] {
  const issues: AuditIssueInput[] = [];
  const content = stripHtml(article.contentHtml || "");

  if (!article.summary && content.length < 200) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "missing_summary",
      severity: "medium",
      message: "Resumo do artigo ausente",
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
      message: "Artigo sem headings estruturados (H2-H4)",
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
      suggestion: "Adicionar links para produtos/coleções relacionados",
    });
  }

  if (!article.image?.altText) {
    issues.push({
      resourceType: "article",
      resourceId: article.id,
      resourceTitle: article.title,
      issueType: "missing_alt",
      severity: "medium",
      message: "Imagem do artigo sem ALT",
    });
  }

  return issues;
}

export function calculateResourceScore(
  issues: AuditIssueInput[],
  totalChecks: number,
): number {
  if (totalChecks === 0) return 100;
  const weights: Record<Severity, number> = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 8,
  };
  const penalty = issues.reduce((sum, i) => sum + weights[i.severity], 0);
  const maxPenalty = totalChecks * weights.high;
  return Math.max(0, Math.round(100 - (penalty / maxPenalty) * 100));
}

export function generateSeoTitle(title: string, shopName?: string): string {
  const base = title.trim();
  const withShop = shopName ? `${base} | ${shopName}` : base;
  if (withShop.length <= SEO_TITLE_MAX) return withShop;
  return base.slice(0, SEO_TITLE_MAX - 3) + "...";
}

export function generateMetaDescription(
  title: string,
  content?: string,
): string {
  const stripped = content
    ? content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  const base = stripped
    ? `${stripped.slice(0, SEO_DESC_MAX - title.length - 10)}`
    : `Compre ${title} com qualidade e entrega rápida. Confira detalhes, avaliações e condições especiais.`;
  const desc = base.includes(title) ? base : `${title} - ${base}`;
  return desc.slice(0, SEO_DESC_MAX);
}

export function generateAltText(title: string, context?: string): string {
  const ctx = context ? ` - ${context}` : "";
  return `${title}${ctx}`.slice(0, 125);
}

export function generateSeoHandle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function generateSeoFilename(title: string, ext = "jpg"): string {
  return `${generateSeoHandle(title)}.${ext}`;
}
