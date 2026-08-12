import React from "react";
import { CustomerChequeListType } from "@/types/customer";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { CHANGE_ON_HAND_CHECK_STATUS_MUTATION } from "@/lib/graphql/mutations/customer";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CHECK_STATUS, NOTIFICATION_TYPES } from "@/lib/config/constants";
import { XSquare, PauseCircle, PlayCircle } from "react-feather";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface OnHandChecksActionsProps {
  data: CustomerChequeListType;
  retryFetchData: () => void;
}

const OnHandChecksActions = ({ data, retryFetchData }: OnHandChecksActionsProps) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [changeOnHandCheckStatus] = useMutation(CHANGE_ON_HAND_CHECK_STATUS_MUTATION);
  const dispatch = useAppDispatch();
  const currentStatus = data.checkstatus;

  // A cheque is a physical object held at one specific outlet — void/hold are
  // decisions made while physically handling it, so they're only actionable from
  // the outlet that actually holds it. The list itself stays global for visibility.
  const isOtherOutlet =
    data.outletid != null && parsedOutletId != null && Number(data.outletid) !== parsedOutletId;
  const otherOutletReason = `Held at ${data.warehousename || "another outlet"} — actions only available there`;

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
  const isOnHold = currentStatus === CHECK_STATUS.CHECK_ON_HOLD;
  const holdTargetStatus = isOnHold ? CHECK_STATUS.ON_HAND_CHECK : CHECK_STATUS.CHECK_ON_HOLD;
  const holdLabel = isOnHold ? "Unhold" : "Hold";

  const items: RowActionItem[] = [
    {
      key: 'void', label: 'Delete (Void)', icon: <XSquare size={14} />,
      onClick: () => handleChangeStatus(CHECK_STATUS.VOID_CHECK), dangerous: true,
      disabled: isOtherOutlet, disabledReason: isOtherOutlet ? otherOutletReason : undefined,
    },
    {
      key: 'hold', label: holdLabel, icon: isOnHold ? <PlayCircle size={14} /> : <PauseCircle size={14} />,
      onClick: () => handleChangeStatus(holdTargetStatus),
      disabled: isVoided || isOtherOutlet,
      disabledReason: isOtherOutlet ? otherOutletReason : isVoided ? "Already voided" : undefined,
    },
  ];

  return (
    <RowActionsWrapper items={items}>
      <button
        className="btn btn-sm btn-warning btn-wave waves-effect waves-light"
        onClick={() => handleChangeStatus(CHECK_STATUS.VOID_CHECK)}
        disabled={isOtherOutlet}
        title={isOtherOutlet ? otherOutletReason : undefined}
      >
        <i className="feather-x align-middle me-2 d-inline-block" />
        Delete
      </button>
      <button
        className={`btn btn-sm ${isOnHold ? "btn-success" : "btn-danger"} btn-wave waves-effect waves-light mx-2`}
        onClick={() => handleChangeStatus(holdTargetStatus)}
        disabled={isVoided || isOtherOutlet}
        title={isOtherOutlet ? otherOutletReason : isVoided ? "Already voided" : undefined}
      >
        <i className={`${isOnHold ? "feather-play-circle" : "feather-stop-circle"} align-middle me-2 d-inline-block`} />
        {holdLabel}
      </button>
    </RowActionsWrapper>
  );
};

export default OnHandChecksActions;
