import { register } from "@shopify/web-pixels-extension";

function isEnabled(value: string | undefined): boolean {
  return value?.toLowerCase() === "true" || value === "1";
}

register(({ analytics, browser, settings }) => {
  analytics.subscribe("page_viewed", (event) => {
    console.debug("[Dreams SEO Pro] Page viewed", event.context.document.location.href);
  });

  analytics.subscribe("product_viewed", (event) => {
    const product = event.data?.productVariant;
    console.debug("[Dreams SEO Pro] Product viewed", product?.product?.title);
  });

  analytics.subscribe("product_added_to_cart", (event) => {
    const cartLine = event.data?.cartLine;
    console.debug("[Dreams SEO Pro] Add to cart", cartLine?.merchandise?.product?.title);

    if (isEnabled(settings.enableMetaPixel) && browser) {
      browser.sendBeacon(
        "https://www.facebook.com/tr",
        new URLSearchParams({
          id: settings.accountID || "",
          ev: "AddToCart",
          cd: JSON.stringify({
            content_name: cartLine?.merchandise?.product?.title,
            value: cartLine?.cost?.totalAmount?.amount,
            currency: cartLine?.cost?.totalAmount?.currencyCode,
          }),
        }),
      );
    }
  });

  analytics.subscribe("checkout_started", () => {
    console.debug("[Dreams SEO Pro] Begin checkout");

    if (isEnabled(settings.enableGA4) && browser) {
      browser.sendBeacon(
        "https://www.google-analytics.com/mp/collect",
        JSON.stringify({
          client_id: settings.accountID,
          events: [{ name: "begin_checkout", params: {} }],
        }),
      );
    }
  });

  analytics.subscribe("checkout_completed", (event) => {
    const checkout = event.data?.checkout;
    console.debug("[Dreams SEO Pro] Purchase", checkout?.order?.id);

    if (isEnabled(settings.enableMetaPixel) && browser) {
      browser.sendBeacon(
        "https://www.facebook.com/tr",
        new URLSearchParams({
          id: settings.accountID || "",
          ev: "Purchase",
          cd: JSON.stringify({
            value: checkout?.totalPrice?.amount,
            currency: checkout?.totalPrice?.currencyCode,
            order_id: checkout?.order?.id,
          }),
        }),
      );
    }

    if (isEnabled(settings.enableTikTok) && browser) {
      browser.sendBeacon(
        "https://analytics.tiktok.com/api/v2/pixel/track/",
        JSON.stringify({
          pixel_code: settings.accountID,
          event: "CompletePayment",
          properties: {
            value: checkout?.totalPrice?.amount,
            currency: checkout?.totalPrice?.currencyCode,
          },
        }),
      );
    }
  });

  analytics.subscribe("search_submitted", (event) => {
    console.debug("[Dreams SEO Pro] Search", event.data?.searchResult?.query);
  });
});
