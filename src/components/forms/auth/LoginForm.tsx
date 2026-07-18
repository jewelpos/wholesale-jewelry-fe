"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoginFormInputs } from "@/types/auth";
import { emailOrUsernameValidation } from "@/lib/utils/validations/authValidations";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "react-feather";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export const LoginForm = () => {
  const router = useRouter();
  const { storePrefix } = useParams<{ storePrefix: string }>();
  const dispatch = useAppDispatch();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: { username: "", password: "" },
    mode: "all",
  });

  const onSubmit = async (formData: LoginFormInputs) => {
    if (!turnstileToken) {
      dispatch(showNotification({ message: "Security check not completed. Please wait a moment and try again.", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setLoginLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.username, password: formData.password, turnstileToken, keepSignedIn }),
    });
    const data = await response.json();
    if (data.data) {
      if (data.success) {
        const { storeid, outletid, routeprefix } = data.data;
        if (storeid && outletid && routeprefix) {
          const userInfo = data.data.user;
          const dashboardByRole: Record<number, string> = {
            1: "dashboard/admin",
            2: "dashboard/manager",
            3: "dashboard/cashier",
          };
          const landing = userInfo?.shouldcreatestore
            ? "home"
            : (dashboardByRole[userInfo?.roleid] ?? "dashboard/admin");
          router.push(`/${routeprefix}/${storeid}/${outletid}/${landing}`);
        } else {
          router.push(`/${storePrefix}/home`);
        }
      } else {
        const codes: string[] = data?.data?.code || [];
        // Store email in sessionStorage instead of URL to avoid PII in browser history/logs
        sessionStorage.setItem("otp_email", formData.username);
        const queryString = new URLSearchParams({ codes: codes.join(",") }).toString();
        router.push(`/${storePrefix}/verify?${queryString}`);
      }
      setLoginLoading(false);
    } else {
      setLoginLoading(false);
      const errorMessage =
        data?.graphQLErrors?.[0]?.message ||
        data?.networkError?.message ||
        "An unexpected error occurred. Please try again.";
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      dispatch(showNotification({ message: errorMessage, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div className="jp-auth-form">

      {/* Status badge */}
      <span className="jp-status-badge">
        <i className="jp-dot" />
        All systems operational
      </span>

      {/* Heading */}
      <h1 className="jp-heading">Sign in to your account</h1>
      <p className="jp-subheading">Welcome back. Enter your details to access your workspace.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="jp-form">

        {/* Email */}
        <div className="jp-field">
          <label htmlFor="jp-email">Email address</label>
          <div className="jp-input-wrap">
            <Mail size={16} className="jp-input-icon" />
            <input
              id="jp-email"
              type="text"
              placeholder="you@company.com"
              autoComplete="email"
              className={errors.username ? "jp-invalid" : ""}
              {...register("username", {
                required: "Email or username required",
                validate: emailOrUsernameValidation,
              })}
            />
          </div>
          {errors.username && <p className="jp-error">{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div className="jp-field">
          <div className="jp-label-row">
            <label htmlFor="jp-pass">Password</label>
            <Link href={`/${storePrefix}/forgot_password`} className="jp-forgot">Forgot password?</Link>
          </div>
          <div className="jp-input-wrap has-eye">
            <Lock size={16} className="jp-input-icon" />
            <input
              id="jp-pass"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={errors.password ? "jp-invalid" : ""}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              className="jp-eye-btn"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible((v) => !v)}
            >
              {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="jp-error">{errors.password.message}</p>}
        </div>

        {/* Keep signed in */}
        <label className="jp-remember">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
          />
          <span className="jp-checkbox" />
          Keep me signed in
        </label>

        {/* Cloudflare Turnstile — auto-verifies silently, resets on failed login */}
        <div style={{ width: "100%" }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ size: "flexible" }}
          />
        </div>

        {/* Submit */}
        <button type="submit" className="jp-submit-btn" disabled={loginLoading || !turnstileToken}>
          {loginLoading ? (
            <><i className="fas fa-spinner fa-spin" /> Signing in…</>
          ) : (
            <>Sign in <ArrowRight size={16} /></>
          )}
        </button>

      </form>

      {/* Footer */}
      <div className="jp-form-footer">
        <span className="jp-ssl">
          <Shield size={12} />
          256-bit SSL encrypted
        </span>
        <span>© {new Date().getFullYear()} JewelPOS</span>
      </div>

    </div>
  );
};
