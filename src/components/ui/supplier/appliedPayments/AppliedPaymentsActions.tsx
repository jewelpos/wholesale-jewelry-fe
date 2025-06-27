"use client";

import React from "react";
import { AppliedPaymentType } from "@/types/supplier";

interface Props {
  data: AppliedPaymentType;
  retryFetchData: () => void;
}

const AppliedPaymentsActions = ({ data, retryFetchData }: Props) => {
  return (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-primary"
        onClick={() => {
          // Add action handlers here
          retryFetchData();
        }}
      >
        View
      </button>
    </div>
  );
};

export default AppliedPaymentsActions;
