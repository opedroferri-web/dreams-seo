# Dreams SEO Pro

Suite completa de SEO, Performance, Scripts, Cache, Auditoria Técnica e Otimização para Shopify.

## Stack

- **Frontend:** React, Shopify Polaris, App Bridge, TypeScript
- **Backend:** Remix (Shopify), Node.js, TypeScript
- **APIs:** Shopify Admin GraphQL, Theme API, Storefront API
- **Extensões:** Theme App Extension + Web Pixel Extension
- **Database:** Prisma + SQLite (dev) / PostgreSQL (prod)

## Estrutura

```
dreams-seo-pro/
├── app/
│   ├── components/          # Componentes Polaris reutilizáveis
│   ├── graphql/             # Queries e Mutations GraphQL
│   ├── lib/                 # Tipos, regras SEO, scoring
│   ├── routes/              # Rotas Remix (15 módulos)
│   ├── services/            # Auditoria, otimização, AI assistant
│   ├── db.server.ts
│   └── shopify.server.ts
├── extensions/
│   ├── dreams-seo-theme/    # Theme App Extension (App Embeds)
│   └── dreams-seo-pixel/    # Web Pixel Extension
├── prisma/
│   └── schema.prisma
├── shopify.app.toml
└── package.json
```

## Módulos

| Rota | Funcionalidade |
|------|----------------|
| `/app` | Dashboard com scores e métricas |
| `/app/seo-audit` | Auditoria completa + correção em massa |
| `/app/products-seo` | SEO de produtos |
| `/app/collections-seo` | SEO de coleções |
| `/app/pages-seo` | SEO de páginas |
| `/app/blog-seo` | SEO de blog |
| `/app/images` | Image Optimizer |
| `/app/performance` | Performance Analyzer + App Impact |
| `/app/cache` | Cache Engine (resource hints, lazy load, delay JS) |
| `/app/scripts` | Script Manager + Pixel templates |
| `/app/theme-audit` | Theme Audit |
| `/app/schema` | Schema Manager |
| `/app/broken-links` | Broken Links scanner |
| `/app/redirects` | Redirect Manager (301/302, CSV) |
| `/app/settings` | Configurações avançadas |

## Desenvolvimento Local

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

## Deploy

```bash
npm run build
npm run deploy
```

Consulte o manual de instalação completo abaixo na seção "Manual de Instalação".
