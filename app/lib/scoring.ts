export function getScoreColor(score: number): "success" | "warning" | "critical" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "critical";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Bom";
  if (score >= 60) return "Regular";
  if (score >= 40) return "Precisa melhorar";
  return "Crítico";
}
