"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Printer } from "react-feather";

interface Props {
  pdfUrl: string;
  filename: string;
  onClose: () => void;
}

const PdfPreviewModal = ({ pdfUrl, filename, onClose }: Props) => {
  const embedRef = useRef<HTMLEmbedElement>(null);
  const [mounted, setMounted] = useState(false);

  // Revoke the blob URL only when the user actually closes — not in useEffect
  // cleanup, because React StrictMode runs cleanup+remount in dev which would
  // revoke the URL before the embed has a chance to load it.
  const handleClose = useCallback(() => {
    window.URL.revokeObjectURL(pdfUrl);
    onClose();
  }, [pdfUrl, onClose]);

  useEffect(() => {
    setMounted(true);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const handlePrint = () => {
    // Open the blob URL in a hidden iframe and trigger print
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const btnPrimary: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", background: "#1e40af", color: "#fff",
  };

  const btnSecondary: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "1px solid #475569", background: "#1e293b", color: "#cbd5e1",
  };

  const btnClose: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 6,
    cursor: "pointer", border: "1px solid #475569", background: "none", color: "#94a3b8",
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 1050,
        }}
      />

      {/* Modal window */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1280px, 96vw)",
          height: "min(92vh, 920px)",
          background: "#fff",
          borderRadius: 10,
          zIndex: 1055,
          boxShadow: "0 32px 96px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px",
          background: "#0f172a",
          color: "#fff",
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", letterSpacing: "0.01em" }}>
            {filename}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handlePrint} style={btnPrimary}>
              <Printer size={14} />
              Print
            </button>
            <button onClick={handleDownload} style={btnSecondary}>
              <Download size={14} />
              Download
            </button>
            <button onClick={handleClose} style={btnClose} title="Close (Esc)">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PDF viewer — embed is more reliable than iframe for PDFs in Edge/Chrome */}
        <embed
          ref={embedRef}
          src={pdfUrl}
          type="application/pdf"
          style={{ flex: 1, width: "100%", border: "none", display: "block" }}
        />
      </div>
    </>,
    document.body
  );
};

export default PdfPreviewModal;
