import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client";
import { makeStore } from "../store/store";

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const errorLink = onError(
  ({
    graphQLErrors,
    networkError,
    operation,
    forward,
  }): Observable<any> | void => {
    const store = makeStore();
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        switch (err.extensions?.code) {
          case "UNAUTHENTICATED": {
            return new Observable((observer) => {
              // Attempt token refresh
              refreshToken()
                .then((success) => {
                  if (success) {
                    // Retry the failed request
                    const subscriber = {
                      next: observer.next.bind(observer),
                      error: observer.error.bind(observer),
                      complete: observer.complete.bind(observer),
                    };
                    forward(operation).subscribe(subscriber);
                  } else {
                    // Redirect to login if refresh fails
                    window.location.href = "/login";
                  }
                })
                .catch(() => {
                  window.location.href = "/login";
                });
            });
          }

          case "FORBIDDEN":
            window.location.href = "/unauthorized";
            break;

          default:
            console.error(
              `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
            );
        }
      }
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  }
);
