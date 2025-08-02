import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { getEnvironmentConfig } from "./config/environment";
import { errorLink } from "./graphql/errorLinks";
import { authLink } from "./graphql/authLinks";

const config = getEnvironmentConfig();

const httpLink = createHttpLink({
  uri: config.graphqlUrl,
});

export const apolloClientAuthorized = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    addTypename: false
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
  },
});
