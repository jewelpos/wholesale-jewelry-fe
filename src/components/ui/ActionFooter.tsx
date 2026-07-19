import React from "react";

const BTN_STYLE: React.CSSProperties = {
  height: 38,
  padding: "0 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flexShrink: 0,
  boxShadow: "none",
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
  const styledChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement<{ style?: React.CSSProperties; className?: string }>(child)) return child;
    const existingClass = (child.props as { className?: string }).className ?? "btn btn-primary";
    return React.cloneElement(child, {
      style: { ...BTN_STYLE, ...child.props.style },
      className: existingClass.includes("sticky-footer-btn")
        ? existingClass
        : `${existingClass} sticky-footer-btn`,
    });
  });

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
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{leftContent}</div>
      <button type="button" onClick={handleCancel} className="btn btn-cancel sticky-footer-btn" style={BTN_STYLE}>
        {cancelLabel}
      </button>
      {styledChildren}
    </div>
  );
};

export default ActionFooter;
