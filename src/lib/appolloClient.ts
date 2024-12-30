// lib/apolloClient.js
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://your-graphql-endpoint.com/graphql", // Replace with your GraphQL endpoint
  cache: new InMemoryCache(),
});

export default client;
