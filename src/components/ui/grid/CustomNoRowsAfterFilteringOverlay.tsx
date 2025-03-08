import React from "react";

const CustomNoRowsAfterFilteringOverlay = () => {
  return (
    <div
      className="ag-custom-no-rows-overlay"
      style={{ padding: "20px", textAlign: "center" }}
    >
      No matching records found. Please adjust your filters.
    </div>
  );
};

export default CustomNoRowsAfterFilteringOverlay;
