import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SUPPLIER_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SupplierPayment } from "@/types/supplier";
import Link from "next/link";
import { Edit, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";

interface SupplierPaymentActionsProps {
  data: SupplierPayment;
  onDeleteSuccess?: () => void;
}

const SupplierPaymentActions: React.FC<SupplierPaymentActionsProps> = ({
  data,
  onDeleteSuccess,
}) => {
  console.log(data);

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        {data.voided !== "Yes" && (
          <button
            type="button"
            // onClick={handleCancel}
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
