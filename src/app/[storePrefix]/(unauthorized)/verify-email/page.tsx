"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import Logo from "@/components/ui/Logo";
import { CheckCircle, XCircle } from "react-feather";

const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
      error
    }
  }
`;

const VerifyEmailPage = () => {
  const { storePrefix } = useParams<{ storePrefix: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const [verifyEmail] = useMutation(VERIFY_EMAIL_MUTATION);

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid or missing verification link."); return; }
    verifyEmail({ variables: { token } })
      .then(({ data }) => {
        if (data?.verifyEmail?.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully. You can now log in.");
        } else {
          setStatus("error");
          setMessage(data?.verifyEmail?.error || "Verification failed. The link may have expired.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.graphQLErrors?.[0]?.message || "Verification failed.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-new">
          <div className="container">
            <div className="login-content user-login" style={{ maxWidth: 480, margin: "0 auto" }}>
              <div className="login-logo mb-4">
                <Logo width={787} height={225} style={{ width: "100%", maxWidth: 260, height: "auto" }} />
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", textAlign: "center" }}>
                {status === "loading" && (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 40, color: "#3b82f6", marginBottom: 20 }} />
                    <h3 style={{ color: "#1e293b", marginBottom: 8 }}>Verifying your email…</h3>
                    <p style={{ color: "#64748b" }}>Please wait a moment.</p>
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: "#1e293b", marginBottom: 8 }}>Email verified!</h3>
                    <p style={{ color: "#64748b", marginBottom: 28 }}>{message}</p>
                    <button
                      onClick={() => router.push(`/${storePrefix}/login`)}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                    >
                      Go to Login
                    </button>
                  </>
                )}
                {status === "error" && (
                  <>
                    <XCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: "#1e293b", marginBottom: 8 }}>Verification failed</h3>
                    <p style={{ color: "#64748b", marginBottom: 28 }}>{message}</p>
                    <button
                      onClick={() => router.push(`/${storePrefix}/login`)}
                      style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
