import React from "react";

const CustomLoadingOverlay = () => {
  return (
    <div
      className="ag-custom-loading-overlay"
      style={{ padding: "20px", textAlign: "center" }}
    >
      <i className="fas fa-spinner fa-spin" style={{ marginRight: "5px" }}></i>
      Loading your data, please wait...
    </div>
  );
};

export default CustomLoadingOverlay;
