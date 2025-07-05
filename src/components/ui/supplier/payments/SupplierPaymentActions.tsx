import React from "react";
import { SupplierPayment } from "@/types/supplier";
import Link from "next/link";
import { XSquare } from "react-feather";
import TooltipComponent from "../../TooltipComponent";

interface SupplierPaymentActionsProps {
  data: SupplierPayment;
  onVoid: (supplierid: number, paymentid: number) => void;
}

const SupplierPaymentActions: React.FC<SupplierPaymentActionsProps> = ({
  data,
  onVoid,
}) => {
  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        {data.voided !== "Yes" && (
          <TooltipComponent value="Void">
            <Link
              className="me-2 p-2"
              href=""
              scroll={false}
              onClick={() => onVoid(data.supplierid, data.paymentid)}
            >
              <XSquare className="feather-trash-2" />
            </Link>
          </TooltipComponent>
        )}
      </div>
    </div>
  );
};

export default SupplierPaymentActions;
