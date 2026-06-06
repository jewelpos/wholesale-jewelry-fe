import React from "react";
import { useMutation } from "@apollo/client";
import { CANCEL_INVOICE_MUTATION } from "@/lib/graphql/mutations/sales";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesInvoiceListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { IRowNode } from "ag-grid-community";

interface SalesActionsProps {
  data: SalesInvoiceListType;
  node: IRowNode<SalesInvoiceListType>;
}

const SalesActions: React.FC<SalesActionsProps> = ({ data, node }) => {
  const dispatch = useAppDispatch();
  const [cancelInvoice] = useMutation(CANCEL_INVOICE_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const handleDelete = async () => {
    const result = await showConfirmationDialog({
      title: "Cancel this invoice?",
      text: "The invoice will be marked as Cancelled and cannot be edited.",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await cancelInvoice({
          variables: {
            input: {
              storeid: parsedStoreId,
              invoicenumber: data.invoicenumber,
            },
          },
        });

        if (responseData?.cancelInvoice.success) {
          node.setData({ ...data, statusname: "Cancelled" });
          dispatch(
            showNotification({
              message: responseData.cancelInvoice.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      });

      if (deleteResult.error) {
        dispatch(
          showNotification({
            message: deleteResult.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }
    }
  };

  const isCreditInvoiceNotApplied = Number(data.salemodeid) === 5 && Number(data.custcrediapplied) === 0;
  const isReturnedWithCredit = data.statusname === "Returned" && Number(data.custcrediapplied) === 1;
  const canEdit = isCreditInvoiceNotApplied || (data.statusname === "Ready" && Number(data.amountreceived) === 0 && !isReturnedWithCredit);
  const canCancel =
    !isCreditInvoiceNotApplied &&
    Number(data.amountreceived) === 0 &&
    data.statusname !== "Shipped" &&
    data.statusname !== "Picked up" &&
    data.statusname !== "Cancelled";

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link
          className="me-2 p-2"
          href={`${basePath}/sales/${data.invoicenumber}/view`}
          scroll={false}
        >
          <Eye className="feather-view" />
        </Link>
        {canEdit && (
          <Link
            className="me-2 p-2"
            href={`${basePath}/sales/${data.invoicenumber}/edit`}
            scroll={false}
          >
            <Edit className="feather-edit" />
          </Link>
        )}
        {canCancel && (
          <Link
            className="confirm-text p-2"
            href="#"
            onClick={handleDelete}
            scroll={false}
          >
            <Trash2 className="feather-trash-2" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default SalesActions;
