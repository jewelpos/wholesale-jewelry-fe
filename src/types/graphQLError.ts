import { ApolloError } from "@apollo/client";

type GraphQLLocation = {
  line: number;
  column: number;
};

type GraphQLPath = (string | number)[];

type GraphQLError = {
  message: string;
  locations?: GraphQLLocation[];
  path?: GraphQLPath;
  extensions?: Record<string, any>;
};

export type ApolloGraphQLError = ApolloError & {
  graphQLErrors: GraphQLError[];
  networkError?: Error | null;
  extraInfo?: any;
};
