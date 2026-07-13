"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { Shield, ArrowRight, Mail } from "react-feather";
import { RESEND_MOBILE_OTP_WITH_EMAIL_MUTATION } from "@/lib/graphql/mutations/auth";

const RESEND_COOLDOWN = 60;

const OTPFormContainer = () => {
  const { storePrefix } = useParams<{ storePrefix: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const codesParam = searchParams.get("codes") || "";
  const pendingCodes = codesParam ? codesParam.split(",") : [];
  const emailOnlyPending = pendingCodes.length > 0 && !pendingCodes.includes("MOBILE_OTP_VERIFICATION_PENDING");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendMsg, setResendMsg] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifying, setVerifying] = useState(false);
  const [resendOTP, { loading: resending }] = useMutation(RESEND_MOBILE_OTP_WITH_EMAIL_MUTATION);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  useEffect(() => {
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the 6-digit code"); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/${storePrefix}/home`);
      } else {
        setError(json.error || "Invalid code. Please try again.");
      }
    } catch {
      setError("Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    try {
      const { data } = await resendOTP({ variables: { email } });
      if (data?.resendMobileOTPWithEmail?.success) {
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setResendMsg("A new code was sent to your phone.");
        setResendTimer(RESEND_COOLDOWN);
        otpRefs.current[0]?.focus();
      } else {
        setError(data?.resendMobileOTPWithEmail?.error || "Failed to resend code.");
      }
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message || "Failed to resend code.");
    }
  };

  if (emailOnlyPending) {
    return (
      <div className="login-userset" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: 13, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
          <Shield size={13} /> Phone verified
        </span>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Mail size={28} color="#3b82f6" />
        </div>
        <h4 style={{ color: "#1e293b", fontWeight: 700, marginBottom: 8 }}>Check your email</h4>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
          Your phone is verified. We sent an email to <strong>{email}</strong>.
          Click the link in that email to complete your account setup.
        </p>
        <a href={`/${storePrefix}/login`} style={{ color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="login-userset" style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="mb-4 text-center">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#3b82f6", fontWeight: 600, fontSize: 13, padding: "4px 14px", borderRadius: 20, marginBottom: 16 }}>
          <Shield size={13} /> Code sent to your phone
        </span>
        <h4 className="login-userheading" style={{ color: "#1e293b", fontWeight: 700, marginBottom: 6 }}>
          Enter verification code
        </h4>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          We sent a 6-digit code to the phone number on your account
          {email ? <><br /><strong>{email}</strong></> : ""}.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
                border: `2px solid ${error ? "#ef4444" : digit ? "#3b82f6" : "#e2e8f0"}`,
                borderRadius: 10, outline: "none", background: "#fff",
              }}
            />
          ))}
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 6 }}>{error}</p>}
        {resendMsg && !error && <p style={{ color: "#22c55e", fontSize: 13, textAlign: "center", marginTop: 6 }}>{resendMsg}</p>}

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          style={{ height: 46, fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          disabled={verifying}
        >
          {verifying ? <><i className="fas fa-spinner fa-spin" /> Verifying…</> : <>Verify Code <ArrowRight size={16} /></>}
        </button>
      </form>

      <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 16 }}>
        {resendTimer > 0 ? (
          <span>Resend code in <strong>{resendTimer}s</strong></span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
};

export default OTPFormContainer;
