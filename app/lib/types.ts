export type Severity = "low" | "medium" | "high" | "critical";

export interface AuditIssueInput {
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  issueType: string;
  severity: Severity;
  message: string;
  suggestion?: string;
}

export interface ProductNode {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  seo?: { title?: string | null; description?: string | null };
  featuredMedia?: { alt?: string | null };
  media?: { edges: Array<{ node: { alt?: string | null } }> };
}

export interface CollectionNode {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  seo?: { title?: string | null; description?: string | null };
  image?: { altText?: string | null };
}

export interface PageNode {
  id: string;
  title: string;
  handle: string;
  bodySummary?: string;
  body?: string;
}

export interface ArticleNode {
  id: string;
  title: string;
  handle: string;
  summary?: string;
  body?: string;
  image?: { altText?: string | null };
}

export interface ScoreBreakdown {
  seoScore: number;
  performanceScore: number;
  technicalScore: number;
  optimizationScore: number;
}

export interface DashboardMetrics {
  productsWithoutSeo: number;
  imagesWithoutAlt: number;
  missingMetaDesc: number;
  missingSchemas: number;
  brokenLinks: number;
  activeScripts: number;
  estimatedPageWeight: number;
  totalOptimizations: number;
}

export interface ImageAuditResult {
  id: string;
  url?: string;
  alt?: string | null;
  fileSize?: number;
  issues: string[];
}

export interface AppImpact {
  name: string;
  estimatedMs: number;
  impact: "low" | "medium" | "high";
  scripts: string[];
}

export interface ThemeAuditResult {
  heavyAssets: Array<{ filename: string; size: number }>;
  totalCss: number;
  totalJs: number;
  totalAssets: number;
  recommendations: string[];
}

export interface SchemaStatus {
  schemaType: string;
  status: "installed" | "absent" | "invalid";
  enabled: boolean;
}

export const SEO_TITLE_MIN = 30;
export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MIN = 120;
export const SEO_DESC_MAX = 160;
export const CONTENT_MIN_LENGTH = 100;
