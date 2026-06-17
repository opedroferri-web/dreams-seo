export const UPDATE_PRODUCT_SEO = `#graphql
  mutation UpdateProductSeo($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        handle
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_COLLECTION_SEO = `#graphql
  mutation UpdateCollectionSeo($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        title
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_PAGE = `#graphql
  mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_MEDIA_ALT = `#graphql
  mutation UpdateMediaAlt($input: [FileUpdateInput!]!) {
    fileUpdate(files: $input) {
      files {
        ... on MediaImage {
          id
          alt
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_URL_REDIRECT = `#graphql
  mutation CreateUrlRedirect($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect {
        id
        path
        target
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_URL_REDIRECT = `#graphql
  mutation DeleteUrlRedirect($id: ID!) {
    urlRedirectDelete(id: $id) {
      deletedUrlRedirectId
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_SCRIPT_TAG = `#graphql
  mutation CreateScriptTag($input: ScriptTagInput!) {
    scriptTagCreate(input: $input) {
      scriptTag {
        id
        src
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_SCRIPT_TAG = `#graphql
  mutation DeleteScriptTag($id: ID!) {
    scriptTagDelete(id: $id) {
      deletedScriptTagId
      userErrors {
        field
        message
      }
    }
  }
`;

export const BULK_UPDATE_PRODUCTS = `#graphql
  mutation BulkUpdateProducts($input: [ProductInput!]!) {
    productUpdate(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_ARTICLE = `#graphql
  mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_METAFIELD = `#graphql
  mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;
