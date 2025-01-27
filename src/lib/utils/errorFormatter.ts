import { ApolloGraphQLError } from "@/types/graphQLError";

export const errorMessage = (error: ApolloGraphQLError) => {
  const errorMessage =
    error?.graphQLErrors?.[0]?.message ||
    error?.networkError?.message ||
    error?.message ||
    "An unexpected error occurred. Please try again.";
  return errorMessage;
};
