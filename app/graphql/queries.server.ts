export const GET_SHOP = `#graphql
  query GetShop {
    shop {
      id
      name
      myshopifyDomain
      primaryDomain {
        url
        host
      }
      currencyCode
      description
    }
  }
`;

export const GET_PRODUCTS_SEO = `#graphql
  query GetProductsSeo($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          seo {
            title
            description
          }
          featuredMedia {
            ... on MediaImage {
              id
              alt
              image {
                url
                width
                height
              }
            }
          }
          media(first: 20) {
            edges {
              node {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_COLLECTIONS_SEO = `#graphql
  query GetCollectionsSeo($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          seo {
            title
            description
          }
          image {
            altText
            url
          }
        }
      }
    }
  }
`;

export const GET_PAGES_SEO = `#graphql
  query GetPagesSeo($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          bodySummary
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_BLOGS_SEO = `#graphql
  query GetBlogsSeo($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          title
          handle
          articles(first: 50) {
            edges {
              node {
                id
                title
                handle
                summary
                body
                image {
                  altText
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_FILES = `#graphql
  query GetFiles($first: Int!, $after: String) {
    files(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ... on MediaImage {
            id
            alt
            fileStatus
            image {
              url
              width
              height
            }
          }
        }
      }
    }
  }
`;

export const GET_THEME = `#graphql
  query GetMainTheme {
    themes(first: 1, roles: [MAIN]) {
      edges {
        node {
          id
          name
          role
        }
      }
    }
  }
`;

export const GET_THEME_ASSETS = `#graphql
  query GetThemeAssets($themeId: ID!) {
    theme(id: $themeId) {
      id
      name
      files(first: 250) {
        edges {
          node {
            filename
            size
            contentType
          }
        }
      }
    }
  }
`;

export const GET_SCRIPT_TAGS = `#graphql
  query GetScriptTags {
    scriptTags(first: 50) {
      edges {
        node {
          id
          src
          displayScope
          createdAt
        }
      }
    }
  }
`;

export const GET_URL_REDIRECTS = `#graphql
  query GetUrlRedirects($first: Int!, $after: String) {
    urlRedirects(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          path
          target
        }
      }
    }
  }
`;

export const GET_INSTALLED_APPS = `#graphql
  query GetInstalledApps {
    currentAppInstallation {
      id
      app {
        title
      }
    }
  }
`;

export const GET_MENUS = `#graphql
  query GetMenus($first: Int!) {
    menus(first: $first) {
      edges {
        node {
          id
          title
          handle
          items {
            id
            title
            url
            type
          }
        }
      }
    }
  }
`;

export const GET_METAFIELDS = `#graphql
  query GetProductMetafields($id: ID!) {
    product(id: $id) {
      metafields(first: 20, namespace: "global") {
        edges {
          node {
            key
            value
            namespace
          }
        }
      }
    }
  }
`;
