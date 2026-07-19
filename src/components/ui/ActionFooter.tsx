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
  // alignItems:"stretch" on the row makes every child grow to the same height.
  // We still inject boxSizing so border+padding are counted inside that height.
  const normalizedChildren = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: {
            boxSizing: "border-box" as const,
            alignSelf: "stretch",
            ...(child.props as { style?: React.CSSProperties }).style,
          },
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
      {/* alignItems:stretch forces all buttons to the height of the tallest one */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-cancel"
          style={{ boxSizing: "border-box" }}
        >
          {cancelLabel}
        </button>
        {normalizedChildren}
      </div>
    </div>
  );
};

export default ActionFooter;
