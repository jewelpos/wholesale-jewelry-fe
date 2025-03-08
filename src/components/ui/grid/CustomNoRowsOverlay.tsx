import React from "react";

const CustomNoRowsOverlay = () => {
  return (
    <div
      className="ag-custom-no-rows-overlay"
      style={{ padding: "20px", textAlign: "center" }}
    >
      No data available. Please add some data.
    </div>
  );
};

export default CustomNoRowsOverlay;
