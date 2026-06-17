export interface OptimizationSettings {
  lazyLoadEnabled: boolean;
  delayJsEnabled: boolean;
  dnsPrefetchEnabled: boolean;
  preconnectEnabled: boolean;
  preloadEnabled: boolean;
  prefetchEnabled: boolean;
  fontOptimization: boolean;
  resourceHintsLevel: number;
  delayJsTrigger: string;
  webpEnabled: boolean;
}

export const OPTIMIZATION_LEVELS = [
  {
    value: 1,
    label: "Básico",
    description: "Preconnect e DNS prefetch para CDNs essenciais.",
    badge: "Inicial",
  },
  {
    value: 2,
    label: "Recomendado",
    description: "Lazy load, fontes otimizadas e preload de imagens críticas.",
    badge: "Popular",
  },
  {
    value: 3,
    label: "Avançado",
    description: "Adia scripts de analytics e terceiros até interação do visitante.",
    badge: "Pro",
  },
  {
    value: 4,
    label: "Máximo",
    description: "Todas as otimizações ativas — máxima performance na Shopify.",
    badge: "Turbo",
  },
] as const;

export const OPTIMIZATION_PRESETS: Record<number, OptimizationSettings> = {
  1: {
    lazyLoadEnabled: false,
    delayJsEnabled: false,
    dnsPrefetchEnabled: true,
    preconnectEnabled: true,
    preloadEnabled: false,
    prefetchEnabled: false,
    fontOptimization: false,
    resourceHintsLevel: 1,
    delayJsTrigger: "scroll",
    webpEnabled: true,
  },
  2: {
    lazyLoadEnabled: true,
    delayJsEnabled: false,
    dnsPrefetchEnabled: true,
    preconnectEnabled: true,
    preloadEnabled: true,
    prefetchEnabled: false,
    fontOptimization: true,
    resourceHintsLevel: 2,
    delayJsTrigger: "scroll",
    webpEnabled: true,
  },
  3: {
    lazyLoadEnabled: true,
    delayJsEnabled: true,
    dnsPrefetchEnabled: true,
    preconnectEnabled: true,
    preloadEnabled: true,
    prefetchEnabled: false,
    fontOptimization: true,
    resourceHintsLevel: 3,
    delayJsTrigger: "scroll",
    webpEnabled: true,
  },
  4: {
    lazyLoadEnabled: true,
    delayJsEnabled: true,
    dnsPrefetchEnabled: true,
    preconnectEnabled: true,
    preloadEnabled: true,
    prefetchEnabled: true,
    fontOptimization: true,
    resourceHintsLevel: 3,
    delayJsTrigger: "scroll",
    webpEnabled: true,
  },
};

export function detectOptimizationLevel(settings: OptimizationSettings): number {
  for (const level of [4, 3, 2, 1]) {
    const preset = OPTIMIZATION_PRESETS[level];
    const matches = (Object.keys(preset) as Array<keyof OptimizationSettings>).every(
      (key) => settings[key] === preset[key],
    );
    if (matches) return level;
  }
  return 0;
}

export function calculateOptimizationScore(settings: OptimizationSettings): number {
  const checks = [
    settings.dnsPrefetchEnabled,
    settings.preconnectEnabled,
    settings.preloadEnabled,
    settings.prefetchEnabled,
    settings.lazyLoadEnabled,
    settings.delayJsEnabled,
    settings.fontOptimization,
    settings.resourceHintsLevel >= 2,
    settings.webpEnabled,
  ];
  const active = checks.filter(Boolean).length;
  return Math.round((active / checks.length) * 100);
}

export function countActiveOptimizations(settings: OptimizationSettings): number {
  return [
    settings.dnsPrefetchEnabled && "DNS Prefetch",
    settings.preconnectEnabled && "Preconnect",
    settings.preloadEnabled && "Preload",
    settings.prefetchEnabled && "Prefetch",
    settings.lazyLoadEnabled && "Lazy Load",
    settings.delayJsEnabled && "Delay JS",
    settings.fontOptimization && "Fontes",
    settings.resourceHintsLevel >= 2 && "Cache nível 2+",
    settings.resourceHintsLevel >= 3 && "Cache nível 3",
  ].filter(Boolean).length;
}
