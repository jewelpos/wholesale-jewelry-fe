import React from "react";
import { SupplierPayment } from "@/types/supplier";

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
          <button
            type="button"
            onClick={() => onVoid(data.supplierid, data.paymentid)}
            className="btn btn-danger me-3"
          >
            Void
          </button>
        )}
      </div>
    </div>
  );
};

export default SupplierPaymentActions;
