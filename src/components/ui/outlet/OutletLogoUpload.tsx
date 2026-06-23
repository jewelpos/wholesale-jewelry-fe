"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

interface Props {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const OutletLogoUpload: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          height: 120,
          border: value ? "1.5px solid #dee2e6" : "2px dashed #ced4da",
          borderRadius: 10,
          background: value ? "#fff" : "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Store logo"
              fill
              unoptimized
              style={{ objectFit: "contain", padding: 12 }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(null)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 1,
                }}
              >
                <X size={13} color="#fff" strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#adb5bd" }}>
            <ImagePlus size={28} strokeWidth={1.5} />
            <div style={{ fontSize: 12, marginTop: 6 }}>No logo uploaded</div>
          </div>
        )}
      </div>

      {!disabled && (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={13} style={{ marginRight: 5 }} />
            {value ? "Change logo" : "Upload logo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      )}
      <div style={{ fontSize: 11, color: "#adb5bd" }}>
        PNG, JPG or SVG — shown on receipts and invoices
      </div>
    </div>
  );
};

export default OutletLogoUpload;
