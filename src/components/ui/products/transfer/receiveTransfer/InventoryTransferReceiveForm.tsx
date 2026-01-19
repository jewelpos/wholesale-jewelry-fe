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
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
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
};

type ReceiveRow = {
  inventoryitemtransferdetailid: number;
  itemcode: string;
  transferquantity: number;
  quantityreceived: number;
  itemreceived: boolean;
};

type FormType = {
  inventoryitemtransferid?: number;
};

const InventoryTransferReceiveForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.user.data);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [defaultOutletWarehouses, setDefaultOutletWarehouses] = useState<WarehouseType[]>([]);

  const [rows, setRows] = useState<ReceiveRow[]>([]);

  const [getTransferItems, { loading: loadingItems }] = useLazyQuery(
    GET_INVENTORY_TRANSFER_ITEM_QUERY
  );
  const [getWarehousesByOutletId] = useLazyQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY);

  const [receiveTransfer, { loading: saving }] = useMutation(
    RECEIVE_INVENTORY_TRANSFER_MUTATION
  );

  const resolveSystemWarehouse = (warehouses: WarehouseType[]) => {
    const sys = warehouses.find((w) => w.issystem);
    return sys;
  };

  const defaultSysWarehouse = useMemo(
    () => resolveSystemWarehouse(defaultOutletWarehouses),
    [defaultOutletWarehouses]
  );

  const defaultSysWarehouseId = defaultSysWarehouse?.warehouseid;

  const {
    control,
    watch,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormType>({
    defaultValues: {
      inventoryitemtransferid: undefined,
    },
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
        dispatch(
          showNotification({
            message: result.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  const loadLines = async (inventoryitemtransferid: number) => {
    if (!parsedStoreId) return;

    setRows([]);

    const result = await handleTryCatch(async () => {
      const { data } = await getTransferItems({
        variables: {
          storeid: parsedStoreId,
          inventoryitemtransferid,
        },
        fetchPolicy: "no-cache",
      });

      const lines = (data?.getInventoryTransferItemList || []) as Array<
        TransferItemLine & {
          quantityreceived?: number;
          itemreceived?: boolean;
        }
      >;
      const mapped: ReceiveRow[] = lines.map((l) => ({
        inventoryitemtransferdetailid: Number(l.inventoryitemtransferdetailid),
        itemcode: l.itemcode,
        transferquantity: Number(l.transferquantity) || 0,
        quantityreceived:
          Number.isFinite(Number(l.quantityreceived))
            ? Number(l.quantityreceived)
            : Number(l.transferquantity) || 0,
        itemreceived: typeof l.itemreceived === "boolean" ? l.itemreceived : true,
      }));

      setRows(mapped);
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  useEffect(() => {
    const id = Number(selectedTransferId);
    if (!Number.isFinite(id) || id <= 0) {
      setRows([]);
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
      const itemreceived = checked;
      next[idx] = {
        ...row,
        itemreceived,
        quantityreceived: itemreceived ? row.quantityreceived || row.transferquantity : 0,
      };
      return next;
    });
  };

  const updateQtyReceived = (idx: number, value: string) => {
    const parsed = Number(value);
    setRows((prev) => {
      const next = [...prev];
      const row = next[idx];
      if (!row) return prev;
      next[idx] = {
        ...row,
        quantityreceived: Number.isFinite(parsed) ? parsed : 0,
      };
      return next;
    });
  };

  const onSubmit = async (form: FormType) => {
    if (!parsedStoreId) return;

    const inventoryitemtransferid = Number(form.inventoryitemtransferid);
    if (!Number.isFinite(inventoryitemtransferid) || inventoryitemtransferid <= 0) {
      dispatch(
        showNotification({
          message: "Transfer Number is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!rows.length) {
      dispatch(
        showNotification({
          message: "No items found for this transfer",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const checkedRows = rows.filter((r) => r.itemreceived);
    if (!checkedRows.length) {
      dispatch(
        showNotification({
          message: "Select at least one item to receive",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    for (const r of checkedRows) {
      if (!Number.isFinite(Number(r.quantityreceived))) {
        dispatch(
          showNotification({
            message: `Qty Received must be a number for item ${r.itemcode}`,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
        return;
      }

      if (Number(r.quantityreceived) < 0) {
        dispatch(
          showNotification({
            message: `Qty Received must be >= 0 for item ${r.itemcode}`,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
        return;
      }

      if (Number(r.quantityreceived) > Number(r.transferquantity)) {
        dispatch(
          showNotification({
            message: `Qty Received cannot exceed Qty Transferred for item ${r.itemcode}`,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
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
      const response = await receiveTransfer({
        variables: {
          receiveInventoryTransferInput: payload,
        },
      });

      const res = response.data?.receiveInventoryTransfer;
      if (res) {
        dispatch(
          showNotification({
            message: res.message,
            type: res.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
          })
        );

        if (res.success) {
          router.back();
        }
      }

      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  const gridRows = rows;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6 col-md-12 col-sm-12">
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
              {!!defaultSysWarehouseId && (
                <div className="mt-2 text-muted">
                  Default Warehouse: {defaultSysWarehouse?.warehousename}
                </div>
              )}
              {!!user?.roleid && (
                <div className="mt-1 text-muted">User Role: {user.roleid}</div>
              )}
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-lg-12">
              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                <table className="table datanew mb-0">
                  <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                    <tr>
                      <th className="text-nowrap">☑</th>
                      <th className="text-nowrap">#</th>
                      <th className="text-nowrap">Itemcode</th>
                      <th className="text-end text-nowrap">Qty Transferred</th>
                      <th className="text-end text-nowrap">Qty Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingItems ? (
                      <tr>
                        <td colSpan={5} className="text-center">
                          Loading...
                        </td>
                      </tr>
                    ) : !gridRows.length ? (
                      <tr>
                        <td colSpan={5} className="text-center">
                          No items
                        </td>
                      </tr>
                    ) : (
                      gridRows.map((r, idx) => (
                        <tr key={r.inventoryitemtransferdetailid} className="align-middle">
                          <td>
                            <input
                              type="checkbox"
                              checked={r.itemreceived}
                              onChange={(e) => toggleRow(idx, e.target.checked)}
                            />
                          </td>
                          <td>{idx + 1}</td>
                          <td className="text-nowrap">{r.itemcode}</td>
                          <td className="text-end">{r.transferquantity}</td>
                          <td className="text-end" style={{ minWidth: 140 }}>
                            <input
                              type="number"
                              className="form-control"
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
          loadingText="Receiving..."
          className="btn btn-primary"
          disabled={!isValid}
        />
      </ActionFooter>
    </form>
  );
};

export default InventoryTransferReceiveForm;
