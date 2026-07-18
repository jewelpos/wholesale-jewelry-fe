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
    <div className="card sticky-footer">
      <div className="card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>{leftContent}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-cancel"
            >
              {cancelLabel}
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionFooter;
