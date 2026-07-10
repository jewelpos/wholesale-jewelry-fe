import { ApolloError } from "@apollo/client";
import axios from "axios";

export async function handleTryCatch<T>(
  fn: () => Promise<T>,
  finallyFn?: () => void
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await fn();
    return { data };
  } catch (error: unknown) {
    let errorMessage = "";
    if (error instanceof ApolloError) {
      errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        "An unexpected error occurred. Please try again.";
    } else if (axios.isAxiosError(error)) {
      errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred. Please try again.";
    } else if (error instanceof Error) {
      errorMessage = error?.message;
    } else {
      errorMessage = "An unexpected error occurred. Please try again.";
    }
    return { error: errorMessage };
  } finally {
    if (finallyFn) finallyFn();
  }
}
