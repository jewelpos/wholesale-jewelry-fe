import React from "react";

// Shared button style applied to Cancel AND every child button.
// Explicit boxSizing + padding + height so the total rendered height is
// identical on every button regardless of which CSS class is in use.
const BTN: React.CSSProperties = {
  height: 40,
  boxSizing: "border-box",
  padding: "0 1rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

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
  const normalizedChildren = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: { ...BTN, ...(child.props as { style?: React.CSSProperties }).style },
        })
      : child
  );

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-cancel"
          style={BTN}
        >
          {cancelLabel}
        </button>
        {normalizedChildren}
      </div>
    </div>
  );
};

export default ActionFooter;
