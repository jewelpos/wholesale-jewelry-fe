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
        padding: "10px 24px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ minWidth: 0 }}>{leftContent}</div>
      {/* action-footer-btns: SCSS class forces height:40px !important on every .btn inside */}
      <div className="action-footer-btns" style={{ display: "flex", alignItems: "flex-start", height: 40, gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={handleCancel} className="btn btn-cancel" style={{ height: "100%", boxSizing: "border-box" }}>
          {cancelLabel}
        </button>
        {children}
      </div>
    </div>
  );
};

export default ActionFooter;
