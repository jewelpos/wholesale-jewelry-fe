import { ApolloClient, InMemoryCache } from "@apollo/client";

// Used ONLY in Next.js Route Handlers (server-side).
// Node.js fetch requires an absolute URL — the /api/proxy/graphql path only works
// in the browser. Route handlers must call the backend origin directly.
const BACKEND_GRAPHQL_URL = `${process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com"}/graphql`;

export const apolloClientServer = new ApolloClient({
  uri: BACKEND_GRAPHQL_URL,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
  },
});
