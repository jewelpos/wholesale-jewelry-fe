"use client";

import { useEffect, useRef, useState } from "react";
import { logoutAndRedirect } from "@/lib/graphql/errorLinks";
import { Clock, LogIn, LogOut, RefreshCw } from "react-feather";

const IDLE_WARN_MS   = 45 * 60 * 1000;
const IDLE_CHECK_MS  = 60 * 1000;
const COUNTDOWN_SECS = 10 * 60;

type Reason     = "idle" | "expired";
type ModalState = "prompt" | "resuming" | "resume-failed" | "logging-out";

export default function SessionExpiredModal() {
  const [visible,   setVisible]   = useState(false);
  const [reason,    setReason]    = useState<Reason>("expired");
  const [state,     setState]     = useState<ModalState>("prompt");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);

  const lastActivity  = useRef(Date.now());
  const idleWarned    = useRef(false);
  const expiredShown  = useRef(false);

  // ── Activity tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    const reset = () => { lastActivity.current = Date.now(); };
    const evts = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    evts.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => evts.forEach(e => window.removeEventListener(e, reset));
  }, []);

  // ── Proactive token refresh every 29 min while user is active ─────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (visible) return;
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {/* silent */});
    }, 55 * 60 * 1000);
    return () => clearInterval(id);
  }, [visible]);

  // ── Idle check every 60 s ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (visible || idleWarned.current) return;
      if (Date.now() - lastActivity.current >= IDLE_WARN_MS) {
        idleWarned.current = true;
        setReason("idle");
        setState("prompt");
        setVisible(true);
      }
    }, IDLE_CHECK_MS);
    return () => clearInterval(id);
  }, [visible]);

  // ── Session-expired event from Apollo error link ───────────────────────────
  useEffect(() => {
    const handler = () => {
      if (expiredShown.current) return;
      expiredShown.current = true;
      setReason("expired");
      setState("prompt");
      setVisible(true);
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);

  // ── Countdown — only active on idle prompt ─────────────────────────────────
  useEffect(() => {
    if (!visible || reason !== "idle" || state !== "prompt") return;
    setCountdown(COUNTDOWN_SECS);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          // Switch to "expired" prompt — user can still Resume if refresh token is valid.
          // Actual logout only happens if they click Log Out or Resume fails.
          setReason("expired");
          setState("prompt");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [visible, reason, state]);

  if (!visible) return null;

  const handleResume = async () => {
    setState("resuming");
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        if (reason === "idle") {
          // Token refreshed — dismiss the modal without a full page reload
          setVisible(false);
          idleWarned.current   = false;
          expiredShown.current = false;
          lastActivity.current = Date.now();
        } else {
          // Apollo's operation cache may reference stale tokens; reload to reconnect
          setTimeout(() => window.location.reload(), 400);
        }
        return;
      }
    } catch { /* fall through */ }
    setState("resume-failed");
  };

  const handleLogout = async () => {
    setState("logging-out");
    await logoutAndRedirect();
  };

  const isLoading = state === "resuming" || state === "logging-out";

  const pct  = (countdown / COUNTDOWN_SECS) * 100;
  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, "0");
  const barClass = countdown > 300 ? "bg-primary" : countdown > 120 ? "bg-warning" : "bg-danger";

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99999 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Clock size={16} />
              {reason === "idle" ? "Are you still there?" : "Session Expired"}
            </h5>
          </div>

          <div className="modal-body">

            {/* Countdown progress bar — idle only */}
            {reason === "idle" && state === "prompt" && (
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Session closes in</small>
                  <small className={`fw-semibold ${countdown <= 120 ? "text-danger" : countdown <= 300 ? "text-warning" : "text-primary"}`}>
                    {mins}:{secs}
                  </small>
                </div>
                <div className="progress" style={{ height: 5 }}>
                  <div
                    className={`progress-bar ${barClass}`}
                    style={{ width: `${pct}%`, transition: "width 1s linear" }}
                  />
                </div>
              </div>
            )}

            {state !== "resume-failed" ? (
              <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                {reason === "idle"
                  ? "You've been inactive for 45 minutes. Click Continue Working to stay logged in, or log out if you're done."
                  : "Your session has expired. Please log in again to continue."}
              </p>
            ) : (
              <div className="alert alert-danger mb-0 py-2" style={{ fontSize: 13 }}>
                Session could not be resumed — the login token has fully expired. Please log in again.
              </div>
            )}

          </div>

          <div className="modal-footer">
            {/* Resume only offered during idle warning — not when session is already expired via API */}
            {state !== "resume-failed" && reason === "idle" && (
              <button
                className="btn btn-submit d-flex align-items-center gap-2"
                onClick={handleResume}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={state === "resuming" ? "spin" : ""} />
                {state === "resuming" ? "Resuming…" : "Continue Working"}
              </button>
            )}
            <button
              className={`btn d-flex align-items-center gap-2 ${(state === "resume-failed" || reason === "expired") ? "btn-submit" : "btn-cancel"}`}
              onClick={handleLogout}
              disabled={isLoading}
            >
              {(state === "resume-failed" || reason === "expired")
                ? <><LogIn size={14} />{state === "logging-out" ? "Logging out…" : "Log In Again"}</>
                : <><LogOut size={14} />{state === "logging-out" ? "Logging out…" : "Log Out"}</>}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
