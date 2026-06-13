"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { X, Send } from "react-feather";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

type DocumentType = "INVOICE" | "MEMO" | "SALES_ORDER" | "PURCHASE_ORDER";

interface DocumentEmailModalProps {
  storeId: number;
  documentType: DocumentType;
  documentNumbers: number[];
  onClose: () => void;
  onSent: (message: string) => void;
  onError: (message: string) => void;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const endpointMap: Record<DocumentType, { customerEmail: string; send: string; numberKey: string }> = {
  INVOICE:        { customerEmail: "/store/invoice/customer-email",           send: "/store/invoice/email",           numberKey: "invoicenumbers"   },
  MEMO:           { customerEmail: "/store/memo/customer-email",              send: "/store/memo/email",              numberKey: "memonumbers"      },
  SALES_ORDER:    { customerEmail: "/store/sales-order/customer-emails",      send: "/store/sales-order/email",       numberKey: "salesordernumbers"},
  PURCHASE_ORDER: { customerEmail: "/store/purchase-order/supplier-email",    send: "/store/purchase-order/email",    numberKey: "ponumbers"        },
};

const labelMap: Record<DocumentType, string> = {
  INVOICE: "Invoice",
  MEMO: "Memo",
  SALES_ORDER: "Sales Order",
  PURCHASE_ORDER: "Purchase Order",
};

const DocumentEmailModal = ({
  storeId,
  documentType,
  documentNumbers,
  onClose,
  onSent,
  onError,
}: DocumentEmailModalProps) => {
  const config = getEnvironmentConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  const ep = endpointMap[documentType];
  const label = labelMap[documentType];

  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const result = await handleTryCatch(async () => {
        const { data } = await api.post(`${config.apiUrl}${ep.customerEmail}`, {
          storeid: storeId,
          [ep.numberKey]: documentNumbers,
        });
        const found: string[] = (data ?? [])
          .map((r: any) => r.email)
          .filter((e: string | null) => e && isValidEmail(e));
        setEmails([...new Set(found)]);
        return true;
      });
      if (result.error) onError(result.error);
      setLoading(false);
    };
    fetchEmails();
  }, []);

  const addEmail = (raw: string) => {
    const parts = raw.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
    const invalid = parts.filter(e => !isValidEmail(e));
    if (invalid.length) { setInputError(`Invalid: ${invalid.join(", ")}`); return false; }
    setEmails([...new Set([...emails, ...parts])]);
    setInputValue("");
    setInputError("");
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", " ", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) addEmail(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && emails.length) {
      setEmails(emails.slice(0, -1));
    }
  };

  const handleSend = async () => {
    if (inputValue.trim()) { const ok = addEmail(inputValue); if (!ok) return; }
    const finalEmails = emails.length ? emails : [];
    if (!finalEmails.length) { setInputError("Add at least one email address"); return; }

    setSending(true);
    const result = await handleTryCatch(async () => {
      const { data } = await api.post(`${config.apiUrl}${ep.send}`, {
        storeid: storeId,
        [ep.numberKey]: documentNumbers,
        toEmails: finalEmails,
      });
      return data;
    });
    setSending(false);

    if (result.error) {
      onError(result.error);
    } else {
      onSent(result.data?.message ?? `Email sent to ${finalEmails.join(", ")}`);
      onClose();
    }
  };

  const modal = (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Email {label}{documentNumbers.length > 1 ? "s" : ""}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-2">
              #{documentNumbers.join(", ")} — PDF will be sent as attachment
            </p>
            <label className="form-label fw-semibold">To</label>
            {loading ? (
              <div className="text-center py-2"><div className="spinner-border spinner-border-sm" /></div>
            ) : (
              <div
                className="form-control d-flex flex-wrap gap-1 align-items-center"
                style={{ minHeight: 42, cursor: "text" }}
                onClick={() => inputRef.current?.focus()}
              >
                {emails.map((email, i) => (
                  <span key={i} className="badge bg-primary d-flex align-items-center gap-1" style={{ fontSize: 12, fontWeight: 400 }}>
                    {email}
                    <X size={12} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setEmails(emails.filter((_, idx) => idx !== i)); }} />
                  </span>
                ))}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => { if (inputValue.trim()) addEmail(inputValue); }}
                  placeholder={emails.length ? "" : "Type email and press Enter"}
                  className="border-0 flex-grow-1"
                  style={{ minWidth: 180, outline: "none", fontSize: 13 }}
                />
              </div>
            )}
            {inputError && <div className="text-danger small mt-1">{inputError}</div>}
            <div className="text-muted small mt-1">Press Enter, comma, or semicolon to add multiple addresses</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={sending}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={handleSend} disabled={sending || loading}>
              <Send size={13} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? ReactDOM.createPortal(modal, document.body) : null;
};

export default DocumentEmailModal;
