import React from "react";
import { SupplierPayment } from "@/types/supplier";
import Link from "next/link";
import { XSquare } from "react-feather";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";
import TooltipComponent from "../../TooltipComponent";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface SupplierPaymentActionsProps {
  data: SupplierPayment;
  onVoid: (supplierid: number, paymentid: number) => void;
}

const SupplierPaymentActions: React.FC<SupplierPaymentActionsProps> = ({ data, onVoid }) => {
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  // Supplier payments are outlet-specific transactions — voiding one is locked to
  // the outlet it was created at, the store owner bypasses this, matching the
  // backend's assertRecordEditableFromOutlet check.
  const isOwner = !!useAppSelector((state) => state.user.data?.issysgenmasteraccount);
  const isOtherOutlet =
    !isOwner &&
    data.outletid != null &&
    !Number.isNaN(parsedOutletId) &&
    Number(data.outletid) !== parsedOutletId;
  const otherOutletReason = "This payment was created at a different outlet";

  const canVoid = data.voided !== "Yes" && !isOtherOutlet;
  const voidReason = isOtherOutlet ? otherOutletReason : "";

  const items: RowActionItem[] = data.voided !== "Yes"
    ? [
        canVoid
          ? { key: 'void', label: 'Void Payment', icon: <XSquare size={14} />, onClick: () => onVoid(data.supplierid, data.paymentid), dangerous: true }
          : { key: 'void', label: 'Void Payment', icon: <XSquare size={14} />, disabled: true, disabledReason: voidReason, dangerous: true },
      ]
    : [];

  return (
    <RowActionsWrapper items={items}>
      {data.voided !== "Yes" && (
        canVoid ? (
          <TooltipComponent value="Void">
            <Link className="p-1" href="" scroll={false} onClick={() => onVoid(data.supplierid, data.paymentid)}>
              <XSquare className="feather-trash-2" />
            </Link>
          </TooltipComponent>
        ) : (
          <TooltipComponent value={voidReason}>
            <span className="p-1" style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
              <XSquare className="feather-trash-2" style={{ opacity: 0.35 }} />
            </span>
          </TooltipComponent>
        )
      )}
    </RowActionsWrapper>
  );
};

export default SupplierPaymentActions;
