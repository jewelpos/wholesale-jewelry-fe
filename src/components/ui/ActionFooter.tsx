import React from "react";

const ActionFooter = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="card sticky-footer">
      <div className="card-body">
        <div className="text-end">
          <button type="button" className="btn btn-light me-3">
            Cancel
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ActionFooter;
