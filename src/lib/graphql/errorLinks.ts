import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client";
import { makeStore } from "../store/store";
import { clearUser } from "../store/slice/userDataSlice";

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
    });
    if (response.ok) {
      return response.ok;
    }
    throw new Error("");
  } catch {
    throw new Error("");
  }
}

async function onLogout(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error("Logout failed");
    }
    const store = makeStore();
    store.dispatch(clearUser());
    const prefix = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "jw" : "jw";
    window.location.href = `/${prefix}/login`;
    return true;
  } catch {
    throw new Error("");
  }
}

export const errorLink = onError(
  ({
    graphQLErrors,
    networkError,
    operation,
    forward,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Observable<any> | void => {
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
                    onLogout();
                  }
                })
                .catch(() => {
                  onLogout();
                });
            });
          }

          case "FORBIDDEN": {
            const forbiddenPrefix = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "jw" : "jw";
            window.location.href = `/unauthorized?prefix=${forbiddenPrefix}`;
            break;
          }

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
