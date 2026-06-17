# Manual de Instalação — Dreams SEO Pro

Guia completo para instalar o **Dreams SEO Pro** na Shopify via CLI e Partner Dashboard.

---

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 18.20+ |
| npm | 9+ |
| Conta Shopify Partners | [partners.shopify.com](https://partners.shopify.com) |
| Loja de desenvolvimento | Development store |
| Shopify CLI | 3.60+ |

### Instalar Shopify CLI

```bash
npm install -g @shopify/cli@latest
```

Verifique:

```bash
shopify version
node -v
```

---

## Passo 1 — Criar o app no Partner Dashboard

1. Acesse [https://partners.shopify.com](https://partners.shopify.com)
2. Vá em **Apps** → **Create app**
3. Escolha **Create app manually**
4. Nome: **Dreams SEO Pro**
5. Anote o **Client ID** (API Key) e **Client Secret**

---

## Passo 2 — Configurar o projeto local

```bash
cd /caminho/para/Dreams-SEO
npm install
cp .env.example .env
```

Edite o arquivo `.env`:

```env
SHOPIFY_API_KEY=seu_client_id_aqui
SHOPIFY_API_SECRET=seu_client_secret_aqui
SCOPES=read_products,write_products,read_content,write_content,read_themes,write_themes,read_online_store_pages,write_online_store_pages,read_online_store_navigation,read_files,write_files,read_locales,read_markets,read_orders,read_script_tags,write_script_tags,read_translations,write_translations,read_metaobjects,write_metaobjects,read_customer_events,write_pixels
SHOPIFY_APP_URL=
```

Inicialize o banco de dados:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Passo 3 — Vincular ao app da Shopify

```bash
shopify app config link
```

Selecione sua organização e o app **Dreams SEO Pro** criado no Passo 1.

Isso atualiza automaticamente o `shopify.app.toml` com o Client ID correto.

---

## Passo 4 — Iniciar em modo desenvolvimento

```bash
shopify app dev
```

O CLI irá:

1. Criar um túnel (Cloudflare) para expor o app localmente
2. Atualizar a **App URL** no Partner Dashboard
3. Abrir o navegador para instalar o app na loja de desenvolvimento
4. Compilar as extensões (Theme + Web Pixel)

Na primeira execução, selecione:

- **Organization:** sua conta Partners
- **Development store:** sua loja de teste
- **Update URLs:** Yes

Após instalar, o app aparecerá em **Apps** no admin da Shopify.

---

## Passo 5 — Ativar Theme App Extension

1. No admin da loja: **Online Store** → **Themes**
2. Clique em **Customize** no tema ativo
3. No editor, clique no ícone **App embeds** (ícone de peça de quebra-cabeça)
4. Ative **Dreams SEO Pro**
5. Configure:
   - Lazy Load: ON
   - Resource Hints Level: 1, 2 ou 3
   - Schema Injection: ON
   - Font Optimization: ON
   - Delay JavaScript: conforme necessidade
6. Clique **Save**

---

## Passo 6 — Ativar Web Pixel Extension

1. No admin: **Settings** → **Customer events**
2. Encontre **Dreams SEO Pro Pixel**
3. Clique **Connect** / **Ativar**
4. Configure:
   - Account ID (Pixel ID / GA4 Measurement ID)
   - Meta Pixel Events: ON/OFF
   - GA4 Events: ON/OFF
   - TikTok Pixel Events: ON/OFF

---

## Passo 7 — Primeira auditoria

1. Abra o app **Dreams SEO Pro** no menu Apps
2. No **Dashboard**, clique **Executar Auditoria**
3. Aguarde a varredura (produtos, coleções, páginas, blog, imagens)
4. Revise os scores e métricas
5. Use **Correção em Massa** para otimizar automaticamente

---

## Passo 8 — Deploy para produção

### Hospedagem recomendada

- [Fly.io](https://fly.io)
- [Railway](https://railway.app)
- [Render](https://render.com)
- [Google Cloud Run](https://cloud.google.com/run)

### Build

```bash
npm run build
```

### Variáveis de ambiente (produção)

```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=(mesmos scopes do .env.example)
SHOPIFY_APP_URL=https://seu-dominio.com
DATABASE_URL=postgresql://user:pass@host:5432/dreams_seo
NODE_ENV=production
```

Para PostgreSQL em produção, altere em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Depois:

```bash
npx prisma migrate deploy
```

### Deploy das extensões

```bash
shopify app deploy
```

Confirme o deploy das extensões:

- `dreams-seo-theme` (Theme App Extension)
- `dreams-seo-pixel` (Web Pixel Extension)

### Atualizar URLs no Partner Dashboard

1. **Apps** → **Dreams SEO Pro** → **Configuration**
2. **App URL:** `https://seu-dominio.com`
3. **Allowed redirection URL(s):** `https://seu-dominio.com/auth/callback`
4. Salve

---

## Passo 9 — Instalar em loja real (produção)

1. No Partner Dashboard: **Apps** → **Dreams SEO Pro** → **Distribution**
2. Escolha **Custom distribution** (app interno) ou **Public** (App Store)
3. Gere o link de instalação
4. O lojista acessa o link e autoriza os scopes
5. Ative App Embeds e Web Pixel (Passos 5 e 6)

---

## Scopes necessários

O app solicita permissões para:

| Scope | Uso |
|-------|-----|
| read/write_products | SEO de produtos, ALT, meta tags |
| read/write_content | Páginas e blog |
| read/write_themes | Theme Audit |
| read/write_files | Image Optimizer |
| read/write_script_tags | Script Manager |
| read_customer_events, write_pixels | Web Pixel Extension |
| read_online_store_navigation | Broken Links (menus) |

---

## Comandos úteis

```bash
shopify app dev          # Desenvolvimento local
shopify app deploy       # Deploy extensões + config
shopify app config link  # Vincular app Partners
npm run build            # Build produção
npm run setup            # Prisma migrate + generate
shopify app env show     # Ver variáveis de ambiente
```

---

## Solução de problemas

### App não carrega no admin

- Verifique se `SHOPIFY_APP_URL` está correto
- Confirme que o túnel está ativo (`shopify app dev`)
- Limpe cache do navegador

### Erro de autenticação OAuth

- Verifique API Key e Secret no `.env`
- Confirme redirect URL: `https://SUA_URL/auth/callback`

### Extensões não aparecem no tema

- Execute `shopify app deploy`
- Verifique se a extensão está publicada no Partner Dashboard
- Recarregue o editor de temas

### Erro de scopes

- Atualize scopes no `.env` e `shopify.app.toml`
- Reinstale o app na loja

### Banco de dados

```bash
npx prisma migrate reset   # Reset dev (cuidado: apaga dados)
npx prisma studio          # Visualizar dados
```

---

## Estrutura de rotas do app

| Menu | URL |
|------|-----|
| Dashboard | `/app` |
| SEO Audit | `/app/seo-audit` |
| Products SEO | `/app/products-seo` |
| Collections SEO | `/app/collections-seo` |
| Pages SEO | `/app/pages-seo` |
| Blog SEO | `/app/blog-seo` |
| Images | `/app/images` |
| Performance | `/app/performance` |
| Cache | `/app/cache` |
| Script Manager | `/app/scripts` |
| Theme Audit | `/app/theme-audit` |
| Schema | `/app/schema` |
| Broken Links | `/app/broken-links` |
| Redirects | `/app/redirects` |
| Settings | `/app/settings` |

---

## Checklist pós-instalação

- [ ] App instalado na loja
- [ ] Theme App Extension ativado no editor de temas
- [ ] Web Pixel conectado em Customer Events
- [ ] Primeira auditoria executada
- [ ] Schemas ativados (Product, Organization, Breadcrumb)
- [ ] Resource Hints configurados (nível 1-3)
- [ ] Scripts/pixels configurados no Script Manager
- [ ] Deploy em produção (se aplicável)

---

**Dreams SEO Pro** — SEO avançado, performance e otimização para Shopify.
