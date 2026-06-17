#!/usr/bin/env bash
set -euo pipefail

# Relink do app para a conta real Dreams Nutrition
# Conta: adm@dreamsnutrition.com.br

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "============================================"
echo "  Dreams SEO — Login & Relink (Produção)"
echo "============================================"
echo ""
echo "Conta esperada: adm@dreamsnutrition.com.br"
echo ""

# Logout limpo
echo "→ Fazendo logout..."
shopify auth logout 2>/dev/null || true
rm -f .shopify/project.json

echo ""
echo "→ Faça login com adm@dreamsnutrition.com.br"
shopify auth login

echo ""
echo "Organizações disponíveis:"
shopify organization list

echo ""
echo "→ Relink do app na org Dreams Nutrition..."
echo "   Quando perguntado:"
echo "   - Organization: Dreams Nutrition"
echo "   - Create new app: No (se já existir) ou Yes (criar novo)"
echo "   - App name: Dreams SEO"
echo ""

# Tenta org Dreams Nutrition (ajuste se necessário)
SHOPIFY_FLAG_ORGANIZATION_ID="${SHOPIFY_FLAG_ORGANIZATION_ID:-183248625}" \
  shopify app config link --reset

echo ""
echo "→ Sincronizando .env..."
shopify app env pull --force 2>/dev/null || true

CLIENT_ID=$(grep -E '^client_id\s*=' shopify.app.*.toml 2>/dev/null | head -1 | sed 's/.*"\(.*\)".*/\1/')
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "YOUR_CLIENT_ID" ]; then
  echo "SHOPIFY_API_KEY=$CLIENT_ID" >> .env.tmp
  grep -v '^SHOPIFY_API_KEY=' .env > .env.tmp2 2>/dev/null || true
  cat .env.tmp2 .env.tmp > .env 2>/dev/null || echo "SHOPIFY_API_KEY=$CLIENT_ID" >> .env
  rm -f .env.tmp .env.tmp2
  echo "→ Client ID salvo: $CLIENT_ID"
fi

echo ""
echo "============================================"
echo "  Próximos passos (loja real)"
echo "============================================"
echo ""
echo "1. Hospede o app (Railway/VPS) — veja PRODUCAO.md"
echo "2. Dev Dashboard → Distribution → Custom distribution"
echo "   Loja: dreams-nutrition-ltda.myshopify.com"
echo "3. Instale:"
echo "   https://admin.shopify.com/store/dreams-nutrition-ltda/oauth/install?client_id=${CLIENT_ID:-SEU_CLIENT_ID}"
echo "4. Deploy extensões: shopify app deploy"
echo ""
