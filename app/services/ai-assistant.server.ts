import prisma from "~/db.server";
import type { AuditIssueInput } from "~/lib/types";

interface AIQueryResult {
  answer: string;
  data: Record<string, unknown>;
}

export async function processAIQuery(
  shop: string,
  question: string,
): Promise<AIQueryResult> {
  const q = question.toLowerCase();

  const issues = await prisma.auditIssue.findMany({
    where: { shop, fixed: false },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const latestSnapshot = await prisma.auditSnapshot.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  const scripts = await prisma.managedScript.findMany({
    where: { shop, enabled: true },
  });

  if (q.includes("pior seo") || q.includes("produtos") && q.includes("seo")) {
    const productIssues = groupByResource(issues.filter((i) => i.resourceType === "product"));
    const worst = productIssues
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 10);

    return {
      answer: worst.length
        ? `Encontrei ${worst.length} produtos com problemas de SEO. Os piores são: ${worst.map((p) => `"${p.title}" (${p.issues.length} problemas)`).join(", ")}.`
        : "Todos os produtos analisados estão com SEO adequado.",
      data: { products: worst },
    };
  }

  if (q.includes("velocidade") || q.includes("performance") || q.includes("homepage")) {
    const perfScore = latestSnapshot?.performanceScore ?? 0;
    const weight = latestSnapshot?.estimatedPageWeight ?? 0;
    const activeScripts = latestSnapshot?.activeScripts ?? scripts.length;

    return {
      answer: `A homepage tem score de performance ${perfScore}/100. Peso estimado: ${weight}KB. ${activeScripts} scripts ativos. Recomendações: ative lazy load, delay JS para analytics, e resource hints nível 2.`,
      data: { performanceScore: perfScore, pageWeight: weight, activeScripts },
    };
  }

  if (q.includes("meta description") || q.includes("descrição")) {
    const missing = issues.filter((i) => i.issueType === "missing_meta_description");
    const byType = {
      products: missing.filter((i) => i.resourceType === "product").length,
      collections: missing.filter((i) => i.resourceType === "collection").length,
      pages: missing.filter((i) => i.resourceType === "page").length,
    };

    return {
      answer: `${missing.length} recursos sem meta description: ${byType.products} produtos, ${byType.collections} coleções, ${byType.pages} páginas. Use "Correção em Massa" para gerar automaticamente.`,
      data: { total: missing.length, byType, items: missing.slice(0, 20) },
    };
  }

  if (q.includes("app") && (q.includes("impacto") || q.includes("performance"))) {
    const impacts = [
      { name: "Meta Pixel", ms: 120 },
      { name: "Klaviyo", ms: 90 },
      { name: "Hotjar", ms: 180 },
      { name: "Microsoft Clarity", ms: 75 },
    ];

    const top = impacts.sort((a, b) => b.ms - a.ms)[0];
    return {
      answer: `O app com maior impacto estimado é ${top.name} (~${top.ms}ms). Considere ativar Delay JS para scripts de analytics. Scripts gerenciados ativos: ${scripts.length}.`,
      data: { impacts, managedScripts: scripts.length },
    };
  }

  if (q.includes("link") && q.includes("quebrado")) {
    const broken = await prisma.brokenLink.count({ where: { shop, fixed: false } });
    return {
      answer: broken
        ? `${broken} links quebrados detectados. Acesse "Broken Links" para ver detalhes e criar redirects.`
        : "Nenhum link quebrado detectado na última varredura.",
      data: { brokenLinks: broken },
    };
  }

  if (q.includes("alt") || q.includes("imagem")) {
    const missingAlt = issues.filter((i) => i.issueType === "missing_alt");
    return {
      answer: `${missingAlt.length} imagens sem texto ALT. Use "Gerar ALT para todas as imagens" na correção em massa.`,
      data: { count: missingAlt.length, items: missingAlt.slice(0, 15) },
    };
  }

  const seoScore = latestSnapshot?.seoScore ?? 0;
  return {
    answer: `Score SEO atual: ${seoScore}/100. Total de ${issues.length} problemas pendentes. Pergunte sobre produtos, performance, meta descriptions, apps ou links quebrados.`,
    data: {
      seoScore,
      issueCount: issues.length,
      snapshot: latestSnapshot,
    },
  };
}

function groupByResource(issues: AuditIssueInput[]) {
  const map = new Map<string, { title: string; issues: AuditIssueInput[] }>();

  for (const issue of issues) {
    const key = issue.resourceId || issue.resourceTitle || "unknown";
    const existing = map.get(key) || { title: issue.resourceTitle || key, issues: [] };
    existing.issues.push(issue);
    map.set(key, existing);
  }

  return Array.from(map.values());
}
