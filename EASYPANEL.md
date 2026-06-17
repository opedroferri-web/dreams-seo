# Deploy Dreams SEO Pro no Easypanel (VPS)

Guia completo para subir o app na VPS via **Easypanel** e instalar na loja real `dreams-nutrition-ltda.myshopify.com`.

---

## Visão geral

```
GitHub → Easypanel (Docker) → seo.dreamsnutrition.com.br
                                      ↓
                            Shopify Admin (Apps → Dreams SEO)
```

**Recomendamos subdomínio** `seo.dreamsnutrition.com.br` (mais simples no Easypanel do que `/seo` no path).

---

## Parte 1 — Preparar o código (local)

### 1.1 Subir para GitHub

```bash
cd "/Users/pedro/Documents/Repositórios/Dreams-SEO"
git init
git add .
git commit -m "Dreams SEO Pro - deploy Easypanel"
git remote add origin https://github.com/opedroferri-web/dreams-seo.git
git push -u origin main
```

> O `.env` está no `.gitignore` — credenciais **não vão** pro GitHub.

---

## Parte 2 — DNS (antes do Easypanel)

No painel DNS do domínio `dreamsnutrition.com.br`, crie:

| Tipo | Nome | Valor |
|------|------|-------|
| **A** ou **CNAME** | `seo` | IP da sua VPS (Easypanel mostra o IP) |

Resultado: `seo.dreamsnutrition.com.br` → sua VPS

Aguarde propagação (5–30 min).

---

## Parte 3 — Easypanel

### 3.1 Criar projeto

1. Acesse o Easypanel na VPS (`http://IP-DA-VPS:3000` ou seu domínio Easypanel)
2. **+ New Project** → nome: `dreams-seo`

### 3.2 Criar serviço (App)

1. **+ Service** → **App**
2. **Source:** GitHub → conecte repositório `opedroferri-web/dreams-seo`
3. **Build:** Dockerfile (detecta automaticamente o `Dockerfile` na raiz)
4. **Branch:** `main`

### 3.3 Porta

| Campo | Valor |
|-------|-------|
| **Port** | `3000` |
| **Protocol** | HTTP |

### 3.4 Domínio

