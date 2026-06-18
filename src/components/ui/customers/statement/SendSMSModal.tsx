"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@apollo/client";
import { Send, X } from "react-feather";
import { SEND_STATEMENT_SMS_MUTATION } from "@/lib/graphql/mutations/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";

interface SendSMSModalProps {
  customerName: string;
  defaultPhone: string;
  storeName: string;
  customerid: number;
  outletid: number;
  previewHtml: string;
  onClose: () => void;
  onSent: () => void;
}

const SendSMSModal: React.FC<SendSMSModalProps> = ({
  customerName, defaultPhone, storeName, customerid, outletid, previewHtml, onClose, onSent,
}) => {
  const dispatch = useAppDispatch();
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const [sendSMS] = useMutation(SEND_STATEMENT_SMS_MUTATION);

  const handleSend = async () => {
    if (!phone.trim()) {
      dispatch(showNotification({ message: "Please enter a phone number", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setSending(true);
    try {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Statement</title></head><body style="margin:0;padding:16px;font-family:Arial,sans-serif;">${previewHtml}</body></html>`;
      const { data: result } = await sendSMS({
        variables: { input: { customerid, outletid, phoneNumber: phone.trim(), htmlContent: fullHtml } },
      });
      if (result?.sendCustomerStatementSMS?.success) {
        dispatch(showNotification({ message: "Statement sent via SMS successfully", type: NOTIFICATION_TYPES.SUCCESS }));
        onSent();
      } else {
        dispatch(showNotification({ message: result?.sendCustomerStatementSMS?.error ?? "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: unknown) {
      dispatch(showNotification({ message: err instanceof Error ? err.message : "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1065 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "#fff", borderRadius: 10, width: 440, maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)", zIndex: 1070, overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#0f172a", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Send size={15} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Send Statement via SMS</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 18px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>CUSTOMER</div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{customerName}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>
              SEND TO PHONE NUMBER
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1",
                borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.06em" }}>
              Message Preview
            </div>
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              Your account statement from <strong>{storeName}</strong> is ready. Tap the link to view your statement.{" "}
              <span style={{ color: "#3b82f6" }}>https://go.link/...</span>
              <br />
              <span style={{ color: "#94a3b8", fontSize: 11 }}>(Link will be generated when sent)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <button
            onClick={onClose}
            disabled={sending}
            style={{ padding: "8px 18px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !phone.trim()}
            style={{
              padding: "8px 18px", border: "none", borderRadius: 6,
              background: sending || !phone.trim() ? "#94a3b8" : "#0f172a",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending || !phone.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Send size={13} />
            {sending ? "Sending..." : "Send SMS"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default SendSMSModal;
