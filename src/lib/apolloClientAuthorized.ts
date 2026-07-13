import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { getEnvironmentConfig } from "./config/environment";
import { errorLink } from "./graphql/errorLinks";

const config = getEnvironmentConfig();

const httpLink = createHttpLink({
  uri: typeof window !== "undefined" ? "/api/proxy/graphql" : config.graphqlUrl,
});

// authLink removed: /api/proxy/graphql reads the accessToken cookie server-side (M2 fix)
export const apolloClientAuthorized = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    addTypename: false
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
  },
});
