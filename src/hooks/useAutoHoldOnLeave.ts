import { useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { SAVE_INVOICE_HOLD_MUTATION } from "@/lib/graphql/mutations/invoiceHold";

// Backs "which hold am I currently resuming" with sessionStorage instead of a plain
// React ref. A plain useRef's value only lives as long as this exact component
// instance does — if anything ever remounts the form (a key change, a route-level
// re-render, React recovering from an error boundary, etc.) a bare ref silently resets
// to null and the very next Hold click creates a duplicate row instead of updating the
// one the user is actually working on. sessionStorage survives all of that within the
// same tab, and clears itself when the tab closes (never leaks across a fresh session).
// A Proxy lets every existing `ref.current = x` assignment throughout the invoice form
// keep working unchanged while transparently persisting each write.
function makePersistedHoldIdRef(storageKey: string): React.MutableRefObject<number | null> {
  let initial: number | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw != null ? Number(raw) : NaN;
      if (Number.isFinite(parsed)) initial = parsed;
    } catch {
      // sessionStorage unavailable (SSR, privacy mode, quota) — falls back to
      // in-memory-only behavior, same as the plain ref this replaces.
    }
  }
  const box: React.MutableRefObject<number | null> = { current: initial };
  return new Proxy(box, {
    set(target, prop, value) {
      if (prop === "current") {
        target.current = value;
        if (typeof window !== "undefined") {
          try {
            if (value == null) sessionStorage.removeItem(storageKey);
            else sessionStorage.setItem(storageKey, String(value));
          } catch {
            // ignore — worst case this falls back to in-memory-only for this write
          }
        }
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });
}

export interface AutoHoldPayload {
  holdname: string;
  customerid: number | null;
  formdata: unknown;
}

interface UseAutoHoldOnLeaveParams {
  /** Only auto-hold for fresh-creation flows — pass false while editing/viewing an
   * already-saved document, since resuming a hold creates a NEW record rather than
   * updating the one being edited. */
  enabled: boolean;
  isDirty: boolean;
  /** Cheap check for "is there actually anything worth saving" (e.g. a customer picked
   * or at least one line item) — an untouched blank form has nothing to lose. */
  hasContent: () => boolean;
  getHoldPayload: () => AutoHoldPayload;
  storeid: number;
  outletid: number;
  doctype: string;
}

/**
 * Silently saves the in-progress form as a Hold when the component unmounts (i.e. the
 * user navigates away by any means — sidebar click, back button, breadcrumb) while it
 * still has unsaved changes. Registered once (empty deps) so the cleanup fires exactly
 * once on unmount; reads live state from a ref instead of a stale closure so it always
 * sees the form's latest values regardless of when the user actually leaves.
 *
 * Returns:
 *   - currentHoldIdRef: id of "this session's" hold (if any) — the consuming form must
 *     set it when resuming an existing hold, so leaving again updates that same row
 *     instead of creating a duplicate, and clear it after the document is successfully
 *     created or the user explicitly discards that hold.
 *   - suppressAutoHoldRef: set this to true as the very first thing on successful save —
 *     the form can stay "dirty" for a long time afterward (payment/print/email flows
 *     often don't reset() until several user interactions later), and an unmount
 *     anywhere in that window must not resurrect a hold for data that's already saved.
 */
export function useAutoHoldOnLeave({
  enabled,
  isDirty,
  hasContent,
  getHoldPayload,
  storeid,
  outletid,
  doctype,
}: UseAutoHoldOnLeaveParams) {
  const apolloClient = useApolloClient();
  const dispatch = useAppDispatch();
  // Lazy one-time init (the function only runs on the first render; React guarantees
  // the returned state value's identity is stable across re-renders thereafter,
  // exactly like a ref would be) — scoped by doctype so INVOICE and MEMO sessions in
  // the same tab never share one "current hold" pointer.
  const [currentHoldIdRef] = useState(() => makePersistedHoldIdRef(`invoiceHold:currentId:${doctype}`));
  // Once the document this form was building has actually been saved for real, there is
  // nothing left to protect — flip this (before any reset()/navigation, which may happen
  // much later through a payment/print/email flow with the form still "dirty" the whole
  // time) so an unmount anywhere in that window can't resurrect a hold for data that's
  // already been submitted.
  const suppressAutoHoldRef = useRef(false);

  const latestRef = useRef({ enabled, isDirty, hasContent, getHoldPayload, storeid, outletid, doctype });
  latestRef.current = { enabled, isDirty, hasContent, getHoldPayload, storeid, outletid, doctype };

  useEffect(() => {
    // TEMP DIAGNOSTIC — remove once the "adding an item forces a new hold instead of
    // updating" report is root-caused. If this logs more than once for a single visit
    // to the invoice page, the component (and therefore currentHoldIdRef) is remounting.
    // eslint-disable-next-line no-console
    console.log("[useAutoHoldOnLeave] mounted, currentHoldIdRef =", currentHoldIdRef.current);
    return () => {
      // eslint-disable-next-line no-console
      console.log("[useAutoHoldOnLeave] unmounting, suppressed =", suppressAutoHoldRef.current, "currentHoldIdRef =", currentHoldIdRef.current);
      if (suppressAutoHoldRef.current) return;
      const { enabled, isDirty, hasContent, getHoldPayload, storeid, outletid, doctype } = latestRef.current;
      if (!enabled || !isDirty) return;
      if (!hasContent()) return;

      const payload = getHoldPayload();
      apolloClient
        .mutate({
          mutation: SAVE_INVOICE_HOLD_MUTATION,
          variables: {
            input: {
              holdid: currentHoldIdRef.current ?? undefined,
              storeid,
              outletid,
              doctype,
              holdname: payload.holdname,
              customerid: payload.customerid,
              formdata: payload.formdata,
            },
          },
        })
        .then(({ data }) => {
          const id = data?.saveInvoiceHold?.holdid;
          if (id) currentHoldIdRef.current = id;
          // Fired only after the save actually succeeds — telling the user it's "held"
          // when the background save silently failed would be worse than saying nothing.
          dispatch(
            showNotification({
              message: "Unsaved work was held automatically — resume it from Held Invoices.",
              type: NOTIFICATION_TYPES.INFO,
              duration: 5000,
            })
          );
        })
        .catch(() => {
          // Best-effort safety net, not a guarantee — by the time this rejects the user
          // has already navigated away, so there's nothing useful left to surface.
        });
    };
    // Intentionally empty — this must register exactly once so cleanup fires exactly
    // once on unmount; latestRef is what keeps it seeing current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { currentHoldIdRef, suppressAutoHoldRef };
}
