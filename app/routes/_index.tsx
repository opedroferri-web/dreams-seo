import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { LoginErrorType } from "@shopify/shopify-app-remix/server";
import { login } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  const errors = await login(request);
  return json({ errors });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = await login(request);
  return json({ errors });
};

export default function Index() {
  const { errors: loaderErrors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors ?? loaderErrors;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "420px",
        margin: "4rem auto",
        padding: "0 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Dreams SEO</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Informe o domínio da loja para acessar o app.
      </p>
      <Form method="post">
        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
            Loja Shopify
          </span>
          <input
            type="text"
            name="shop"
            placeholder="sua-loja.myshopify.com"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </label>
        {errors?.shop === LoginErrorType.MissingShop && (
          <p style={{ color: "#b00020", marginBottom: "1rem" }}>Informe o domínio da loja.</p>
        )}
        {errors?.shop === LoginErrorType.InvalidShop && (
          <p style={{ color: "#b00020", marginBottom: "1rem" }}>Domínio inválido. Use o formato sua-loja.myshopify.com</p>
        )}
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#008060",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </Form>
    </div>
  );
}
