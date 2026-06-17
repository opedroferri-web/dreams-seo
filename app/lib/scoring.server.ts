import type { AuditIssueInput, DashboardMetrics, ScoreBreakdown } from "./types";
import { getScoreColor, getScoreLabel } from "./scoring";

export { getScoreColor, getScoreLabel };

interface ScoreInput {
  issues: AuditIssueInput[];
  totalResources: number;
  optimizationsApplied: number;
  activeScripts: number;
  estimatedPageWeightKb: number;
  schemaCount: number;
  brokenLinks: number;
}

export function calculateScores(input: ScoreInput): ScoreBreakdown {
  const { issues, totalResources, optimizationsApplied } = input;

  const seoIssues = issues.filter((i) =>
    [
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
      "no_internal_links",
    ].includes(i.issueType),
  );

  const technicalIssues = issues.filter((i) =>
    ["missing_h1", "missing_headings", "bad_handle"].includes(i.issueType),
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
    Math.round(50 + schemaBonus + optimizationBonus - seoIssues.length),
  );

  if (totalResources === 0) {
    return { seoScore: 100, performanceScore: 100, technicalScore: 100, optimizationScore: 50 };
  }

  return {
    seoScore: Math.round(seoScore),
    performanceScore: Math.round(performanceScore),
    technicalScore: Math.round(technicalScore),
    optimizationScore: Math.round(Math.max(0, optimizationScore)),
  };
}

export function aggregateMetrics(
  issues: AuditIssueInput[],
  activeScripts: number,
  estimatedPageWeightKb: number,
  optimizationsApplied: number,
  schemaMissing: number,
  brokenLinks: number,
): DashboardMetrics {
  const productsWithoutSeo = new Set(
    issues
      .filter(
        (i) =>
          i.resourceType === "product" &&
          ["missing_meta_title", "missing_meta_description"].includes(i.issueType),
      )
      .map((i) => i.resourceId),
  ).size;

  const imagesWithoutAlt = issues.filter((i) => i.issueType === "missing_alt").length;
  const missingMetaDesc = issues.filter(
    (i) => i.issueType === "missing_meta_description",
  ).length;

  return {
    productsWithoutSeo,
    imagesWithoutAlt,
    missingMetaDesc,
    missingSchemas: schemaMissing,
    brokenLinks,
    activeScripts,
    estimatedPageWeight: estimatedPageWeightKb,
    totalOptimizations: optimizationsApplied,
  };
}

