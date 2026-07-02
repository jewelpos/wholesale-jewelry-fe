"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";

import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_INVENTORY_TRANSFER_ITEM_QUERY } from "@/lib/graphql/query/products";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { RECEIVE_INVENTORY_TRANSFER_MUTATION } from "@/lib/graphql/mutations/products";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  ReceiveInventoryTransferInput,
  ReceiveInventoryTransferItemInput,
} from "@/types/product";
import { WarehouseType } from "@/types/warehouse";
import SelectTransferRequest from "@/components/forms/SelectTransferRequest";

type TransferItemLine = {
  inventoryitemtransferdetailid: number;
  inventoryitemtransferid: number;
  itemcode: string;
  itemdescription?: string;
  transferquantity: number;
  quantityrequest?: number;
  warehousename?: string;
  quantityreceived?: number;
  itemreceived?: boolean;
};

type ReceiveRow = {
  inventoryitemtransferdetailid: number;
  itemcode: string;
  itemdescription: string;
  transferquantity: number;
  quantityreceived: number;
  itemreceived: boolean;
  sourceWarehouse: string;
};

type FormType = {
  inventoryitemtransferid?: number;
};

const InventoryTransferReceiveForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [defaultOutletWarehouses, setDefaultOutletWarehouses] = useState<WarehouseType[]>([]);
  const [rows, setRows] = useState<ReceiveRow[]>([]);
  const [sourceWarehouseName, setSourceWarehouseName] = useState<string>("");

  const [getTransferItems, { loading: loadingItems }] = useLazyQuery(
    GET_INVENTORY_TRANSFER_ITEM_QUERY
  );
  const [getWarehousesByOutletId] = useLazyQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY);
  const [receiveTransfer, { loading: saving }] = useMutation(
    RECEIVE_INVENTORY_TRANSFER_MUTATION
  );

  const defaultSysWarehouse = useMemo(
    () => defaultOutletWarehouses.find((w) => w.issystem),
    [defaultOutletWarehouses]
  );

  const {
    control,
    watch,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormType>({
    defaultValues: { inventoryitemtransferid: undefined },
    mode: "all",
  });

  const selectedTransferId = watch("inventoryitemtransferid");

  useEffect(() => {
    if (!parsedOutletId) return;
    const run = async () => {
      const result = await handleTryCatch(async () => {
        const { data } = await getWarehousesByOutletId({
          variables: { outletid: parsedOutletId },
          fetchPolicy: "no-cache",
        });
        setDefaultOutletWarehouses((data?.getWarehousesByOutletId || []) as WarehouseType[]);
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  const loadLines = async (inventoryitemtransferid: number) => {
    if (!parsedStoreId) return;
    setRows([]);
    setSourceWarehouseName("");

    const result = await handleTryCatch(async () => {
      const { data } = await getTransferItems({
        variables: { storeid: parsedStoreId, inventoryitemtransferid },
        fetchPolicy: "no-cache",
      });

      const lines = (data?.getInventoryTransferItemList || []) as TransferItemLine[];

      if (lines.length > 0 && lines[0].warehousename) {
        setSourceWarehouseName(lines[0].warehousename);
      }

      const mapped: ReceiveRow[] = lines.map((l) => {
        const effectiveQty =
          Number(l.transferquantity) > 0
            ? Number(l.transferquantity)
            : Number(l.quantityrequest) || 0;
        const prevReceived = Number.isFinite(Number(l.quantityreceived))
          ? Number(l.quantityreceived)
          : effectiveQty;
        return {
          inventoryitemtransferdetailid: Number(l.inventoryitemtransferdetailid),
          itemcode: l.itemcode,
          itemdescription: l.itemdescription || "",
          transferquantity: effectiveQty,
          quantityreceived: prevReceived,
          itemreceived: typeof l.itemreceived === "boolean" ? l.itemreceived : true,
          sourceWarehouse: l.warehousename || "",
        };
      });

      setRows(mapped);
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  useEffect(() => {
    const id = Number(selectedTransferId);
    if (!Number.isFinite(id) || id <= 0) {
      setRows([]);
      setSourceWarehouseName("");
      return;
    }
    loadLines(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTransferId]);

  const toggleRow = (idx: number, checked: boolean) => {
    setRows((prev) => {
      const next = [...prev];
      const row = next[idx];
      if (!row) return prev;
      next[idx] = {
        ...row,
        itemreceived: checked,
        quantityreceived: checked ? row.quantityreceived || row.transferquantity : 0,
      };
      return next;
    });
  };

  const receiveAll = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        itemreceived: true,
        quantityreceived: r.transferquantity,
      }))
    );
  };

  const updateQtyReceived = (idx: number, value: string) => {
    const parsed = Number(value);
    setRows((prev) => {
      const next = [...prev];
      const row = next[idx];
      if (!row) return prev;
      next[idx] = { ...row, quantityreceived: Number.isFinite(parsed) ? parsed : 0 };
      return next;
    });
  };

  const onSubmit = async (form: FormType) => {
    if (!parsedStoreId) return;

    const inventoryitemtransferid = Number(form.inventoryitemtransferid);
    if (!Number.isFinite(inventoryitemtransferid) || inventoryitemtransferid <= 0) {
      dispatch(showNotification({ message: "Transfer Number is required", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    if (!rows.length) {
      dispatch(showNotification({ message: "No items found for this transfer", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const checkedRows = rows.filter((r) => r.itemreceived);
    if (!checkedRows.length) {
      dispatch(showNotification({ message: "Select at least one item to receive", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    for (const r of checkedRows) {
      if (!Number.isFinite(Number(r.quantityreceived))) {
        dispatch(showNotification({ message: `Qty Received must be a number for item ${r.itemcode}`, type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      if (Number(r.quantityreceived) < 0) {
        dispatch(showNotification({ message: `Qty Received must be >= 0 for item ${r.itemcode}`, type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      if (Number(r.quantityreceived) > Number(r.transferquantity)) {
        dispatch(showNotification({ message: `Qty Received cannot exceed Qty Transferred for item ${r.itemcode}`, type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
    }

    const items: ReceiveInventoryTransferItemInput[] = rows.map((r) => ({
      inventoryitemtransferdetailid: r.inventoryitemtransferdetailid,
      quantityreceived: r.itemreceived ? Number(r.quantityreceived) : 0,
      itemreceived: Boolean(r.itemreceived),
    }));

    const payload: ReceiveInventoryTransferInput = {
      storeid: parsedStoreId,
      inventoryitemtransferid,
      items,
    };

    const result = await handleTryCatch(async () => {
      const response = await receiveTransfer({ variables: { receiveInventoryTransferInput: payload } });
      const res = response.data?.receiveInventoryTransfer;
      if (res) {
        dispatch(showNotification({ message: res.message, type: res.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR }));
        if (res.success) router.back();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const checkedCount = rows.filter((r) => r.itemreceived).length;
  const totalReceiving = rows.filter((r) => r.itemreceived).reduce((s, r) => s + r.quantityreceived, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          {/* Transfer selector */}
          <div className="row g-3">
            <div className="col-lg-6 col-md-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Transfer Number</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="inventoryitemtransferid"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <SelectTransferRequest
                        storeId={parsedStoreId}
                        transferstatusid={3}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        className=""
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* From → To banner — shown once a transfer is selected and items loaded */}
          {rows.length > 0 && (
            <div
              className="d-flex align-items-center gap-3 mt-3 px-3 py-2 rounded"
              style={{ background: "#f0f4ff", border: "1px solid #d0d9f5", fontSize: 13 }}
            >
              <span>
                <strong>From:</strong>{" "}
                <span className="badge bg-secondary" style={{ fontSize: 12 }}>
                  {sourceWarehouseName || "Source Warehouse"}
                </span>
              </span>
              <span style={{ color: "#6366f1", fontWeight: 700 }}>→</span>
              <span>
                <strong>To:</strong>{" "}
                <span className="badge bg-primary" style={{ fontSize: 12 }}>
                  {defaultSysWarehouse?.warehousename || "Destination Warehouse"}
                </span>
              </span>
              <span className="ms-auto text-muted">
                Transfer #{selectedTransferId}
              </span>
            </div>
          )}

          {/* Items table */}
          <div className="row g-3 mt-2">
            <div className="col-lg-12">
              {/* Toolbar above table */}
              {rows.length > 0 && (
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {rows.length} item{rows.length !== 1 ? "s" : ""} ·{" "}
                    {checkedCount} selected · Receiving qty:{" "}
                    <strong>{totalReceiving.toLocaleString()}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={receiveAll}
                  >
                    Receive All
                  </button>
                </div>
              )}

              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                <table className="table datanew mb-0">
                  <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && rows.every((r) => r.itemreceived)}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) => ({
                                ...r,
                                itemreceived: e.target.checked,
                                quantityreceived: e.target.checked
                                  ? r.transferquantity
                                  : 0,
                              }))
                            )
                          }
                        />
                      </th>
                      <th className="text-nowrap">#</th>
                      <th className="text-nowrap">Item Code</th>
                      <th className="text-nowrap">Description</th>
                      <th className="text-end text-nowrap">Qty Transferred</th>
                      <th className="text-end text-nowrap">Qty Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingItems ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3">
                          <span className="spinner-border spinner-border-sm me-2" />
                          Loading items…
                        </td>
                      </tr>
                    ) : !rows.length ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-3">
                          {selectedTransferId
                            ? "No items found for this transfer"
                            : "Select a transfer number above"}
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => (
                        <tr key={r.inventoryitemtransferdetailid} className="align-middle">
                          <td>
                            <input
                              type="checkbox"
                              checked={r.itemreceived}
                              onChange={(e) => toggleRow(idx, e.target.checked)}
                            />
                          </td>
                          <td style={{ fontSize: 12, color: "#6b7280" }}>{idx + 1}</td>
                          <td className="text-nowrap" style={{ fontWeight: 500 }}>
                            {r.itemcode}
                          </td>
                          <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: "#374151" }}>
                            {r.itemdescription || "—"}
                          </td>
                          <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {r.transferquantity.toLocaleString()}
                          </td>
                          <td className="text-end" style={{ minWidth: 130 }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={r.quantityreceived}
                              disabled={!r.itemreceived}
                              min={0}
                              max={r.transferquantity}
                              onChange={(e) => updateQtyReceived(idx, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={saving}
          btnText="Confirm Receive"
          loadingText="Receiving…"
          className="btn btn-primary"
          disabled={!isValid || rows.length === 0}
        />
      </ActionFooter>
    </form>
  );
};

export default InventoryTransferReceiveForm;