1. Aba **Domains**
2. **+ Add Domain**
3. Host: `seo.dreamsnutrition.com.br`
4. Ative **HTTPS** (Let's Encrypt automático)

### 3.5 Volume persistente (importante!)

Sem volume, sessões e dados são perdidos a cada redeploy.

1. Aba **Mounts** ou **Volumes**
2. **Add Mount:**
   - **Host path / Volume name:** `dreams-seo-data`
   - **Container path:** `/app/prisma/data`

### 3.6 Variáveis de ambiente

Aba **Environment** → copie de `easypanel.env.example` ou adicione:

```env
NODE_ENV=production
PORT=3000

SHOPIFY_API_KEY=e62a98dc2628ff730e9ec7accf26fe2d
SHOPIFY_API_SECRET=COLE_SEU_CLIENT_SECRET_AQUI

SHOPIFY_APP_URL=https://seo.dreamsnutrition.com.br

SCOPES=read_products,write_products,read_content,write_content,read_themes,write_themes,read_online_store_pages,write_online_store_pages,read_online_store_navigation,read_files,write_files,read_locales,read_markets,read_orders,read_script_tags,write_script_tags,read_translations,write_translations,read_metaobjects,write_metaobjects,read_customer_events,write_pixels

DATABASE_URL=file:/app/prisma/data/prod.sqlite
```

> O **Client Secret** está em [Dev Dashboard](https://dev.shopify.com) → Dreams SEO → Settings → Credentials. **Nunca** commite no GitHub.

### 3.7 Deploy

1. Clique **Deploy**
2. Aguarde build (3–8 min na primeira vez)
3. Logs devem mostrar:
   ```
   Prisma migrate deploy
   remix-serve listening on port 3000
   ```

### 3.8 Testar

Abra no navegador:

```
https://seo.dreamsnutrition.com.br
```

Deve responder (página de login Shopify ou redirect) — **não** "conexão recusada".

---

## Parte 4 — Atualizar Shopify (Dev Dashboard)

1. [Dev Dashboard → Dreams SEO](https://dev.shopify.com/dashboard/183248625/apps)
2. **Configuration:**

| Campo | Valor |
|-------|-------|
| **App URL** | `https://seo.dreamsnutrition.com.br` |
| **Allowed redirection URL(s)** | `https://seo.dreamsnutrition.com.br/auth/callback` |

3. **Save**

### Atualizar local + redeploy config (opcional)

No Mac:

```bash
cd "/Users/pedro/Documents/Repositórios/Dreams-SEO"
shopify app deploy
```

Isso sincroniza `shopify.app.dreams-seo.toml` com URLs corretas.

---

## Parte 5 — Instalar na loja real

### 5.1 Custom Distribution

1. Dev Dashboard → **Dreams SEO** → **Distribution**
2. **Custom distribution**
3. Store domain: `dreams-nutrition-ltda.myshopify.com`
4. Save

### 5.2 Link de instalação

Abra logado no admin da Dreams Nutrition:

```
https://admin.shopify.com/store/dreams-nutrition-ltda/oauth/install?client_id=e62a98dc2628ff730e9ec7accf26fe2d
```

Clique **Install app** → autorize scopes.

> Se o app já estava instalado com URL antiga, **desinstale e reinstale** após mudar a App URL.

### 5.3 Ativar extensões

**Theme App Extension**
- Online Store → Themes → Customize → **App embeds** → **Dreams SEO Pro** → Save

**Web Pixel**
- Settings → Customer events → **Dreams SEO Pro Pixel** → Connect
- `accountID`: seu Pixel ID
- `enableMetaPixel`: `true`

---

## Parte 6 — Verificar funcionamento

1. Admin Shopify → **Apps** → **Dreams SEO**
2. Dashboard deve carregar sem erro de conexão
3. Clique **Executar Auditoria**

---

## Atualizações futuras

```bash
# Local: commit + push
git add .
git commit -m "update"
git push

# Easypanel: redeploy automático (se CI ativo) ou botão Deploy manual
```

---

## Solução de problemas

### Deploy parou após tornar o repo privado (IMPORTANTE)

**Sintoma:** pushes no GitHub não disparam build no Easypanel; app continua na versão antiga (ex.: `/robots.txt` 404).

**Causa:** quando o repo vira **privado**, o Easypanel perde acesso para clonar e o webhook de auto-deploy para de funcionar. **Não é bug no código** — o GitHub Actions `Build` pode passar enquanto o Easypanel fica parado.

**Correção (faça nesta ordem):**

#### 1. Token GitHub no Easypanel (obrigatório para repo privado)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Crie token **Classic** com scopes:
   - `repo` (acesso a repos privados)
   - `admin:repo_hook` (auto-deploy via webhook)
3. Easypanel → **Settings** → **GitHub** → cole o token → salve

> Docs: https://easypanel.io/docs/code-sources/github

#### 2. Reconfigurar o serviço

1. Serviço `dreams-seo` → aba **Source** / **Git**
2. Confirme: `opedroferri-web/dreams-seo`, branch `main`
3. Ative **Auto Deploy** (se disponível)
4. Clique **Deploy** manualmente agora

#### 3. Webhook GitHub → Easypanel (recomendado)

1. Easypanel → serviço `dreams-seo` → copie a **Deploy Webhook URL**
2. GitHub → repo `dreams-seo` → **Settings** → **Secrets and variables** → **Actions**
3. New secret: `EASYPANEL_DEPLOY_WEBHOOK` = URL copiada
4. A cada push em `main`, o workflow dispara deploy no Easypanel

#### 4. Confirmar que atualizou

Após deploy, teste:
```bash
curl -s https://seo.dreamsnutrition.com.br/robots.txt
```
Deve retornar `Disallow: /` (não 404).

**Último commit no GitHub:** https://github.com/opedroferri-web/dreams-seo/commits/main

---

### "Conexão recusada"
- Serviço parado no Easypanel → **Start**
- Porta errada → confirme `3000`
- DNS não propagou → teste `curl -I https://seo.dreamsnutrition.com.br`

### "OAuth redirect_uri mismatch"
- Redirect URL no Dashboard deve ser exatamente:
  `https://seo.dreamsnutrition.com.br/auth/callback`
- `SHOPIFY_APP_URL` no Easypanel deve bater

### App abre em branco
- Verifique logs no Easypanel
- Confirme `SHOPIFY_API_SECRET` correto
- Reinstale o app na loja

### Dados perdidos após redeploy
- Volume `/app/prisma/data` não configurado → configure Mount

### Build falha no Docker
- Verifique logs de build
- Confirme `package-lock.json` no repositório

---

## Checklist final

- [ ] DNS `seo.dreamsnutrition.com.br` → VPS
- [ ] Easypanel: app rodando na porta 3000
- [ ] Volume `/app/prisma/data` montado
- [ ] Env vars configuradas
- [ ] HTTPS ativo no Easypanel
- [ ] Dev Dashboard URLs atualizadas
- [ ] Custom Distribution ativado
- [ ] App instalado na loja real
- [ ] App embeds ativados no tema

---

**URL final do app:** `https://seo.dreamsnutrition.com.br`
