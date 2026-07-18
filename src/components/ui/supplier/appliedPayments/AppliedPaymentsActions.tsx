"use client";

import React from "react";
import { Eye } from "react-feather";
import { AppliedPaymentType } from "@/types/supplier";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface Props {
  data?: AppliedPaymentType;
  retryFetchData: () => void;
}

const AppliedPaymentsActions = ({ retryFetchData }: Props) => {
  const items: RowActionItem[] = [
    { key: 'view', label: 'View', icon: <Eye size={14} />, onClick: retryFetchData },
  ];

  return (
    <RowActionsWrapper items={items}>
      <button className="btn btn-sm btn-primary" onClick={retryFetchData}>
        View
      </button>
    </RowActionsWrapper>
  );
};

export default AppliedPaymentsActions;
