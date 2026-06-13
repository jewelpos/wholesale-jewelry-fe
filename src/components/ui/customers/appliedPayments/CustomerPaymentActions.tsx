import React from "react";
import Link from "next/link";
import { Trash2 } from "react-feather";

import { CustomerPaymentListType } from "@/types/customer";
import TooltipComponent from "../../TooltipComponent";

interface CustomerPaymentActionsProps {
  data: CustomerPaymentListType;
  onVoid: (row: CustomerPaymentListType) => void;
}

const CustomerPaymentActions: React.FC<CustomerPaymentActionsProps> = ({
  data,
  onVoid,
}) => {
  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        {!data.voidpayment && (
          <TooltipComponent value="Void Payment">
            <Link
              className="me-2 p-2"
              href=""
              scroll={false}
              onClick={() => onVoid(data)}
            >
              <Trash2 size={14} />
            </Link>
          </TooltipComponent>
        )}
      </div>
    </div>
  );
};

export default CustomerPaymentActions;
