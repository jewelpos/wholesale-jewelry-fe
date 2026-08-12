import React from "react";
import { CustomerChequeListType } from "@/types/customer";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { CHANGE_ON_HAND_CHECK_STATUS_MUTATION } from "@/lib/graphql/mutations/customer";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CHECK_STATUS, NOTIFICATION_TYPES } from "@/lib/config/constants";
import { Edit, XSquare, PauseCircle, PlayCircle } from "react-feather";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface OnHandChecksActionsProps {
  data: CustomerChequeListType;
  retryFetchData: () => void;
  onEdit: () => void;
}

const OnHandChecksActions = ({ data, retryFetchData, onEdit }: OnHandChecksActionsProps) => {
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
  const editDisabledReason = isOtherOutlet ? otherOutletReason : isVoided ? "Already voided" : undefined;

  const items: RowActionItem[] = [
    {
      key: 'edit', label: 'Edit', icon: <Edit size={14} />,
      onClick: onEdit,
      disabled: isVoided || isOtherOutlet, disabledReason: editDisabledReason,
    },
    {
      key: 'hold', label: holdLabel, icon: isOnHold ? <PlayCircle size={14} /> : <PauseCircle size={14} />,
      onClick: () => handleChangeStatus(holdTargetStatus),
      disabled: isVoided || isOtherOutlet,
      disabledReason: editDisabledReason,
    },
    {
      key: 'void', label: 'Delete (Void)', icon: <XSquare size={14} />,
      onClick: () => handleChangeStatus(CHECK_STATUS.VOID_CHECK), dangerous: true,
      disabled: isOtherOutlet, disabledReason: isOtherOutlet ? otherOutletReason : undefined,
    },
  ];

  return (
    <RowActionsWrapper items={items}>
      {isVoided || isOtherOutlet ? (
        <span className="p-1" title={editDisabledReason} style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
          <Edit size={14} style={{ opacity: 0.35 }} />
        </span>
      ) : (
        <button type="button" className="p-1 btn btn-link" style={{ lineHeight: 1 }} onClick={onEdit} title="Edit">
          <Edit size={14} />
        </button>
      )}
      {isVoided || isOtherOutlet ? (
        <span className="p-1" title={editDisabledReason} style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
          {isOnHold ? <PlayCircle size={14} style={{ opacity: 0.35 }} /> : <PauseCircle size={14} style={{ opacity: 0.35 }} />}
        </span>
      ) : (
        <button
          type="button"
          className="p-1 btn btn-link"
          style={{ lineHeight: 1, color: isOnHold ? "#198754" : "#dc3545" }}
          onClick={() => handleChangeStatus(holdTargetStatus)}
          title={holdLabel}
        >
          {isOnHold ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
        </button>
      )}
      {isOtherOutlet ? (
        <span className="p-1" title={otherOutletReason} style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
          <XSquare size={14} style={{ opacity: 0.35 }} />
        </span>
      ) : (
        <button
          type="button"
          className="confirm-text p-1 btn btn-link"
          style={{ lineHeight: 1, color: "#dc3545" }}
          onClick={() => handleChangeStatus(CHECK_STATUS.VOID_CHECK)}
          title="Delete (Void)"
        >
          <XSquare size={14} />
        </button>
      )}
    </RowActionsWrapper>
  );
};

export default OnHandChecksActions;
