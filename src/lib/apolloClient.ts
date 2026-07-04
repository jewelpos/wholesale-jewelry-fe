import { ApolloClient, InMemoryCache } from "@apollo/client";
import { getEnvironmentConfig } from "./config/environment";

const config = getEnvironmentConfig();

const graphqlUri = typeof window !== "undefined" ? "/api/proxy/graphql" : config.graphqlUrl;

export const apolloClient = new ApolloClient({
  uri: graphqlUri,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
  },
});
