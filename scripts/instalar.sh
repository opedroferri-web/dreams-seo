#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "============================================"
echo "  Dreams SEO Pro — Instalação"
echo "============================================"
echo ""

# Passo 2 — dependências e banco
echo "→ [2/4] Instalando dependências..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Arquivo .env criado"
fi

echo "→ Inicializando banco de dados..."
npx prisma generate
npx prisma migrate deploy

echo "→ Build do app..."
npm run build

echo ""
echo "→ [3/4] Vinculando app no Partner Dashboard..."
echo "   Quando perguntado:"
echo "   - Organization: Dreams-ecom (recomendado)"
echo "   - Create new app: Yes"
echo ""

SHOPIFY_FLAG_ORGANIZATION_ID="${SHOPIFY_FLAG_ORGANIZATION_ID:-222999608}" \
  shopify app config link --reset

# Atualizar .env com credenciais do CLI
echo ""
echo "→ Sincronizando variáveis de ambiente..."
shopify app env pull --force 2>/dev/null || true

CLIENT_ID=$(grep -E '^client_id\s*=' shopify.app.toml | sed 's/.*"\(.*\)".*/\1/')
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "YOUR_CLIENT_ID" ]; then
  if grep -q '^SHOPIFY_API_KEY=' .env 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/^SHOPIFY_API_KEY=.*/SHOPIFY_API_KEY=$CLIENT_ID/" .env
    else
      sed -i "s/^SHOPIFY_API_KEY=.*/SHOPIFY_API_KEY=$CLIENT_ID/" .env
    fi
  fi
  echo "→ App vinculado! Client ID: $CLIENT_ID"
fi

echo ""
echo "→ [4/4] Iniciando app em modo desenvolvimento..."
echo "   Quando perguntado:"
echo "   - Development store: escolha sua loja de teste"
echo "   - Update URLs: Yes"
echo ""
echo "   O navegador abrirá para instalar o app."
echo ""

STORE="${SHOPIFY_STORE:-}"
if [ -n "$STORE" ]; then
  shopify app dev -s "$STORE"
else
  shopify app dev
fi
