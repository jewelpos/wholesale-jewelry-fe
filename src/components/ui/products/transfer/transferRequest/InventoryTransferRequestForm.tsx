"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle, Trash2 } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select/base";

import SelectProduct from "@/components/forms/SelectProduct";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import useOutlets from "@/hooks/useOutlets";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { REQUEST_INVENTORY_TRANSFER_MUTATION } from "@/lib/graphql/mutations/products";
import { WarehouseType } from "@/types/warehouse";
import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { SelectOption } from "@/types/form";
import { useNavigationGuard } from "@/lib/context/NavigationGuardContext";

// A "Request Transfer" is a PULL: the outlet you're logged into is always the one
// asking to RECEIVE stock (the destination/"To Outlet", fixed to your current outlet —
// you can only request transfers for yourself). "From Outlet" is the other outlet you
// pick as the supplier; its stock is what actually needs to be sufficient.
type InventoryTransferRequestFormType = {
  fromOutletId?: number;
  fromwarehouse?: number;
  remarks?: string;
};

type RequestInventoryTransferItemInput = {
  itemid: number;
  transferquantity: number;
};

type RequestInventoryTransferInput = {
  storeid: number;
  outletid: number;
  fromwarehouse: number;
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

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  const [fromOutletMenuIsOpen, setFromOutletMenuIsOpen] = useState(false);
  const [fromOutletInput, setFromOutletInput] = useState("");
  const [getWarehousesByOutletId] = useLazyQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY);
  // The requester doesn't need login access to the supplying outlet, so this must list
  // every outlet in the store, not the caller's own permission-scoped outlet list (which
  // getStore/state.store.data deliberately restricts to outlets the user is assigned to).
  const { fetchOutletsList, outlets: allStoreOutlets } = useOutlets();

  // The current (logged-in) outlet's own warehouses — this is always the destination.
  const [currentOutletWarehouses, setCurrentOutletWarehouses] = useState<WarehouseType[]>([]);
  // The picked supplier outlet's warehouses.
  const [fromOutletWarehouses, setFromOutletWarehouses] = useState<WarehouseType[]>([]);

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

  useEffect(() => {
    if (parsedStoreId) fetchOutletsList([parsedStoreId], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedStoreId]);

  const currentOutletName = useMemo(
    () => ((allStoreOutlets || []) as any[]).find((o) => Number(o.outletid) === parsedOutletId)?.outletname || "",
    [allStoreOutlets, parsedOutletId]
  );

  const fromOutletOptions: SelectOption[] = useMemo(() => {
    const enabled = (allStoreOutlets || []).filter((o: any) => o.isenabled);
    return enabled
      .filter((o: any) => Number(o.outletid) !== parsedOutletId)
      .map((o: any) => ({ value: o.outletid, label: o.outletname }));
  }, [allStoreOutlets, parsedOutletId]);

  const resolveSystemWarehouse = (warehouses: WarehouseType[]) => {
    const sys = warehouses.find((w) => w.issystem);
    return sys ?? warehouses[0];
  };

  const currentOutletSysWarehouse = useMemo(
    () => resolveSystemWarehouse(currentOutletWarehouses),
    [currentOutletWarehouses]
  );

  const fromOutletSysWarehouse = useMemo(
    () => resolveSystemWarehouse(fromOutletWarehouses),
    [fromOutletWarehouses]
  );

  const {
    control,
    watch,
    setValue,
    resetField,
    trigger,
    handleSubmit,
    formState: { isValid },
  } = useForm<InventoryTransferRequestFormType>({
    defaultValues: {
      remarks: "",
    },
    mode: "all",
  });

  const fromOutletId = watch("fromOutletId");

  useEffect(() => {
    const fromId = Number(fromOutletId);
    if (
      Number.isFinite(parsedOutletId) &&
      parsedOutletId > 0 &&
      Number.isFinite(fromId) &&
      fromId > 0 &&
      fromId === parsedOutletId
    ) {
      resetField("fromOutletId");
    }
  }, [fromOutletId, parsedOutletId, resetField]);

  const fetchWarehouses = async (outletId: number, kind: "CURRENT" | "FROM") => {
    const result = await handleTryCatch(async () => {
      const { data } = await getWarehousesByOutletId({
        variables: { outletid: outletId },
        fetchPolicy: "no-cache",
      });
      const list = (data?.getWarehousesByOutletId || []) as WarehouseType[];

      if (kind === "CURRENT") setCurrentOutletWarehouses(list);
      if (kind === "FROM") setFromOutletWarehouses(list);

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
      fetchWarehouses(parsedOutletId, "CURRENT");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  useEffect(() => {
    if (fromOutletId) {
      fetchWarehouses(Number(fromOutletId), "FROM");
    } else {
      setFromOutletWarehouses([]);
      resetField("fromwarehouse");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromOutletId]);

  useEffect(() => {
    if (fromOutletSysWarehouse?.warehouseid) {
      setValue("fromwarehouse", fromOutletSysWarehouse.warehouseid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromOutletSysWarehouse?.warehouseid]);

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined,
      itemcode: undefined,
      itemdescription: undefined,
      quantityrequest: 1,
    });
    setSelectProductClearKey((k) => k + 1);
  };

  // Switching "From Outlet" invalidates whatever item was selected/typed against the
  // previous one.
  useEffect(() => {
    resetToolItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromOutletSysWarehouse?.warehouseid]);

  const totalItemTransfered = useMemo(() => rows.length, [rows.length]);
  const totalQuantities = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantityrequest || 0), 0),
    [rows]
  );

  const fromWarehouseName = fromOutletSysWarehouse?.warehousename || "";
  const toWarehouseName = currentOutletSysWarehouse?.warehousename || "";
  const toolDescription = toolItem.itemdescription || "";

  const addRow = () => {
    const fromWh = Number(watch("fromwarehouse"));
    if (!Number.isFinite(fromWh) || fromWh <= 0) {
      dispatch(
        showNotification({
          message: "From Outlet is required",
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

  // Items already added are scoped to whichever "From Outlet" was picked — switching
  // outlets mid-request would silently carry over items that no longer make sense, so
  // the outlet picker locks after selection and can only be changed via an explicit Reset.
  const handleResetFromOutlet = () => {
    resetField("fromOutletId");
    setRows([]);
    resetToolItem();
  };

  // Registers with the app-wide navigation guard (see NavigationGuardContext.tsx and the
  // identical wiring in CustomerForm.tsx) so leaving with requested items still in the
  // list via a sidebar link asks Save / Discard / Cancel instead of silently losing them.
  // The header fields (react-hook-form) aren't the real signal of unsaved work here —
  // the requested-items list (plain component state, not part of the form) is.
  const { registerGuard } = useNavigationGuard();
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  useEffect(() => {
    return registerGuard({
      isDirty: () => rowsRef.current.length > 0,
      onSave: () => handleSubmit(onSubmit)(),
      onDiscard: () => handleResetFromOutlet(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: InventoryTransferRequestFormType) => {
    if (!parsedStoreId || !parsedOutletId) return;

    const fromWh = Number(data.fromwarehouse);
    if (!Number.isFinite(fromWh) || fromWh <= 0) {
      dispatch(
        showNotification({
          message: "From Outlet is required",
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
      fromwarehouse: fromWh,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">From Outlet</label>
                <div className="col-md-8 d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                    <Controller
                      control={control}
                      name="fromOutletId"
                      render={({ field }) => (
                        <Select<SelectOption>
                          options={fromOutletOptions}
                          value={fromOutletOptions.find((o) => Number(o.value) === Number(field.value)) || null}
                          onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                          isDisabled={!!field.value}
                          className="form-control p-0 select-form-custom"
                          menuPortalTarget={portalTarget}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            menu: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          menuIsOpen={fromOutletMenuIsOpen}
                          onMenuOpen={() => setFromOutletMenuIsOpen(true)}
                          onMenuClose={() => setFromOutletMenuIsOpen(false)}
                          inputValue={fromOutletInput}
                          onInputChange={setFromOutletInput}
                        />
                      )}
                    />
                  </div>
                  {fromOutletId ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary text-nowrap"
                      onClick={handleResetFromOutlet}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

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
                  <input className="form-control" value={currentOutletName} disabled />
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
                          <label>Search/Scan Item/Barcode <span className="text-danger">*</span></label>
                          <SelectProduct
                            storeId={parsedStoreId}
                            hasWarehouseId={true}
                            warehouseId={fromOutletSysWarehouse?.warehouseid}
                            disableField={!fromOutletSysWarehouse?.warehouseid}
                            trigger={trigger}
                            value={toolItem.itemid}
                            clearKey={selectProductClearKey}
                            onChange={(val: number | undefined) =>
                              setToolItem((prev) => ({ ...prev, itemid: val }))
                            }
                            onNotFound={() => {
                              dispatch(
                                showNotification({
                                  message: `Item not available at ${fromWarehouseName || "the selected outlet"}`,
                                  type: NOTIFICATION_TYPES.ERROR,
                                })
                              );
                            }}
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
                          {!fromOutletSysWarehouse?.warehouseid && (
                            <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                              Select a From Outlet first
                            </div>
                          )}
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
                          <label>
                            Quantity <span className="text-danger">*</span>
                          </label>
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
                            <th className="text-end text-nowrap">Requested Qty</th>
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
