import React from "react";
import Link from "next/link";
import { Trash2 } from "react-feather";
import { CustomerPaymentListType } from "@/types/customer";
import TooltipComponent from "../../TooltipComponent";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface CustomerPaymentActionsProps {
  data: CustomerPaymentListType;
  onVoid: (row: CustomerPaymentListType) => void;
}

const CustomerPaymentActions: React.FC<CustomerPaymentActionsProps> = ({ data, onVoid }) => {
  const items: RowActionItem[] = data.voidpayment
    ? []
    : [{ key: 'void', label: 'Void Payment', icon: <Trash2 size={14} />, onClick: () => onVoid(data), dangerous: true }];

  return (
    <RowActionsWrapper items={items}>
      {!data.voidpayment && (
        <TooltipComponent value="Void Payment">
          <Link className="p-1" href="" scroll={false} onClick={() => onVoid(data)}>
            <Trash2 size={14} />
          </Link>
        </TooltipComponent>
      )}
    </RowActionsWrapper>
  );
};

export default CustomerPaymentActions;
