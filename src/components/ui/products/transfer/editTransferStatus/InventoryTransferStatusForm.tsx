"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";

import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  GET_INVENTORY_TRANSFER_ITEM_QUERY,
} from "@/lib/graphql/query/products";
import { CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION } from "@/lib/graphql/mutations/products";
import { UpdateInventoryTransferStatusInput } from "@/types/product";
import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";
import SelectInventoryStatus from "@/components/forms/SelectInventoryStatus";
import SelectTransferRequest from "@/components/forms/SelectTransferRequest";

type TransferItem = {
  inventoryitemtransferdetailid: number;
  inventoryitemtransferid: number;
  itemcode: string;
  itemdescription: string;
  transferquantity: number;
};

type FormType = {
  inventoryitemtransferid?: number;
  transferstatusid?: number;
};

const InventoryTransferStatusForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [selectedTransferItems, setSelectedTransferItems] = useState<TransferItem[]>([]);
  const [getTransferItems] = useLazyQuery(GET_INVENTORY_TRANSFER_ITEM_QUERY);

  const [changeStatus, { loading: saving }] = useMutation(
    CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION
  );

  const {
    control,
    watch,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormType>({
    defaultValues: {
      inventoryitemtransferid: undefined,
      transferstatusid: undefined,
    },
    mode: "all",
  });

  const selectedTransferId = watch("inventoryitemtransferid");

  const loadTransferPreview = async (inventoryitemtransferid: number) => {
    if (!parsedStoreId) return;

    setSelectedTransferItems([]);

    const itemsResult = await handleTryCatch(async () => {
      const { data } = await getTransferItems({
        variables: {
          storeid: parsedStoreId,
          inventoryitemtransferid,
        },
        fetchPolicy: "no-cache",
      });

      const items = (data?.getInventoryTransferItemList || []) as TransferItem[];
      setSelectedTransferItems(items);
      return true;
    });

    if (itemsResult.error) {
      dispatch(
        showNotification({
          message: itemsResult.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  useEffect(() => {
    if (!selectedTransferId || Number(selectedTransferId) <= 0) {
      setSelectedTransferItems([]);
      return;
    }

    loadTransferPreview(Number(selectedTransferId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTransferId]);

  const onSubmit = async (data: FormType) => {
    if (!parsedStoreId) return;

    const inventoryitemtransferid = Number(data.inventoryitemtransferid);
    if (!Number.isFinite(inventoryitemtransferid) || inventoryitemtransferid <= 0) {
      dispatch(
        showNotification({
          message: "Select Transfer Request",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const transferstatusid = Number(data.transferstatusid);
    if (!Number.isFinite(transferstatusid) || transferstatusid <= 0) {
      dispatch(
        showNotification({
          message: "Status is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (transferstatusid === 4) {
      dispatch(
        showNotification({
          message: "Status 4 cannot be set here. Use Receive Transfer to complete.",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload: UpdateInventoryTransferStatusInput = {
      storeid: parsedStoreId,
      inventoryitemtransferid,
      transferstatusid,
    };

    const result = await handleTryCatch(async () => {
      const response = await changeStatus({
        variables: {
          changeInventoryTransferStatusInput: payload,
        },
      });

      const successData = response.data?.changeInventoryTransferStatus;
      if (successData) {
        dispatch(
          showNotification({
            message: successData.message,
            type: successData.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          })
        );

        if (successData.success) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Select Transfer Request</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="inventoryitemtransferid"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <SelectTransferRequest
                        storeId={parsedStoreId}
                        transferstatusid={4}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        className=""
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Status</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="transferstatusid"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <SelectInventoryStatus
                        storeId={parsedStoreId}
                        value={field.value}
                        excludeIds={[4]}
                        onChange={(v) => {
                          const n = Number(v);
                          if (n === 4) {
                            dispatch(
                              showNotification({
                                message:
                                  "Status 4 cannot be set here. Use Receive Transfer to complete.",
                                type: NOTIFICATION_TYPES.ERROR,
                              })
                            );
                            return;
                          }
                          field.onChange(v);
                        }}
                        className=""
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-lg-12">
              <div className="border rounded p-3">
                <div className="row g-3">
                  <div className="col-lg-12">
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      <table className="table datanew mt-3 mb-0">
                        <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                          <tr>
                            <th className="text-nowrap">#</th>
                            <th className="text-nowrap">Item Code</th>
                            <th>Description</th>
                            <th className="text-end text-nowrap">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!selectedTransferItems.length ? (
                            <tr>
                              <td colSpan={4} className="text-center">
                                No items
                              </td>
                            </tr>
                          ) : (
                            selectedTransferItems.map((it, index) => (
                              <tr key={it.inventoryitemtransferdetailid} className="align-middle">
                                <td>{index + 1}</td>
                                <td className="text-nowrap">{it.itemcode}</td>
                                <td>{it.itemdescription}</td>
                                <td className="text-end">{it.transferquantity}</td>
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
          </div>
        </div>
      </div>

      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={saving}
          btnText="Update Status"
          loadingText="Update..."
          className="btn btn-primary"
          disabled={!isValid}
        />
      </ActionFooter>
    </form>
  );
};

export default InventoryTransferStatusForm;
