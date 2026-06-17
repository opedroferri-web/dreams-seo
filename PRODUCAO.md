# Instalar na Loja Real — dreams-nutrition-ltda.myshopify.com

Guia para instalar o **Dreams SEO** na loja de produção, sem dev store.

---

## Visão geral

```
1. Hospedar o app (URL pública HTTPS)
2. Configurar credenciais (.env)
3. Atualizar URLs no Partner Dashboard
4. Deploy das extensões (shopify app deploy)
5. Ativar Custom Distribution
6. Instalar na loja via link
```

---

## Passo 1 — Obter o Client Secret

1. Acesse [https://dev.shopify.com/dashboard/222999608/apps](https://dev.shopify.com/dashboard/222999608/apps)
2. Abra o app **Dreams SEO**
3. Vá em **Settings** → **Client credentials**
4. Copie o **Client secret** (API Secret)

---

## Passo 2 — Hospedar o app

### Opção A — Railway (recomendado, ~5 min)

1. Crie conta em [https://railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo** (ou upload do projeto)
3. Adicione as variáveis de ambiente:

```env
SHOPIFY_API_KEY=fba7c11f7a31f3d9dc14140f98055a28
SHOPIFY_API_SECRET=seu_client_secret_aqui
SHOPIFY_APP_URL=https://SUA-URL.railway.app
SCOPES=read_products,write_products,read_content,write_content,read_themes,write_themes,read_online_store_pages,write_online_store_pages,read_online_store_navigation,read_files,write_files,read_locales,read_markets,read_orders,read_script_tags,write_script_tags,read_translations,write_translations,read_metaobjects,write_metaobjects,read_customer_events,write_pixels
DATABASE_URL=file:/app/prisma/data/prod.sqlite
NODE_ENV=production
```

4. Adicione um **Volume** montado em `/app/prisma/data` (para persistir sessões)
5. Gere domínio público: **Settings** → **Networking** → **Generate Domain**
6. Anote a URL (ex: `https://dreams-seo-production.up.railway.app`)

### Opção B — VPS / dreamsnutrition.com.br/seo

Se já tem servidor na Dreams Nutrition:

```bash
docker build -t dreams-seo .
docker run -d -p 3000:3000 \
  -v dreams-seo-data:/app/prisma/data \
  -e SHOPIFY_API_KEY=fba7c11f7a31f3d9dc14140f98055a28 \
  -e SHOPIFY_API_SECRET=seu_secret \
  -e SHOPIFY_APP_URL=https://dreamsnutrition.com.br/seo \
  -e DATABASE_URL=file:/app/prisma/data/prod.sqlite \
  dreams-seo
```

Configure nginx para proxy `/seo` → `localhost:3000` (veja `nginx.example.conf`).

---

## Passo 3 — Atualizar URLs no Partner Dashboard

1. [Dev Dashboard](https://dev.shopify.com/dashboard/222999608/apps) → **Dreams SEO** → **Configuration**

| Campo | Valor |
|-------|-------|
| App URL | `https://SUA-URL.railway.app` (ou `https://dreamsnutrition.com.br/seo`) |
| Allowed redirection URL(s) | `https://SUA-URL/auth/callback` |

2. Salve

Atualize também `shopify.app.dreams-seo.toml` localmente com a mesma URL.

---

## Passo 4 — Deploy das extensões

No Terminal local:

```bash
cd "/Users/pedro/Documents/Repositórios/Dreams-SEO"
shopify app deploy
```

Confirme deploy de:
- `dreams-seo-theme` (Theme App Extension)
- `dreams-seo-pixel` (Web Pixel)

---

## Passo 5 — Ativar Custom Distribution

1. Dev Dashboard → **Dreams SEO** → **Distribution**
2. Escolha **Custom distribution**
3. Em **Store domain**, adicione: `dreams-nutrition-ltda.myshopify.com`
4. Copie o **link de instalação** gerado

---

## Passo 6 — Instalar na loja

1. Abra o link de instalação (logado como admin da Dreams Nutrition)
2. Clique **Install app**
3. Autorize os scopes solicitados
4. O app aparecerá em **Apps** no admin

Link direto (após ativar Custom Distribution):

```
https://admin.shopify.com/store/dreams-nutrition-ltda/oauth/install?client_id=fba7c11f7a31f3d9dc14140f98055a28
```

---

## Passo 7 — Ativar extensões na loja

### Theme App Extension
1. Admin → **Online Store** → **Themes** → **Customize**
2. **App embeds** → ative **Dreams SEO Pro** → **Save**

### Web Pixel
1. Admin → **Settings** → **Customer events**
2. Conecte **Dreams SEO Pro Pixel**

---

## Checklist

- [ ] App hospedado com HTTPS
- [ ] SHOPIFY_API_SECRET configurado
- [ ] URLs atualizadas no Dev Dashboard
- [ ] `shopify app deploy` executado
- [ ] Custom Distribution ativado para dreams-nutrition-ltda
- [ ] App instalado via link
- [ ] App embeds ativados no tema

---

## Solução de problemas

**App não carrega após instalar**
- Verifique se `SHOPIFY_APP_URL` bate com App URL no Dashboard
- Confirme redirect URL: `{APP_URL}/auth/callback`

**Erro OAuth / redirect_uri**
- URL deve ser idêntica no Dashboard e no `.env`

**Extensões não aparecem**
- Rode `shopify app deploy` novamente
- Reinstale o app se scopes mudaram
