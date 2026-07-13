"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { Mail, ArrowRight, Shield, Lock, Eye, EyeOff, ArrowLeft } from "react-feather";
import {
  REQUEST_PASSWORD_RESET_OTP_MUTATION,
  VERIFY_PASSWORD_RESET_OTP_MUTATION,
  RESET_PASSWORD_MUTATION,
} from "@/lib/graphql/mutations/auth";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

type Step = 1 | 2 | 3;

const RESEND_COOLDOWN = 60;

const ForgotPasswordForm = () => {
  const { storePrefix } = useParams<{ storePrefix: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [requestOTP, { loading: requestLoading }] = useMutation(REQUEST_PASSWORD_RESET_OTP_MUTATION);
  const [verifyOTP, { loading: verifyLoading }] = useMutation(VERIFY_PASSWORD_RESET_OTP_MUTATION);
  const [resetPassword, { loading: resetLoading }] = useMutation(RESET_PASSWORD_MUTATION);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Step 1: send OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Enter a valid email address"); return; }
    if (!turnstileToken) { setServerError("Security check not completed. Please wait a moment and try again."); return; }
    setEmailError("");
    // Verify Turnstile token before sending OTP
    const captchaRes = await fetch("/api/auth/verify-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });
    if (!captchaRes.ok) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setServerError("Security check failed. Please refresh and try again.");
      return;
    }
    try {
      const { data } = await requestOTP({ variables: { email } });
      if (data?.requestPasswordResetOTP?.success) {
        setStep(2);
        setResendTimer(RESEND_COOLDOWN);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setServerError(data?.requestPasswordResetOTP?.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setServerError(err?.graphQLErrors?.[0]?.message || "An error occurred");
    }
  };

  // OTP box handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setServerError("");
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Enter the 6-digit code"); return; }
    try {
      const { data } = await verifyOTP({ variables: { email, otp: code } });
      if (data?.verifyPasswordResetOTP?.success) {
        setResetToken(data.verifyPasswordResetOTP.data?.resetToken || "");
        setStep(3);
      } else {
        setOtpError(data?.verifyPasswordResetOTP?.error || "Invalid OTP");
      }
    } catch (err: any) {
      setOtpError(err?.graphQLErrors?.[0]?.message || "Verification failed");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await requestOTP({ variables: { email } });
      setResendTimer(RESEND_COOLDOWN);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {}
  };

  // Step 3: reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setServerError("");
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
    try {
      const { data } = await resetPassword({ variables: { token: resetToken, newPassword } });
      if (data?.resetPassword?.success) {
        router.push(`/${storePrefix}/login?reset=success`);
      } else {
        setServerError(data?.resetPassword?.error || "Failed to reset password");
      }
    } catch (err: any) {
      setServerError(err?.graphQLErrors?.[0]?.message || "An error occurred");
    }
  };

  return (
    <div className="jp-auth-form">
      {/* Back to login */}
      <Link href={`/${storePrefix}/login`} className="jp-back-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to login
      </Link>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? "#3b82f6" : "#e2e8f0", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Step 1 — Email */}
      {step === 1 && (
        <>
          <h1 className="jp-heading">Reset your password</h1>
          <p className="jp-subheading">Enter your account email and we'll send a verification code to your registered phone and email.</p>
          <form onSubmit={handleRequestOTP} noValidate className="jp-form">
            <div className="jp-field">
              <label htmlFor="fp-email">Email address</label>
              <div className="jp-input-wrap">
                <Mail size={16} className="jp-input-icon" />
                <input
                  id="fp-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  className={emailError ? "jp-invalid" : ""}
                />
              </div>
              {emailError && <p className="jp-error">{emailError}</p>}
              {serverError && <p className="jp-error">{serverError}</p>}
            </div>
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{ size: "invisible" }}
            />

            {/* Security check status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 4 }}>
              {turnstileToken ? (
                <>
                  <Shield size={12} color="#16a34a" />
                  <span style={{ color: "#16a34a", fontWeight: 500 }}>Security check passed</span>
                </>
              ) : (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 11, color: "#64748b" }} />
                  <span style={{ color: "#64748b" }}>Running security check…</span>
                </>
              )}
            </div>

            <button type="submit" className="jp-submit-btn" disabled={requestLoading || !turnstileToken}>
              {requestLoading ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : <>Send Code <ArrowRight size={16} /></>}
            </button>
          </form>
        </>
      )}

      {/* Step 2 — OTP */}
      {step === 2 && (
        <>
          <span className="jp-status-badge" style={{ marginBottom: 16 }}>
            <Shield size={12} /> Code sent to phone &amp; email
          </span>
          <h1 className="jp-heading">Enter verification code</h1>
          <p className="jp-subheading">We sent a 6-digit code to <strong>{email}</strong>. Check your phone and email.</p>
          <form onSubmit={handleVerifyOTP} noValidate className="jp-form">
            <div className="jp-field">
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
                      border: `2px solid ${otpError ? "#ef4444" : digit ? "#3b82f6" : "#e2e8f0"}`,
                      borderRadius: 10, outline: "none", background: "#fff",
                    }}
                  />
                ))}
              </div>
              {otpError && <p className="jp-error" style={{ textAlign: "center" }}>{otpError}</p>}
            </div>
            <button type="submit" className="jp-submit-btn" disabled={verifyLoading}>
              {verifyLoading ? <><i className="fas fa-spinner fa-spin" /> Verifying…</> : <>Verify Code <ArrowRight size={16} /></>}
            </button>
            <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 12 }}>
              {resendTimer > 0 ? (
                <span>Resend code in <strong>{resendTimer}s</strong></span>
              ) : (
                <button type="button" onClick={handleResend} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  Resend code
                </button>
              )}
            </div>
            <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, margin: "8px auto 0" }}>
              <ArrowLeft size={13} /> Change email
            </button>
          </form>
        </>
      )}

      {/* Step 3 — New password */}
      {step === 3 && (
        <>
          <h1 className="jp-heading">Set new password</h1>
          <p className="jp-subheading">Create a strong password for your account.</p>
          <form onSubmit={handleResetPassword} noValidate className="jp-form">
            <div className="jp-field">
              <label htmlFor="fp-new-pass">New password</label>
              <div className="jp-input-wrap has-eye">
                <Lock size={16} className="jp-input-icon" />
                <input
                  id="fp-new-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                  className={passwordError ? "jp-invalid" : ""}
                />
                <button type="button" className="jp-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="jp-field">
              <label htmlFor="fp-confirm-pass">Confirm password</label>
              <div className="jp-input-wrap has-eye">
                <Lock size={16} className="jp-input-icon" />
                <input
                  id="fp-confirm-pass"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  className={passwordError ? "jp-invalid" : ""}
                />
                <button type="button" className="jp-eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && <p className="jp-error">{passwordError}</p>}
              {serverError && <p className="jp-error">{serverError}</p>}
            </div>
            <button type="submit" className="jp-submit-btn" disabled={resetLoading}>
              {resetLoading ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <>Set Password <ArrowRight size={16} /></>}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
