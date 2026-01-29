"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle, Trash2 } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select/base";

import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_INVENTORY_TRANSFER_ITEM_QUERY } from "@/lib/graphql/query/products";
import { CREATE_INVENTORY_TRANSFER_MUTATION } from "@/lib/graphql/mutations/products";
import useProducts, { ItemDetails } from "@/hooks/useProducts";
import {
  InventoryItemTransfer,
  InventoryTransferInput,
  InventoryTransferItemInput,
} from "@/types/product";
import { WarehouseType } from "@/types/warehouse";
import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { SelectOption } from "@/types/form";
import SelectTransferRequest from "@/components/forms/SelectTransferRequest";

type TransferRequestType = "REQUEST" | "INTERNAL";

type InventoryTransferFormType = {
  transferRequestId?: number;
  transferType: TransferRequestType;
  fromOutletId?: number;
  toOutletId?: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  remarks?: string;
};

type TransferRow = {
  itemid: number;
  itemcode: string;
  itemdescription: string;
  availableqty: number;
  transferquantity: number;
};

const InventoryTransferForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.data);
  const store = useAppSelector((state) => state.store.data);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  const [fromWarehouseMenuIsOpen, setFromWarehouseMenuIsOpen] = useState(false);
  const [fromWarehouseInput, setFromWarehouseInput] = useState("");
  const [toWarehouseMenuIsOpen, setToWarehouseMenuIsOpen] = useState(false);
  const [toWarehouseInput, setToWarehouseInput] = useState("");
  const [productMenuIsOpen, setProductMenuIsOpen] = useState(false);
  const [productInput, setProductInput] = useState("");

  const [getWarehousesByOutletId] = useLazyQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY);
  const [getTransferItems] = useLazyQuery(GET_INVENTORY_TRANSFER_ITEM_QUERY);
  const [defaultOutletWarehouses, setDefaultOutletWarehouses] = useState<WarehouseType[]>([]);

  const [toolItem, setToolItem] = useState<{
    itemid?: number;
    itemcode?: string;
    transferquantity: number;
  }>(() => ({
    itemid: undefined,
    itemcode: undefined,
    transferquantity: 1,
  }));

  const [rows, setRows] = useState<TransferRow[]>([]);

  const { products, loading: productsLoading, fetchProductsWithStockByStoreAndWarehouseId } =
    useProducts();

  const [createTransfer, { loading: saving }] = useMutation(
    CREATE_INVENTORY_TRANSFER_MUTATION
  );

  const outletOptions: SelectOption[] = useMemo(() => {
    const enabled = (store?.outlets || []).filter((o) => o.isenabled);
    const list = user?.roleid === 1 ? enabled : enabled.filter((o) => o.outletid === parsedOutletId);
    return list.map((o) => ({ value: o.outletid, label: o.outletname }));
  }, [store?.outlets, user?.roleid, parsedOutletId]);

  const warehouseOptionsForDefaultOutlet: SelectOption[] = useMemo(
    () =>
      defaultOutletWarehouses.map((w) => ({
        value: w.warehouseid,
        label: w.warehousename,
      })),
    [defaultOutletWarehouses]
  );

  const productOptions: SelectOption[] = useMemo(() => {
    const filtered = products.filter((p) => {
      const onHand = Number(p.itemquantityinhand || 0);
      const booked = Number(p.itemqtybooked || 0);
      const available = onHand - booked;
      return available > 0;
    });

    return filtered.map((p) => {
      const onHand = Number(p.itemquantityinhand || 0);
      const booked = Number(p.itemqtybooked || 0);
      const available = onHand - booked;
      return {
        value: p.itemid,
        label: `${p.itemcode} - ${p.itemdescription} (Qty: ${available})`,
      };
    });
  }, [products]);

  const productById = useMemo(() => {
    const map = new Map<
      number,
      { itemcode: string; itemdescription: string; availableqty: number }
    >();
    products.forEach((p) => {
      const onHand = Number(p.itemquantityinhand || 0);
      const booked = Number(p.itemqtybooked || 0);
      const available = onHand - booked;
      map.set(Number(p.itemid), {
        itemcode: p.itemcode ?? "",
        itemdescription: p.itemdescription ?? "",
        availableqty: Number.isFinite(available) ? available : 0,
      });
    });
    return map;
  }, [products]);

  const productByCode = useMemo(() => {
    const map = new Map<string, { itemid: number; itemdescription: string; availableqty: number }>();
    products.forEach((p) => {
      const code = String(p.itemcode || "").trim();
      if (!code) return;
      const onHand = Number(p.itemquantityinhand || 0);
      const booked = Number(p.itemqtybooked || 0);
      const available = onHand - booked;
      map.set(code, {
        itemid: Number(p.itemid),
        itemdescription: p.itemdescription ?? "",
        availableqty: Number.isFinite(available) ? available : 0,
      });
    });
    return map;
  }, [products]);

  const selectedProductOption: SelectOption | null = useMemo(() => {
    if (!toolItem.itemid) return null;
    const opt = productOptions.find((o) => Number(o.value) === Number(toolItem.itemid));
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [productOptions, toolItem.itemid]);

  const totalItemTransfered = useMemo(() => rows.length, [rows.length]);
  const totalQuantities = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.transferquantity || 0), 0),
    [rows]
  );

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { isValid },
  } = useForm<InventoryTransferFormType>({
    defaultValues: {
      transferType: "REQUEST",
      remarks: "",
    },
    mode: "all",
  });

  const transferType = watch("transferType");
  const fromOutletId = watch("fromOutletId");
  const toOutletId = watch("toOutletId");
  const fromWarehouseId = watch("fromWarehouseId");
  const toWarehouseId = watch("toWarehouseId");

  const prevInternalFromWarehouseIdRef = useRef<number | undefined>(undefined);

  const toWarehouseOptionsForDefaultOutlet: SelectOption[] = useMemo(() => {
    const fromId = Number(fromWarehouseId);
    if (!Number.isFinite(fromId) || fromId <= 0) return warehouseOptionsForDefaultOutlet;
    return warehouseOptionsForDefaultOutlet.filter((o) => Number(o.value) !== fromId);
  }, [warehouseOptionsForDefaultOutlet, fromWarehouseId]);

  const fetchWarehouses = async (outletId: number, kind: "DEFAULT") => {
    const result = await handleTryCatch(async () => {
      const { data } = await getWarehousesByOutletId({
        variables: { outletid: outletId },
        fetchPolicy: "no-cache",
      });
      const list = (data?.getWarehousesByOutletId || []) as WarehouseType[];
      if (kind === "DEFAULT") setDefaultOutletWarehouses(list);
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

  const clearRequestSelection = () => {
    setValue("transferRequestId", undefined);
    setValue("fromOutletId", undefined);
    setValue("toOutletId", undefined);
    setValue("fromWarehouseId", undefined);
    setValue("toWarehouseId", undefined);
    setRows([]);
  };

  const applyRequestSelection = async (selected: InventoryItemTransfer) => {
    const id = Number(selected.inventoryitemtransferid);
    if (!Number.isFinite(id) || id <= 0) {
      clearRequestSelection();
      return;
    }

    const fromOut = Number(selected.fromoutletid);
    const toOut = Number(selected.tooutletid);
    const fromWh = Number(selected.fromwarhouse);
    const toWh = Number(selected.towarehouse);

    setValue("transferRequestId", id);
    setValue("fromOutletId", Number.isFinite(fromOut) ? fromOut : undefined);
    setValue("toOutletId", Number.isFinite(toOut) ? toOut : undefined);
    setValue("fromWarehouseId", Number.isFinite(fromWh) ? fromWh : undefined);
    setValue("toWarehouseId", Number.isFinite(toWh) ? toWh : undefined);

    if (parsedStoreId && Number.isFinite(fromWh) && fromWh > 0) {
      await fetchProductsWithStockByStoreAndWarehouseId(parsedStoreId, fromWh);
    }

    await loadRequestLines(id);
  };

  const resolveSystemWarehouseId = (warehouses: WarehouseType[]) => {
    const sys = warehouses.find((w) => w.issystem);
    return sys?.warehouseid;
  };

  useEffect(() => {
    if (parsedOutletId) {
      fetchWarehouses(parsedOutletId, "DEFAULT");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  useEffect(() => {
    const fromId = Number(fromWarehouseId);
    const toId = Number(toWarehouseId);
    if (
      Number.isFinite(fromId) &&
      fromId > 0 &&
      Number.isFinite(toId) &&
      toId > 0 &&
      fromId === toId
    ) {
      setValue("toWarehouseId", undefined);
    }
  }, [fromWarehouseId, toWarehouseId, setValue]);

  useEffect(() => {
    if (transferType !== "INTERNAL") {
      prevInternalFromWarehouseIdRef.current = undefined;
      return;
    }

    const fromId = Number(fromWarehouseId);
    const normalizedFromId = Number.isFinite(fromId) && fromId > 0 ? fromId : undefined;

    if (prevInternalFromWarehouseIdRef.current !== normalizedFromId) {
      setRows([]);
      setToolItem({
        itemid: undefined,
        itemcode: undefined,
        transferquantity: 1,
      });
      setProductInput("");
    }

    prevInternalFromWarehouseIdRef.current = normalizedFromId;

    if (parsedStoreId && normalizedFromId) {
      fetchProductsWithStockByStoreAndWarehouseId(parsedStoreId, normalizedFromId);
    }
  }, [
    transferType,
    fromWarehouseId,
    parsedStoreId,
    fetchProductsWithStockByStoreAndWarehouseId,
  ]);

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined,
      itemcode: undefined,
      transferquantity: 1,
    });
  };

  const addRow = () => {
    if (!toolItem.itemid || Number(toolItem.itemid) <= 0) {
      dispatch(
        showNotification({
          message: "Select item code",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const product = productById.get(Number(toolItem.itemid));
    const available = Number(product?.availableqty || 0);

    if (!Number.isFinite(available) || available <= 0) {
      dispatch(
        showNotification({
          message: "Selected item has no available quantity",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const qty = Number(toolItem.transferquantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      dispatch(
        showNotification({
          message: "Transfer quantity is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (qty > available) {
      dispatch(
        showNotification({
          message: "Transfer quantity cannot exceed available quantity",
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

    const itemcode = product?.itemcode ?? "";
    const description = product?.itemdescription ?? "";

    setRows((prev) => [
      ...prev,
      {
        itemid: Number(toolItem.itemid),
        itemcode,
        itemdescription: description,
        availableqty: available,
        transferquantity: qty,
      },
    ]);

    resetToolItem();
  };

  const deleteRow = (itemid: number) => {
    setRows((prev) => prev.filter((r) => r.itemid !== itemid));
  };

  const loadRequestLines = async (inventoryitemtransferid: number) => {
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

      const items = (data?.getInventoryTransferItemList || []) as Array<{
        itemcode: string;
        itemdescription: string;
        transferquantity: number;
      }>;

      const missing: string[] = [];
      const mapped: TransferRow[] = [];

      items.forEach((it) => {
        const code = String(it.itemcode || "").trim();
        const resolved = productByCode.get(code);
        if (!resolved) {
          if (code) missing.push(code);
          return;
        }

        mapped.push({
          itemid: resolved.itemid,
          itemcode: code,
          itemdescription: it.itemdescription || resolved.itemdescription,
          availableqty: resolved.availableqty,
          transferquantity: Number(it.transferquantity) || 0,
        });
      });

      if (missing.length) {
        dispatch(
          showNotification({
            message: `Some items were not found in current warehouse stock: ${missing.join(", ")}`,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }

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

  const onSubmit = async (data: InventoryTransferFormType) => {
    if (!parsedStoreId || !parsedOutletId) return;

    if (transferType === "REQUEST") {
      const req = Number(data.transferRequestId);
      if (!Number.isFinite(req) || req <= 0) {
        dispatch(
          showNotification({
            message: "Select Transfer Request",
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
        return;
      }
    }

    const fromWh = Number(data.fromWarehouseId);
    const toWh = Number(data.toWarehouseId);
    if (!Number.isFinite(fromWh) || !Number.isFinite(toWh) || fromWh <= 0 || toWh <= 0) {
      dispatch(
        showNotification({
          message: "From Warehouse and To Warehouse are required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (fromWh === toWh) {
      dispatch(
        showNotification({
          message: "From and To warehouse can not be same",
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
      (r) =>
        !Number.isFinite(Number(r.transferquantity)) ||
        Number(r.transferquantity) <= 0 ||
        Number(r.transferquantity) > Number(r.availableqty)
    );

    if (invalidRow) {
      dispatch(
        showNotification({
          message: "Transfer quantity must be > 0 and <= available quantity",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload: InventoryTransferInput = {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      transfermode: transferType === "REQUEST" ? "Outlet to Outlet" : "Warehouse to Warehouse",
      fromwarehouse: fromWh,
      towarehouse: toWh,
      remarks: data.remarks || "",
      items: rows.map<InventoryTransferItemInput>((r) => ({
        itemid: r.itemid,
        transferquantity: Number(r.transferquantity),
      })),
    };

    const result = await handleTryCatch(async () => {
      const response = await createTransfer({
        variables: {
          createInventoryTransferInput: payload,
        },
      });

      const successData = response.data?.createInventoryTransfer;
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

  const fromWarehouseLabel = useMemo(() => {
    const w = defaultOutletWarehouses.find((x) => x.warehouseid === Number(fromWarehouseId));
    return w?.warehousename || (fromWarehouseId ? String(fromWarehouseId) : "");
  }, [defaultOutletWarehouses, fromWarehouseId]);

  const toWarehouseLabel = useMemo(() => {
    const w = defaultOutletWarehouses.find((x) => x.warehouseid === Number(toWarehouseId));
    return w?.warehousename || (toWarehouseId ? String(toWarehouseId) : "");
  }, [defaultOutletWarehouses, toWarehouseId]);

  const fromOutletLabel = useMemo(() => {
    const opt = outletOptions.find((o) => Number(o.value) === Number(fromOutletId));
    return opt?.label || (fromOutletId ? String(fromOutletId) : "");
  }, [fromOutletId, outletOptions]);

  const toOutletLabel = useMemo(() => {
    const opt = outletOptions.find((o) => Number(o.value) === Number(toOutletId));
    return opt?.label || (toOutletId ? String(toOutletId) : "");
  }, [toOutletId, outletOptions]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-12 col-md-12 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Transfer Type</label>
                <div className="col-md-8 d-flex gap-3">
                  <Controller
                    control={control}
                    name="transferType"
                    render={({ field }) => (
                      <>
                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            checked={field.value === "REQUEST"}
                            onChange={() => {
                              field.onChange("REQUEST");
                              setValue("transferRequestId", undefined);
                              setValue("fromOutletId", undefined);
                              setValue("toOutletId", undefined);
                              setValue("fromWarehouseId", undefined);
                              setValue("toWarehouseId", undefined);
                              setRows([]);
                            }}
                          />
                          Select by Transfer Request
                        </label>
                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            checked={field.value === "INTERNAL"}
                            onChange={() => {
                              field.onChange("INTERNAL");
                              setValue("transferRequestId", undefined);
                              setValue("fromOutletId", undefined);
                              setValue("toOutletId", undefined);
                              setRows([]);
                            }}
                          />
                          Transfer between Internal Warehouses
                        </label>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {transferType === "REQUEST" && (
            <div className="mt-4">
              <h5 className="mb-3">1. Select by Transfer Request</h5>

              <div className="row g-3">
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">Transfer Request</label>
                    <div className="col-md-8">
                      <Controller
                        control={control}
                        name="transferRequestId"
                        render={({ field }) => (
                          <SelectTransferRequest
                            storeId={parsedStoreId}
                            transferstatusid={2}
                            value={field.value}
                            onChange={(v) => {
                              field.onChange(v);
                              const id = Number(v);
                              if (!Number.isFinite(id) || id <= 0) {
                                clearRequestSelection();
                              }
                            }}
                            onChangeAdditional={(selected) => {
                              if (!selected) {
                                clearRequestSelection();
                                return;
                              }
                              void applyRequestSelection(selected);
                            }}
                            className=""
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">From Outlet</label>
                    <div className="col-md-8">
                      <input className="form-control" value={fromOutletLabel} disabled />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">To Outlet</label>
                    <div className="col-md-8">
                      <input className="form-control" value={toOutletLabel} disabled />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">From Warehouse</label>
                    <div className="col-md-8">
                      <input className="form-control" value={fromWarehouseLabel} disabled />
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">To Warehouse</label>
                    <div className="col-md-8">
                      <input className="form-control" value={toWarehouseLabel} disabled />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {transferType === "INTERNAL" && (
            <div className="mt-4">
              <h5 className="mb-3">2. Transfer between Internal Warehouses</h5>
              <div className="row g-3">
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">From Warehouse</label>
                    <div className="col-md-8">
                      <Controller
                        control={control}
                        name="fromWarehouseId"
                        render={({ field }) => (
                          <Select<SelectOption>
                            options={warehouseOptionsForDefaultOutlet}
                            value={warehouseOptionsForDefaultOutlet.find((o) => Number(o.value) === Number(field.value)) || null}
                            onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                            isClearable
                            className="form-control p-0 select-form-custom"
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              menu: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                            menuIsOpen={fromWarehouseMenuIsOpen}
                            onMenuOpen={() => setFromWarehouseMenuIsOpen(true)}
                            onMenuClose={() => setFromWarehouseMenuIsOpen(false)}
                            inputValue={fromWarehouseInput}
                            onInputChange={setFromWarehouseInput}
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
                      <Controller
                        control={control}
                        name="toWarehouseId"
                        render={({ field }) => (
                          <Select<SelectOption>
                            options={toWarehouseOptionsForDefaultOutlet}
                            value={toWarehouseOptionsForDefaultOutlet.find((o) => Number(o.value) === Number(field.value)) || null}
                            onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                            isClearable
                            className="form-control p-0 select-form-custom"
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              menu: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                            menuIsOpen={toWarehouseMenuIsOpen}
                            onMenuOpen={() => setToWarehouseMenuIsOpen(true)}
                            onMenuClose={() => setToWarehouseMenuIsOpen(false)}
                            inputValue={toWarehouseInput}
                            onInputChange={setToWarehouseInput}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
<hr />
          <div className="mt-4">
            <div className="row g-3 mt-1">
              <div className="col-lg-12">
                <div className="border rounded p-3">
                  <div className="table-responsive">
                    <div className="row g-3 align-items-end">
                      <div className="col-lg-5 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Search/Scan Item/Barcode *</label>
                          <Select<SelectOption>
                            isLoading={productsLoading}
                            options={productOptions}
                            value={selectedProductOption}
                            onChange={(opt) => {
                              const selected = products.find(
                                (p) => p.itemid === Number((opt as SelectOption | null)?.value)
                              );
                              if (!selected) {
                                setToolItem((prev) => ({
                                  ...prev,
                                  itemid: undefined,
                                  itemcode: undefined,
                                }));
                                return;
                              }
                              setToolItem((prev) => ({
                                ...prev,
                                itemid: Number(selected.itemid),
                                itemcode: String(selected.itemcode || ""),
                              }));
                            }}
                            isClearable
                            className="form-control p-0 select-form-custom"
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              menu: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                            menuIsOpen={productMenuIsOpen}
                            onMenuOpen={() => setProductMenuIsOpen(true)}
                            onMenuClose={() => setProductMenuIsOpen(false)}
                            inputValue={productInput}
                            onInputChange={setProductInput}
                          />
                        </div>
                      </div>

                      <div className="col-lg-4 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Description</label>
                          <input
                            type="text"
                            className="form-control"
                            value={productById.get(Number(toolItem.itemid || 0))?.itemdescription || ""}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="col-lg-2 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            step="0.001"
                            min={0}
                            className="form-control px-1 text-end"
                            value={toolItem.transferquantity}
                            onChange={(e) => {
                              const n = Number(e.target.value || 0);
                              const normalized = Math.round(Math.abs(n) * 1000) / 1000;
                              setToolItem((prev) => ({
                                ...prev,
                                transferquantity: normalized,
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

                    <div className="row g-3 mt-2">
                      <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="input-blocks">
                          <label>Quantity on Hand</label>
                          <input
                            type="text"
                            className="form-control"
                            value={String(productById.get(Number(toolItem.itemid || 0))?.availableqty ?? "")}
                            readOnly
                          />
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
                                <td>{index + 1}</td>
                                <td className="text-nowrap">{r.itemcode}</td>
                                <td>{r.itemdescription}</td>
                                <td className="text-end" style={{ width: 140 }}>
                                  <input
                                    type="number"
                                    step="0.001"
                                    min={0}
                                    className="form-control form-control-sm px-1 text-end"
                                    value={r.transferquantity}
                                    onChange={(e) => {
                                      const n = Number(e.target.value || 0);
                                      const normalized = Math.round(Math.abs(n) * 1000) / 1000;
                                      setRows((prev) =>
                                        prev.map((x) =>
                                          x.itemid === r.itemid
                                            ? {
                                                ...x,
                                                transferquantity: normalized,
                                              }
                                            : x
                                        )
                                      );
                                    }}
                                  />
                                </td>
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

          <div className="row mt-3">
            <div className="col-md-6"></div>
            <div className="col-md-6">
              <div className="d-flex justify-content-between">
                <div>Total Items:</div>
                <div>{totalItemTransfered}</div>
              </div>
              <div className="d-flex justify-content-between">
                <div>Total Quantities:</div>
                <div>{totalQuantities}</div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="input-blocks mb-0">
              <label className="form-label">Remarks</label>
              <Controller
                control={control}
                name="remarks"
                render={({ field }) => (
                  <textarea className="form-control" rows={3} {...field} />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={saving}
          btnText="Transfer"
          loadingText="Transfer..."
          className="btn btn-primary"
          disabled={!isValid}
        />
      </ActionFooter>
    </form>
  );
};

export default InventoryTransferForm;
