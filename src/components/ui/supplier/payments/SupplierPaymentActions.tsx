import React from "react";
import { SupplierPayment } from "@/types/supplier";
import Link from "next/link";
import { XSquare } from "react-feather";
import TooltipComponent from "../../TooltipComponent";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface SupplierPaymentActionsProps {
  data: SupplierPayment;
  onVoid: (supplierid: number, paymentid: number) => void;
}

const SupplierPaymentActions: React.FC<SupplierPaymentActionsProps> = ({ data, onVoid }) => {
  const items: RowActionItem[] = data.voided !== "Yes"
    ? [{ key: 'void', label: 'Void Payment', icon: <XSquare size={14} />, onClick: () => onVoid(data.supplierid, data.paymentid), dangerous: true }]
    : [];

  return (
    <RowActionsWrapper items={items}>
      {data.voided !== "Yes" && (
        <TooltipComponent value="Void">
          <Link className="p-1" href="" scroll={false} onClick={() => onVoid(data.supplierid, data.paymentid)}>
            <XSquare className="feather-trash-2" />
          </Link>
        </TooltipComponent>
      )}
    </RowActionsWrapper>
  );
};

export default SupplierPaymentActions;
