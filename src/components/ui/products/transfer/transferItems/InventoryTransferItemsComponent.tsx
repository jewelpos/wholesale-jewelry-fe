"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { InventoryTransfer } from "@/types/product";
import { GET_INVENTORY_TRANSFER_ITEM_QUERY } from "@/lib/graphql/query/products";
import { CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION } from "@/lib/graphql/mutations/products";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

interface Props {
  data: InventoryTransfer;
  onApproved?: () => void;
}

const InventoryTransferItemsComponent = ({ data, onApproved }: Props) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const dispatch = useDispatch();

  const [fetchItems, { data: result, loading }] = useLazyQuery(
    GET_INVENTORY_TRANSFER_ITEM_QUERY,
    { fetchPolicy: "no-cache" }
  );
  const [changeStatus, { loading: approving }] = useMutation(CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION);

  const [approveQtyById, setApproveQtyById] = useState<Record<number, string>>({});

  useEffect(() => {
    if (data.inventoryitemtransferid && parsedStoreId) {
      fetchItems({
        variables: {
          storeid: parsedStoreId,
          inventoryitemtransferid: data.inventoryitemtransferid,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.inventoryitemtransferid, parsedStoreId]);

  const items: any[] = result?.getInventoryTransferItemList ?? [];

  // Approval is a source-outlet decision — only the supplying outlet reviewing a still-
  // Requested transfer sees the editable Approve Qty column; everyone else (including
  // the requesting outlet itself) only ever sees the read-only history.
  const isRequestingOutlet =
    Number.isFinite(parsedOutletId) && Number(data.tooutletid) === parsedOutletId;
  const canApprove = Number(data.transferstatusid) === 1 && !isRequestingOutlet;

  useEffect(() => {
    if (!canApprove || !items.length) return;
    setApproveQtyById(prev => {
      const next = { ...prev };
      items.forEach(item => {
        const id = item.inventoryitemtransferdetailid;
        if (next[id] === undefined) {
          const requestedQty = Number(item.quantityrequest) > 0
            ? Number(item.quantityrequest)
            : Number(item.transferquantity ?? 0);
          next[id] = String(requestedQty);
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApprove, items]);

  const totalApproveQty = useMemo(
    () => Object.values(approveQtyById).reduce((s, v) => s + (Number(v) || 0), 0),
    [approveQtyById]
  );

  const handleConfirmApprove = async () => {
    const approveItems = items.map(item => ({
      inventoryitemtransferdetailid: item.inventoryitemtransferdetailid,
      approvedqty: Number(approveQtyById[item.inventoryitemtransferdetailid] ?? 0),
    }));

    if (approveItems.some(i => i.approvedqty < 0)) {
      dispatch(showNotification({ message: "Approve quantity cannot be negative.", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const result = await handleTryCatch(async () => {
      const response = await changeStatus({
        variables: {
          changeInventoryTransferStatusInput: {
            storeid: parsedStoreId,
            inventoryitemtransferid: data.inventoryitemtransferid,
            transferstatusid: 2,
            items: approveItems,
          },
        },
      });
      const successData = response.data?.changeInventoryTransferStatus;
      if (successData) {
        dispatch(showNotification({
          message: successData.message,
          type: successData.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
        }));
        if (successData.success) onApproved?.();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div className="px-4 py-3" style={{ background: "#f8f9fa" }}>
      {loading ? (
        <div className="text-muted" style={{ fontSize: 12 }}>Loading items...</div>
      ) : !items.length ? (
        <div className="text-muted" style={{ fontSize: 12 }}>No items found.</div>
      ) : (
        <>
          <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Item Code</th>
                <th>Description</th>
                <th className="text-end">Requested Qty</th>
                <th className="text-end">{canApprove ? "Approve Qty" : "Qty Transferred"}</th>
                <th className="text-end">Qty Received</th>
                <th className="text-end">Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                // Request-flow lines carry the real ask in quantityrequest (transferquantity
                // stays 0 until approved/received); direct-create transfers have no
                // separate request step, so transferquantity itself is the requested
                // amount. Same fallback the backend uses when validating.
                const requestedQty = Number(item.quantityrequest) > 0
                  ? Number(item.quantityrequest)
                  : Number(item.transferquantity ?? 0);
                const receivedQty = item.quantityreceived != null ? Number(item.quantityreceived) : null;
                const varianceBase = canApprove
                  ? Number(approveQtyById[item.inventoryitemtransferdetailid] ?? requestedQty)
                  : requestedQty;
                const variance = receivedQty != null ? receivedQty - varianceBase : null;
                return (
                  <tr key={item.inventoryitemtransferdetailid ?? idx}>
                    <td className="text-muted">{idx + 1}</td>
                    <td className="fw-semibold">{item.itemcode}</td>
                    <td>{item.itemdescription}</td>
                    <td className="text-end">{requestedQty}</td>
                    <td className="text-end">
                      {canApprove ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={approveQtyById[item.inventoryitemtransferdetailid] ?? ""}
                          onChange={(e) =>
                            setApproveQtyById(prev => ({
                              ...prev,
                              [item.inventoryitemtransferdetailid]: e.target.value,
                            }))
                          }
                          style={{ width: 84, textAlign: "right", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 6px" }}
                        />
                      ) : (
                        item.transferquantity
                      )}
                    </td>
                    <td className="text-end">{receivedQty ?? "—"}</td>
                    <td
                      className="text-end fw-semibold"
                      style={{
                        color: variance == null || variance === 0 ? undefined : variance < 0 ? "#dc2626" : "#d97706",
                      }}
                    >
                      {variance == null ? "—" : variance > 0 ? `+${variance}` : variance}
                    </td>
                    <td>
                      {item.itemreceived ? (
                        <span className="badge bg-success" style={{ fontSize: 10 }}>Received</span>
                      ) : (
                        <span className="badge bg-secondary" style={{ fontSize: 10 }}>Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {canApprove && (
            <div className="d-flex justify-content-end align-items-center gap-3 mt-3">
              <span className="text-muted" style={{ fontSize: 12 }}>
                Total to approve: <strong>{totalApproveQty}</strong>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-success"
                disabled={approving}
                onClick={handleConfirmApprove}
              >
                {approving ? "Approving..." : "Confirm & Approve"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryTransferItemsComponent;
