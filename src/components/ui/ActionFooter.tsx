import React from "react";

const ActionFooter = ({
  children,
  handleCancel,
  leftContent,
}: Readonly<{
  children: React.ReactNode;
  handleCancel: () => void;
  leftContent?: React.ReactNode;
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
              Cancel
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionFooter;
