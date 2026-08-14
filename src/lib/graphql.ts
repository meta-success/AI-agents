import { gql, request } from "graphql-request";

const DEFAULT_ENDPOINT = "https://countries.trevorblades.com/";

export type GraphQLVariables = Record<string, unknown>;

/**
 * Sends a GraphQL query string to an external GraphQL endpoint and returns the data.
 * Used for RAG-style context retrieval before the OpenAI analysis step.
 */
export async function fetchGraphQLData<T = unknown>(
  query: string,
  variables?: GraphQLVariables,
  endpoint = process.env.GRAPHQL_ENDPOINT || DEFAULT_ENDPOINT
): Promise<T> {
  return request<T>(endpoint, query, variables);
}

/** Sample query used to enrich analysis with structured world knowledge. */
export const CONTEXT_ENRICHMENT_QUERY = gql`
  query ContextEnrichment($code: ID!) {
    country(code: $code) {
      name
      capital
      currency
      continent {
        name
      }
      languages {
        name
      }
    }
  }
`;

/**
 * Attempts to pull structured GraphQL context when the user mentions a country code
 * (e.g. "US", "JP", "DE"). Falls back gracefully if nothing matches.
 */
export async function retrieveRagContext(text: string, question: string): Promise<string> {
  const combined = `${text}\n${question}`.toUpperCase();
  const match = combined.match(/\b([A-Z]{2})\b/);
  if (!match) {
    return "No external GraphQL context matched this query.";
  }

  const code = match[1];

  try {
    const data = await fetchGraphQLData<{
      country: {
        name: string;
        capital: string | null;
        currency: string | null;
        continent: { name: string } | null;
        languages: { name: string }[];
      } | null;
    }>(CONTEXT_ENRICHMENT_QUERY, { code });

    if (!data.country) {
      return `GraphQL lookup for country code "${code}" returned no results.`;
    }

    const { name, capital, currency, continent, languages } = data.country;
    const langs = languages.map((l) => l.name).join(", ") || "n/a";

    return [
      `Retrieved via GraphQL (country code: ${code}):`,
      `- Country: ${name}`,
      `- Capital: ${capital ?? "n/a"}`,
      `- Currency: ${currency ?? "n/a"}`,
      `- Continent: ${continent?.name ?? "n/a"}`,
      `- Languages: ${langs}`,
    ].join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown GraphQL error";
    return `GraphQL context retrieval failed: ${message}`;
  }
}
