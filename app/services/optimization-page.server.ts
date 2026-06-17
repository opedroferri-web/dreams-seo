// Mantido para compatibilidade com audit.server.ts e DB existente.
// A configuração de otimização agora é hardcoded no liquid — não há mais presets dinâmicos.
import prisma from "~/db.server";
import { OPTIMIZATION_PRESETS } from "~/lib/optimization-presets";

export async function ensureShopSettings(shop: string) {
  return prisma.shopSettings.upsert({
    where: { shop },
    update: {},
    create: { shop, ...OPTIMIZATION_PRESETS[1], schemaInjection: true },
  });
}
