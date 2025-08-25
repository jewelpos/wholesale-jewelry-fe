"use client";

import React from "react";

const ChecksListHeader = () => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4 className="mb-0">On Hand Checks Summary</h4>
        <p className="text-muted mb-0">
          View monthly summary of on-hand checks by supplier
        </p>
      </div>
    </div>
  );
};

export default ChecksListHeader;
