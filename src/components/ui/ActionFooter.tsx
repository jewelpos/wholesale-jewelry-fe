import React from "react";

const ActionFooter = ({
  children,
  handleCancel,
}: Readonly<{
  children: React.ReactNode;
  handleCancel: () => void;
}>) => {
  return (
    <div className="card sticky-footer">
      <div className="card-body">
        <div className="text-end">
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
  );
};

export default ActionFooter;
