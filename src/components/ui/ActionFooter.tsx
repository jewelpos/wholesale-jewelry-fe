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
        <div className="d-flex align-items-center justify-content-between">
          <div>{leftContent}</div>
          <div>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-cancel me-3"
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
