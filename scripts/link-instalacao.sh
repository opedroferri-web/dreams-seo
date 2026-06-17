#!/usr/bin/env bash
# Gera o link de instalação para a loja real Dreams Nutrition
# Requer Custom Distribution ativado no Dev Dashboard

CLIENT_ID="e62a98dc2628ff730e9ec7accf26fe2d"
STORE="dreams-nutrition-ltda"

echo ""
echo "============================================"
echo "  Instalar Dreams SEO na loja real"
echo "============================================"
echo ""
echo "1. Ative Custom Distribution em:"
echo "   https://dev.shopify.com/dashboard/222999608/apps"
echo "   → Dreams SEO → Distribution → Custom distribution"
echo "   → Store: dreams-nutrition-ltda.myshopify.com"
echo ""
echo "2. Abra este link (logado no admin da loja):"
echo ""
echo "   https://admin.shopify.com/store/${STORE}/oauth/install?client_id=${CLIENT_ID}"
echo ""
echo "3. Clique Install app e autorize os scopes."
echo ""
