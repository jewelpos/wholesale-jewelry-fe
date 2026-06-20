import { ApolloClient, InMemoryCache } from "@apollo/client";

// Route handlers (login, refresh) use this client on the server side.
// Node.js fetch requires an absolute URL — relative paths like /api/proxy/graphql
// are not valid in server-side fetch. Use the backend origin directly on the server;
// use the proxy path on the client so browsers don't hit HTTP from an HTTPS page.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://104.248.51.192:3129";
const graphqlUrl =
  typeof window === "undefined"
    ? `${BACKEND_ORIGIN}/graphql`
    : (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "/api/proxy/graphql");

export const apolloClient = new ApolloClient({
  uri: graphqlUrl,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
  },
});
