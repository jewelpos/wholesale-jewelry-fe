import React from "react";
import { CustomerChequeListType } from "@/types/customer";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { CHANGE_ON_HAND_CHECK_STATUS_MUTATION } from "@/lib/graphql/mutations/customer";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CHECK_STATUS, NOTIFICATION_TYPES } from "@/lib/config/constants";
import { XSquare, PauseCircle } from "react-feather";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface OnHandChecksActionsProps {
  data: CustomerChequeListType;
  retryFetchData: () => void;
}

const OnHandChecksActions = ({ data, retryFetchData }: OnHandChecksActionsProps) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [changeOnHandCheckStatus] = useMutation(CHANGE_ON_HAND_CHECK_STATUS_MUTATION);
  const dispatch = useAppDispatch();
  const currentStatus = data.checkstatus;

  const handleChangeStatus = async (status: string) => {
    const deleteResult = await handleTryCatch(async () => {
      const { data: responseData } = await changeOnHandCheckStatus({
        variables: { storeid: parsedStoreId, customercheckdetailid: data.customercheckdetailid, status },
      });
      if (responseData?.changeOnHandCheckStatus.success) {
        dispatch(showNotification({ message: responseData.changeOnHandCheckStatus.message, type: NOTIFICATION_TYPES.SUCCESS }));
        retryFetchData();
      }
      return true;
    });
    if (deleteResult.error) dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
  };

  const isVoided = currentStatus === CHECK_STATUS.VOID_CHECK;

  const items: RowActionItem[] = [
    { key: 'void', label: 'Delete (Void)', icon: <XSquare size={14} />, onClick: () => handleChangeStatus(CHECK_STATUS.VOID_CHECK), dangerous: true },
    { key: 'hold', label: 'Hold', icon: <PauseCircle size={14} />, onClick: () => handleChangeStatus(CHECK_STATUS.CHECK_ON_HOLD), disabled: isVoided, disabledReason: "Already voided" },
  ];

  return (
    <RowActionsWrapper items={items}>
      <button
        className="btn btn-sm btn-warning btn-wave waves-effect waves-light"
        onClick={() => handleChangeStatus(CHECK_STATUS.VOID_CHECK)}
      >
        <i className="feather-x align-middle me-2 d-inline-block" />
        Delete
      </button>
      <button
        className="btn btn-sm btn-danger btn-wave waves-effect waves-light mx-2"
        onClick={() => handleChangeStatus(CHECK_STATUS.CHECK_ON_HOLD)}
        disabled={isVoided}
      >
        <i className="feather-stop-circle align-middle me-2 d-inline-block" />
        Hold
      </button>
    </RowActionsWrapper>
  );
};

export default OnHandChecksActions;
