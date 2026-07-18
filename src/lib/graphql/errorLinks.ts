import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client";

// Once session is fully dead, swallow every subsequent Apollo error silently.
// Resets on page reload (which the Resume button triggers).
let sessionExpiredFlag = false;

// Singleton refresh: all concurrent 401 handlers share one request so the
// refresh token is never used twice (rotation would invalidate the first caller's result).
let inflightRefresh: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (!inflightRefresh) {
    inflightRefresh = fetch("/api/auth/refresh", { method: "POST" })
      .then(r => {
        if (r.ok) return true;
        throw new Error("");
      })
      .finally(() => {
        setTimeout(() => { inflightRefresh = null; }, 1000);
      });
  }
  return inflightRefresh;
}

// Called when the refresh token is itself expired — can't silently recover.
// Fires a DOM event so SessionExpiredModal can show a friendly dialog.
function notifySessionExpired() {
  sessionExpiredFlag = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("session-expired"));
  }
}

// Used by SessionExpiredModal's "Log In Again" button.
export async function logoutAndRedirect(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch { /* best effort */ }
  const prefix = window.location.pathname.split("/")[1] || "jw";
  window.location.href = `/${prefix}/login`;
}

const handleUnauth = (operation: Parameters<Parameters<typeof onError>[0]>[0]["operation"], forward: Parameters<Parameters<typeof onError>[0]>[0]["forward"]) =>
  new Observable((observer) => {
    if (sessionExpiredFlag) { observer.complete(); return; }
    refreshToken()
      .then((success) => {
        if (success) {
          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        } else {
          notifySessionExpired();
          observer.complete();
        }
      })
      .catch(() => { notifySessionExpired(); observer.complete(); });
  });

export const errorLink = onError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ graphQLErrors, networkError, operation, forward }): Observable<any> | void => {
    // Session is dead — swallow everything silently to stop console spam
    if (sessionExpiredFlag) return;

    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        switch (err.extensions?.code) {
          case "UNAUTHENTICATED":
            return handleUnauth(operation, forward);

          case "FORBIDDEN": {
            const prefix = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "jw" : "jw";
            window.location.href = `/unauthorized?prefix=${prefix}`;
            break;
          }

          default:
            // NestJS guards throw Unauthorized without setting extensions.code
            if (err.message === "Unauthorized") {
              return handleUnauth(operation, forward);
            }
            if (process.env.NODE_ENV !== "production") {
              console.error(
                `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
              );
            }
        }
      }
    }
    if (networkError) {
      if ("statusCode" in networkError && networkError.statusCode === 401) {
        return handleUnauth(operation, forward);
      }
      if (process.env.NODE_ENV !== "production") {
        console.error(`[Network error]: ${networkError}`);
      }
    }
  }
);
