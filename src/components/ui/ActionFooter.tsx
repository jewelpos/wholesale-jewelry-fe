import React from "react";

const ActionFooter = ({
  children,
  handleCancel,
  leftContent,
  cancelLabel = "Cancel",
}: Readonly<{
  children?: React.ReactNode;
  handleCancel: () => void;
  leftContent?: React.ReactNode;
  cancelLabel?: string;
}>) => {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #e9ecef",
        padding: "12px 24px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ minWidth: 0 }}>{leftContent}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={handleCancel} className="btn btn-cancel" style={{ padding: "0.5rem 0.85rem" }}>
          {cancelLabel}
        </button>
        {children}
      </div>
    </div>
  );
};

export default ActionFooter;
