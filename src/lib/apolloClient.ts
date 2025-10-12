import { ApolloClient, InMemoryCache } from "@apollo/client";
import { getEnvironmentConfig } from "./config/environment";

const config = getEnvironmentConfig();
console.log('jwe', config.graphqlUrl);

export const apolloClient = new ApolloClient({
  uri: config.graphqlUrl,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
  },
});
