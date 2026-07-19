import React from "react";

// 40px accommodates btn-cancel's 10px vertical padding (box-sizing:border-box) while
// matching btn-primary and btn-submit at every screen size, overriding all CSS classes.
const BTN_H = "40px";

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
          style: { height: BTN_H, ...(child.props as { style?: React.CSSProperties }).style },
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
          style={{ height: BTN_H }}
        >
          {cancelLabel}
        </button>
        {normalizedChildren}
      </div>
    </div>
  );
};

export default ActionFooter;
