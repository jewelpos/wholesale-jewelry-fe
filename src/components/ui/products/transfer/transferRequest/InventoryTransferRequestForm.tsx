"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle, Trash2 } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select/base";

import SelectProduct from "@/components/forms/SelectProduct";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { REQUEST_INVENTORY_TRANSFER_MUTATION } from "@/lib/graphql/mutations/products";
import { WarehouseType } from "@/types/warehouse";
import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { SelectOption } from "@/types/form";

type InventoryTransferRequestFormType = {
  toOutletId?: number;
  towarehouse?: number;
  remarks?: string;
};

type RequestInventoryTransferItemInput = {
  itemid: number;
  transferquantity: number;
};

type RequestInventoryTransferInput = {
  storeid: number;
  outletid: number;
  towarehouse: number;
  remarks?: string;
  items: RequestInventoryTransferItemInput[];
};

type RequestRow = {
  itemid: number;
  itemcode: string;
  itemdescription: string;
  quantityrequest: number;
};

const InventoryTransferRequestForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const store = useAppSelector((state) => state.store.data);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  const [toOutletMenuIsOpen, setToOutletMenuIsOpen] = useState(false);
  const [toOutletInput, setToOutletInput] = useState("");
  const [getWarehousesByOutletId] = useLazyQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY);

  const [defaultOutletWarehouses, setDefaultOutletWarehouses] = useState<WarehouseType[]>([]);
  const [toOutletWarehouses, setToOutletWarehouses] = useState<WarehouseType[]>([]);

  const [toolItem, setToolItem] = useState<{
    itemid?: number;
    itemcode?: string;
    itemdescription?: string;
    quantityrequest: number;
  }>(() => ({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: undefined,
    quantityrequest: 1,
  }));

  const [selectProductClearKey, setSelectProductClearKey] = useState(0);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<RequestRow[]>([]);

  const [requestTransfer, { loading: saving }] = useMutation(
    REQUEST_INVENTORY_TRANSFER_MUTATION
  );

  const toOutletOptions: SelectOption[] = useMemo(() => {
    const enabled = (store?.outlets || []).filter((o) => o.isenabled);
    return enabled
      .filter((o) => Number(o.outletid) !== parsedOutletId)
      .map((o) => ({ value: o.outletid, label: o.outletname }));
  }, [store?.outlets, parsedOutletId]);

  const resolveSystemWarehouse = (warehouses: WarehouseType[]) => {
    const sys = warehouses.find((w) => w.issystem);
    return sys;
  };

  const defaultSysWarehouse = useMemo(
    () => resolveSystemWarehouse(defaultOutletWarehouses),
    [defaultOutletWarehouses]
  );

  const defaultSysWarehouseId = defaultSysWarehouse?.warehouseid;

  const toOutletSysWarehouse = useMemo(
    () => resolveSystemWarehouse(toOutletWarehouses),
    [toOutletWarehouses]
  );

  const {
    control,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { isValid },
  } = useForm<InventoryTransferRequestFormType>({
    defaultValues: {
      remarks: "",
    },
    mode: "all",
  });

  const toOutletId = watch("toOutletId");

  useEffect(() => {
    const toId = Number(toOutletId);
    if (
      Number.isFinite(parsedOutletId) &&
      parsedOutletId > 0 &&
      Number.isFinite(toId) &&
      toId > 0 &&
      toId === parsedOutletId
    ) {
      setValue("toOutletId", undefined);
    }
  }, [toOutletId, parsedOutletId, setValue]);

  const fetchWarehouses = async (outletId: number, kind: "DEFAULT" | "TO") => {
    const result = await handleTryCatch(async () => {
      const { data } = await getWarehousesByOutletId({
        variables: { outletid: outletId },
        fetchPolicy: "no-cache",
      });
      const list = (data?.getWarehousesByOutletId || []) as WarehouseType[];

      if (kind === "DEFAULT") setDefaultOutletWarehouses(list);
      if (kind === "TO") setToOutletWarehouses(list);

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
    if (parsedOutletId) {
      fetchWarehouses(parsedOutletId, "DEFAULT");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  useEffect(() => {
    if (toOutletId) {
      fetchWarehouses(Number(toOutletId), "TO");
    } else {
      setToOutletWarehouses([]);
      setValue("towarehouse", undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toOutletId]);

  useEffect(() => {
    if (toOutletSysWarehouse?.warehouseid) {
      setValue("towarehouse", toOutletSysWarehouse.warehouseid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toOutletSysWarehouse?.warehouseid]);

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined,
      itemcode: undefined,
      itemdescription: undefined,
      quantityrequest: 1,
    });
    setSelectProductClearKey((k) => k + 1);
  };

  const totalItemTransfered = useMemo(() => rows.length, [rows.length]);
  const totalQuantities = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantityrequest || 0), 0),
    [rows]
  );

  const addRow = () => {
    const toWh = Number(watch("towarehouse"));
    if (!Number.isFinite(toWh) || toWh <= 0) {
      dispatch(
        showNotification({
          message: "To Outlet is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!toolItem.itemid || Number(toolItem.itemid) <= 0) {
      dispatch(
        showNotification({
          message: "Product is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!toolItem.itemcode || String(toolItem.itemcode).trim() === "") {
      dispatch(
        showNotification({
          message: "Product is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const qtyValue = Number(toolItem.quantityrequest);
    if (!Number.isFinite(qtyValue) || qtyValue <= 0) {
      dispatch(
        showNotification({
          message: "Quantity is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const exists = rows.some((r) => r.itemid === toolItem.itemid);
    if (exists) {
      dispatch(
        showNotification({
          message: "Item already added",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        itemid: Number(toolItem.itemid),
        itemcode: String(toolItem.itemcode || ""),
        itemdescription: toolItem.itemdescription || "",
        quantityrequest: qtyValue,
      },
    ]);

    resetToolItem();
  };

  const deleteRow = (itemid: number) => {
    setRows((prev) => prev.filter((r) => r.itemid !== itemid));
  };

  const onSubmit = async (data: InventoryTransferRequestFormType) => {
    if (!parsedStoreId || !parsedOutletId) return;

    const toWh = Number(data.towarehouse);
    if (!Number.isFinite(toWh) || toWh <= 0) {
      dispatch(
        showNotification({
          message: "To Outlet is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!rows.length) {
      dispatch(
        showNotification({
          message: "Add at least one item",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const invalidRow = rows.find(
      (r) => !Number.isFinite(Number(r.quantityrequest)) || Number(r.quantityrequest) <= 0
    );

    if (invalidRow) {
      dispatch(
        showNotification({
          message: "Quantity must be > 0",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload: RequestInventoryTransferInput = {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      towarehouse: toWh,
      remarks: data.remarks || "",
      items: rows.map<RequestInventoryTransferItemInput>((r) => ({
        itemid: r.itemid,
        transferquantity: Number(r.quantityrequest),
      })),
    };

    const result = await handleTryCatch(async () => {
      const response = await requestTransfer({
        variables: {
          requestInventoryTransferInput: payload,
        },
      });

      const successData = response.data?.requestInventoryTransfer;
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

  const fromWarehouseName = defaultSysWarehouse?.warehousename || "";
  const toWarehouseName = toOutletSysWarehouse?.warehousename || "";
  const toolDescription = toolItem.itemdescription || "";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">From Warehouse</label>
                <div className="col-md-8">
                  <input className="form-control" value={fromWarehouseName} disabled />
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">To Outlet</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="toOutletId"
                    render={({ field }) => (
                      <Select<SelectOption>
                        options={toOutletOptions}
                        value={toOutletOptions.find((o) => Number(o.value) === Number(field.value)) || null}
                        onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                        isClearable
                        className="form-control p-0 select-form-custom"
                        menuPortalTarget={portalTarget}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        menuIsOpen={toOutletMenuIsOpen}
                        onMenuOpen={() => setToOutletMenuIsOpen(true)}
                        onMenuClose={() => setToOutletMenuIsOpen(false)}
                        inputValue={toOutletInput}
                        onInputChange={setToOutletInput}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">To Warehouse</label>
                <div className="col-md-8">
                  <input className="form-control" value={toWarehouseName} disabled />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="row g-3 mt-1">
              <div className="col-lg-12">
                <div className="border rounded p-3">
                  <div className="table-responsive">
                    <div className="row g-3 align-items-end">
                      <div className="col-lg-5 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Search/Scan Item/Barcode *</label>
                          <SelectProduct
                            storeId={parsedStoreId}
                            hasWarehouseId={true}
                            warehouseId={defaultSysWarehouseId}
                            trigger={trigger}
                            value={toolItem.itemid}
                            clearKey={selectProductClearKey}
                            onChange={(val: number | undefined) =>
                              setToolItem((prev) => ({ ...prev, itemid: val }))
                            }
                            onChangeAdditional={(selected: any) => {
                              if (!selected) {
                                setToolItem((prev) => ({
                                  ...prev,
                                  itemid: undefined,
                                  itemcode: undefined,
                                  itemdescription: undefined,
                                }));
                                return;
                              }
                              setToolItem((prev) => ({
                                ...prev,
                                itemid: Number(selected?.itemid ?? prev.itemid),
                                itemcode:
                                  selected?.itemcode != null
                                    ? String(selected.itemcode)
                                    : prev.itemcode,
                                itemdescription:
                                  selected?.itemdescription != null
                                    ? String(selected.itemdescription)
                                    : prev.itemdescription,
                              }));
                              setTimeout(() => qtyInputRef.current?.focus(), 50);
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-lg-4 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Description</label>
                          <input
                            type="text"
                            className="form-control"
                            value={toolDescription}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="col-lg-2 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Quantity *</label>
                          <input
                            ref={qtyInputRef}
                            type="number"
                            step="0.001"
                            min={0}
                            className="form-control px-1 text-end"
                            value={toolItem.quantityrequest}
                            onChange={(e) => {
                              const n = Number(e.target.value || 0);
                              const normalized = Math.round(Math.abs(n) * 1000) / 1000;
                              setToolItem((prev) => ({
                                ...prev,
                                quantityrequest: normalized,
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-lg-1 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>&nbsp;</label>
                          <button
                            type="button"
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                            onClick={addRow}
                          >
                            <PlusCircle />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ maxHeight: 480, overflowY: "auto" }}>
                      <table className="table datanew mt-3 mb-0">
                        <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                          <tr>
                            <th className="text-nowrap">#</th>
                            <th className="text-nowrap">Item Code</th>
                            <th>Description</th>
                            <th className="text-end text-nowrap">Qty</th>
                            <th className="text-center text-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!rows.length ? (
                            <tr>
                              <td colSpan={5} className="text-center">
                                No items
                              </td>
                            </tr>
                          ) : (
                            rows.map((r, index) => (
                              <tr key={r.itemid} className="align-middle">
                                <td>
                                  {index + 1}
                                  <input type="hidden" value={r.itemid} />
                                </td>
                                <td className="text-nowrap">{r.itemcode}</td>
                                <td>{r.itemdescription}</td>
                                <td className="text-end">{r.quantityrequest}</td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => deleteRow(r.itemid)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
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
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <div className="input-blocks mb-3 row align-items-center">
                  <label className="col-form-label col-md-4">Total Items</label>
                  <div className="col-md-8">
                    <input
                      type="number"
                      className="form-control"
                      value={totalItemTransfered}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Total Quantities</label>
                  <div className="col-md-8">
                    <input
                      type="number"
                      className="form-control"
                      value={totalQuantities}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Remarks</label>
                  <div className="col-md-8">
                    <Controller
                      control={control}
                      name="remarks"
                      render={({ field }) => (
                        <textarea className="form-control" rows={4} {...field} />
                      )}
                    />
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
          btnText="Submit Request"
          loadingText="Transfer..."
          className="btn btn-primary"
          disabled={!isValid}
        />
      </ActionFooter>
    </form>
  );
};

export default InventoryTransferRequestForm;
