import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

type AdminClient = AdminApiContext["admin"];

export async function adminGraphql<T = Record<string, unknown>>(
  admin: AdminClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data: T | null; errors: string[] }> {
  try {
    const response = await admin.graphql(query, variables ? { variables } : undefined);
    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    const errors = json.errors?.map((e) => e.message) ?? [];
    if (errors.length > 0) {
      console.error("[GraphQL]", errors.join("; "));
    }

    return { data: json.data ?? null, errors };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido na API GraphQL";
    console.error("[GraphQL throw]", message);
    return { data: null, errors: [message] };
  }
}
