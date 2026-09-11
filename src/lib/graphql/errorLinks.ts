import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client";

// Once session is fully dead, swallow every subsequent Apollo error silently.
// Resets on page reload (which the Resume button triggers).
let sessionExpiredFlag = false;

// Singleton refresh (same-tab): all concurrent 401 handlers in THIS tab share one
// in-flight request so the refresh token is never used twice from here alone.
let inflightRefresh: Promise<boolean> | null = null;

// Cross-tab coordination — the same-tab singleton above doesn't help when the SAME
// session is open in two tabs/windows (common: invoice in one tab, inventory in
// another). The backend rotates the refresh token on every use, so two independent
// tabs each running their own 55-min proactive timer (see SessionExpiredModal) can
// still land on /api/auth/refresh close together, race over the same single-use
// token, and force-log-out an otherwise still-active user — the exact bug the
// same-tab singleton was built for, just one level up. Web Locks give every tab in
// the origin a real mutual-exclusion primitive for free (auto-queues waiters,
// auto-releases if a tab crashes/closes, no manual TTL/staleness bookkeeping needed).
const CROSS_TAB_LOCK_NAME = "jewelpos-auth-refresh";
// Shared across tabs via localStorage: when did a refresh last actually complete? A
// tab that was queued behind another tab's lock uses this to recognize "someone else
// just rotated the token for me" and skip doing a second, redundant, wasteful (and
// itself rotation-racy) refresh of its own.
const LAST_REFRESH_KEY = "jewelpos_last_token_refresh";
const MIN_REFRESH_INTERVAL_MS = 5000;

// Exported for SessionExpiredModal's visibility-change catch-up check — background
// tabs get their setInterval timers throttled by the browser, so a tab can come back
// into focus well past its next scheduled proactive refresh. Reading this shared,
// cross-tab timestamp lets it decide "is a refresh actually overdue right now?"
// instead of waiting for its own possibly-delayed timer to eventually fire.
export function getLastTokenRefreshAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(LAST_REFRESH_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function setLastTokenRefreshAt(ts: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_REFRESH_KEY, String(ts));
  } catch { /* storage unavailable (private mode, quota) — cross-tab skip just won't trigger */ }
}

async function doRefreshFetch(): Promise<boolean> {
  const ok = await fetch("/api/auth/refresh", { method: "POST" }).then(r => r.ok);
  if (!ok) throw new Error("");
  setLastTokenRefreshAt(Date.now());
  return true;
}

// Exported so every refresh trigger in the app (a 401 here, the idle modal's proactive
// timer, its "Continue Working" button, the axios interceptor) shares this one path.
export async function refreshToken(): Promise<boolean> {
  if (!inflightRefresh) {
    inflightRefresh = runCoordinatedRefresh().finally(() => {
      setTimeout(() => { inflightRefresh = null; }, 1000);
    });
  }
  return inflightRefresh;
}

async function runCoordinatedRefresh(): Promise<boolean> {
  // No Web Locks support (very old browser) — fall back to the previous same-tab-only
  // behavior rather than failing outright.
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return doRefreshFetch();
  }
  return navigator.locks.request(CROSS_TAB_LOCK_NAME, async () => {
    // We now hold the cross-tab lock. If another tab held it moments ago and already
    // completed a refresh while we were queued, don't rotate the token again — just
    // report success; our own cookies were updated by that other tab's response.
    if (Date.now() - getLastTokenRefreshAt() < MIN_REFRESH_INTERVAL_MS) {
      return true;
    }
    return doRefreshFetch();
  });
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
            // Log before the hard redirect — otherwise a single failing request among
            // many concurrent ones bounces the whole page with zero trace of which
            // operation/variables actually triggered it.
            console.error(
              `[GraphQL FORBIDDEN]: operation=${operation.operationName}, variables=${JSON.stringify(operation.variables)}, message=${err.message}`
            );
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
