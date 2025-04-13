import Image from "next/image";
import React from "react";

const CustomNoRowsOverlay = () => {
  return (
    <div
      className="ag-custom-no-rows-overlay"
      style={{ textAlign: "center", padding: "1rem" }}
    >
      <Image
        src="/assets/img/table/empty.png"
        alt="empty img"
        width={170}
        height={170}
      />
      <p>No data available</p>
    </div>
  );
};

export default CustomNoRowsOverlay;
