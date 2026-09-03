"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, PlusCircle, Trash2 } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import Select from "react-select/base";

import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_INVENTORY_TRANSFER_ITEM_QUERY, GET_PRODUCT_SETTINGS_INFO_QUERY } from "@/lib/graphql/query/products";
import { CREATE_INVENTORY_TRANSFER_MUTATION, CREATE_DIRECT_OUTLET_TRANSFER_MUTATION } from "@/lib/graphql/mutations/products";
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
import SelectProduct from "@/components/forms/SelectProduct";
import { BarcodeScannerModal } from "@/components/ui/sales/invoiceForm/BarcodeScannerModal";

type TransferRequestType = "REQUEST" | "INTERNAL" | "DIRECT";

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
  itemunit?: string;
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
  const [fromOutletMenuIsOpen, setFromOutletMenuIsOpen] = useState(false);
  const [fromOutletInput, setFromOutletInput] = useState("");
  const [toOutletMenuIsOpen, setToOutletMenuIsOpen] = useState(false);
  const [toOutletInput, setToOutletInput] = useState("");
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
  const [createDirectTransfer, { loading: savingDirect }] = useMutation(
    CREATE_DIRECT_OUTLET_TRANSFER_MUTATION
  );

  // "Outlet to Outlet" direct-transfer tab: no request/approve step, restricted to each
  // outlet's own system warehouse (resolved here, not user-selectable), scanned the same
  // way as the invoice form — Pc items auto-add/increment on scan (when carriage is
  // enabled for the source warehouse), Wt items populate a tool row for a manual qty/
  // weight entry since each piece is distinct and can't be auto-incremented.
  const [directFromWarehouseId, setDirectFromWarehouseId] = useState<number | undefined>(undefined);
  const [directFromWarehouseName, setDirectFromWarehouseName] = useState<string | undefined>(undefined);
  const [directToWarehouseId, setDirectToWarehouseId] = useState<number | undefined>(undefined);
  const [directToWarehouseName, setDirectToWarehouseName] = useState<string | undefined>(undefined);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScanValue, setBarcodeScanValue] = useState<string | undefined>(undefined);
  const [directProductClearKey, setDirectProductClearKey] = useState(0);
  const [directToolItem, setDirectToolItem] = useState<{
    itemid?: number;
    itemcode?: string;
    itemdescription?: string;
    itemunit?: string;
    availableqty: number;
    transferquantity: number;
  }>({ itemid: undefined, itemcode: undefined, itemdescription: undefined, itemunit: undefined, availableqty: 0, transferquantity: 1 });

  const { data: directProductSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: directFromWarehouseId },
    skip: !parsedStoreId || !directFromWarehouseId,
  });
  const directAllowCarriage = !!directProductSettingsData?.getProductSettingsInfo?.[0]?.allowcarriage;

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

  // DIRECT mode: from/to are OUTLETS, not warehouses — resolve each to that outlet's own
  // system warehouse (never a manual choice, matching the Request-Transfer flow's own
  // convention). fromOutletId===toOutletId is blocked the same way from/to warehouse
  // equality already is above.
  useEffect(() => {
    const fromId = Number(fromOutletId);
    const toId = Number(toOutletId);
    if (Number.isFinite(fromId) && fromId > 0 && Number.isFinite(toId) && toId > 0 && fromId === toId) {
      setValue("toOutletId", undefined);
    }
  }, [fromOutletId, toOutletId, setValue]);

  const prevDirectFromOutletIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (transferType !== "DIRECT") {
      prevDirectFromOutletIdRef.current = undefined;
      return;
    }

    const outletId = Number(fromOutletId);
    const normalizedOutletId = Number.isFinite(outletId) && outletId > 0 ? outletId : undefined;

    if (prevDirectFromOutletIdRef.current !== normalizedOutletId) {
      setRows([]);
      setDirectToolItem({ itemid: undefined, itemcode: undefined, itemdescription: undefined, itemunit: undefined, availableqty: 0, transferquantity: 1 });
      setDirectFromWarehouseId(undefined);
      setDirectFromWarehouseName(undefined);
    }
    prevDirectFromOutletIdRef.current = normalizedOutletId;

    if (!normalizedOutletId) return;

    (async () => {
      const result = await handleTryCatch(async () => {
        const { data } = await getWarehousesByOutletId({
          variables: { outletid: normalizedOutletId },
          fetchPolicy: "no-cache",
        });
        const list = (data?.getWarehousesByOutletId || []) as WarehouseType[];
        const sysWarehouse = list.find((w) => w.issystem);
        if (!sysWarehouse) {
          throw new Error("Selected outlet has no active system warehouse");
        }
        setDirectFromWarehouseId(sysWarehouse.warehouseid);
        setDirectFromWarehouseName(sysWarehouse.warehousename);
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    })();
  }, [transferType, fromOutletId, getWarehousesByOutletId, dispatch]);

  useEffect(() => {
    if (transferType !== "DIRECT") {
      setDirectToWarehouseId(undefined);
      setDirectToWarehouseName(undefined);
      return;
    }
    const outletId = Number(toOutletId);
    if (!Number.isFinite(outletId) || outletId <= 0) {
      setDirectToWarehouseId(undefined);
      setDirectToWarehouseName(undefined);
      return;
    }
    (async () => {
      const result = await handleTryCatch(async () => {
        const { data } = await getWarehousesByOutletId({
          variables: { outletid: outletId },
          fetchPolicy: "no-cache",
        });
        const list = (data?.getWarehousesByOutletId || []) as WarehouseType[];
        const sysWarehouse = list.find((w) => w.issystem);
        if (!sysWarehouse) {
          throw new Error("Selected outlet has no active system warehouse");
        }
        setDirectToWarehouseId(sysWarehouse.warehouseid);
        setDirectToWarehouseName(sysWarehouse.warehousename);
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    })();
  }, [transferType, toOutletId, getWarehousesByOutletId, dispatch]);

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

  const resetDirectToolItem = () => {
    setDirectToolItem({ itemid: undefined, itemcode: undefined, itemdescription: undefined, itemunit: undefined, availableqty: 0, transferquantity: 1 });
  };

  // Mirrors SalesInvoiceForm.tsx's autoAddItem — scan a Pc item with carriage enabled and
  // it's added (or merged onto its existing row) immediately; a Wt item, or carriage
  // disabled, instead populates the tool row below for an explicit qty/weight entry,
  // since a Wt piece can't be auto-incremented (each one is physically distinct) and a
  // disabled-carriage warehouse wants a deliberate confirm step either way.
  const handleDirectItemSelect = (selected: ItemDetails | null) => {
    if (!selected) return;
    const isWtItem = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
    const availableqty = Number(selected.itemquantityinhand || 0);

    if (directAllowCarriage && !isWtItem) {
      let blocked = false;
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.itemid === Number(selected.itemid));
        if (idx >= 0) {
          const newQty = prev[idx].transferquantity + 1;
          if (newQty > availableqty) {
            blocked = true;
            return prev;
          }
          const updated = [...prev];
          updated[idx] = { ...updated[idx], transferquantity: newQty, availableqty };
          return updated;
        }
        if (availableqty < 1) {
          blocked = true;
          return prev;
        }
        return [
          ...prev,
          {
            itemid: Number(selected.itemid),
            itemcode: selected.itemcode ?? "",
            itemdescription: selected.itemdescription ?? "",
            itemunit: selected.itemunit,
            availableqty,
            transferquantity: 1,
          },
        ];
      });
      if (blocked) {
        dispatch(showNotification({ message: `${selected.itemcode || "Item"}: only ${availableqty} in stock`, type: NOTIFICATION_TYPES.ERROR }));
      }
      setDirectProductClearKey((k) => k + 1);
      return;
    }

    setDirectToolItem({
      itemid: Number(selected.itemid),
      itemcode: selected.itemcode,
      itemdescription: selected.itemdescription,
      itemunit: selected.itemunit,
      availableqty,
      transferquantity: isWtItem ? 0 : 1,
    });
  };

  const addDirectRow = () => {
    if (!directToolItem.itemid) {
      dispatch(showNotification({ message: "Select item code", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const qty = Number(directToolItem.transferquantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      dispatch(showNotification({ message: "Transfer quantity is required", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const isWtItem = (directToolItem.itemunit ?? "").trim().toLowerCase() === "wt";
    const existingIdx = isWtItem ? -1 : rows.findIndex((r) => r.itemid === directToolItem.itemid);
    const existingQty = existingIdx >= 0 ? rows[existingIdx].transferquantity : 0;
    if (existingQty + qty > directToolItem.availableqty) {
      dispatch(showNotification({ message: `Only ${directToolItem.availableqty} in stock`, type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    setRows((prev) => {
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], transferquantity: existingQty + qty };
        return updated;
      }
      return [
        ...prev,
        {
          itemid: directToolItem.itemid!,
          itemcode: directToolItem.itemcode ?? "",
          itemdescription: directToolItem.itemdescription ?? "",
          itemunit: directToolItem.itemunit,
          availableqty: directToolItem.availableqty,
          transferquantity: qty,
        },
      ];
    });
    resetDirectToolItem();
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

    if (transferType === "DIRECT") {
      const fromOut = Number(data.fromOutletId);
      const toOut = Number(data.toOutletId);
      if (!Number.isFinite(fromOut) || fromOut <= 0 || !Number.isFinite(toOut) || toOut <= 0) {
        dispatch(showNotification({ message: "From Outlet and To Outlet are required", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      if (fromOut === toOut) {
        dispatch(showNotification({ message: "From and To outlet can not be same", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      if (!rows.length) {
        dispatch(showNotification({ message: "Add at least one item", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      const invalidRow = rows.find(
        (r) =>
          !Number.isFinite(Number(r.transferquantity)) ||
          Number(r.transferquantity) <= 0 ||
          Number(r.transferquantity) > Number(r.availableqty)
      );
      if (invalidRow) {
        dispatch(showNotification({ message: "Transfer quantity must be > 0 and <= available quantity", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }

      const result = await handleTryCatch(async () => {
        const response = await createDirectTransfer({
          variables: {
            createDirectOutletTransferInput: {
              storeid: parsedStoreId,
              fromoutletid: fromOut,
              tooutletid: toOut,
              remarks: data.remarks || "",
              items: rows.map((r) => ({ itemid: r.itemid, transferquantity: Number(r.transferquantity) })),
            },
          },
        });

        const successData = response.data?.createDirectOutletTransfer;
        if (successData) {
          dispatch(
            showNotification({
              message: successData.message,
              type: successData.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
            })
          );
          if (successData.success) {
            router.back();
          }
        }
        return true;
      });

      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
      return;
    }

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

  const sectionLabel: React.CSSProperties = {
    fontSize: "0.65rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 4,
  };

  const selectedProduct = productById.get(Number(toolItem.itemid || 0));

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* ── CARD 1: Transfer Details ─────────────────────── */}
      <div className="card mb-3">
        <div className="card-body">

          {/* Transfer Type Toggle */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <span style={sectionLabel}>Transfer Type</span>
            <Controller
              control={control}
              name="transferType"
              render={({ field }) => (
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${field.value === "REQUEST" ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: 12, padding: "5px 16px" }}
                    onClick={() => {
                      field.onChange("REQUEST");
                      setValue("transferRequestId", undefined);
                      setValue("fromOutletId", undefined);
                      setValue("toOutletId", undefined);
                      setValue("fromWarehouseId", undefined);
                      setValue("toWarehouseId", undefined);
                      setRows([]);
                    }}
                  >
                    Fulfill Transfer Request
                  </button>
                  <button
                    type="button"
                    className={`btn ${field.value === "INTERNAL" ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: 12, padding: "5px 16px" }}
                    onClick={() => {
                      field.onChange("INTERNAL");
                      setValue("transferRequestId", undefined);
                      setValue("fromOutletId", undefined);
                      setValue("toOutletId", undefined);
                      setRows([]);
                    }}
                  >
                    Internal Warehouse Transfer
                  </button>
                  <button
                    type="button"
                    className={`btn ${field.value === "DIRECT" ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ fontSize: 12, padding: "5px 16px" }}
                    onClick={() => {
                      field.onChange("DIRECT");
                      setValue("transferRequestId", undefined);
                      setValue("fromOutletId", undefined);
                      setValue("toOutletId", undefined);
                      setValue("fromWarehouseId", undefined);
                      setValue("toWarehouseId", undefined);
                      setRows([]);
                      resetDirectToolItem();
                    }}
                  >
                    Outlet to Outlet (Direct)
                  </button>
                </div>
              )}
            />
          </div>

          {/* ── REQUEST flow ── */}
          {transferType === "REQUEST" && (
            <div className="row g-3 align-items-start">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div style={sectionLabel}>Transfer Request <span className="text-danger">*</span></div>
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
                        if (!Number.isFinite(id) || id <= 0) clearRequestSelection();
                      }}
                      onChangeAdditional={(selected) => {
                        if (!selected) { clearRequestSelection(); return; }
                        void applyRequestSelection(selected);
                      }}
                      className=""
                    />
                  )}
                />
              </div>

              {/* Source → Destination */}
              <div className="col-lg-8 col-md-6 col-sm-12">
                <div style={sectionLabel}>Route</div>
                <div
                  className="d-flex align-items-center gap-3 rounded px-4 py-3"
                  style={{ background: "#f8f9fa", border: "1px solid #e5e7eb" }}
                >
                  <div className="text-center" style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>FROM OUTLET</div>
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{fromOutletLabel || "—"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>FROM WAREHOUSE</div>
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{fromWarehouseLabel || "—"}</div>
                  </div>
                  <ArrowRight size={20} color="#6b7280" />
                  <div className="text-center" style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>TO OUTLET</div>
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{toOutletLabel || "—"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>TO WAREHOUSE</div>
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{toWarehouseLabel || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTERNAL flow ── */}
          {transferType === "INTERNAL" && (
            <div className="row g-3 align-items-end">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div style={sectionLabel}>From Warehouse <span className="text-danger">*</span></div>
                <Controller
                  control={control}
                  name="fromWarehouseId"
                  render={({ field }) => (
                    <Select<SelectOption>
                      options={warehouseOptionsForDefaultOutlet}
                      value={warehouseOptionsForDefaultOutlet.find((o) => Number(o.value) === Number(field.value)) || null}
                      onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                      isClearable
                      placeholder="Select warehouse..."
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

              <div className="col-auto d-flex align-items-center" style={{ paddingBottom: 2 }}>
                <ArrowRight size={20} color="#6b7280" />
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div style={sectionLabel}>To Warehouse <span className="text-danger">*</span></div>
                <Controller
                  control={control}
                  name="toWarehouseId"
                  render={({ field }) => (
                    <Select<SelectOption>
                      options={toWarehouseOptionsForDefaultOutlet}
                      value={toWarehouseOptionsForDefaultOutlet.find((o) => Number(o.value) === Number(field.value)) || null}
                      onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                      isClearable
                      placeholder="Select warehouse..."
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
          )}

          {/* ── DIRECT flow (Outlet to Outlet, no request/approve) ── */}
          {transferType === "DIRECT" && (
            <div className="row g-3 align-items-end">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div style={sectionLabel}>From Outlet <span className="text-danger">*</span></div>
                <Controller
                  control={control}
                  name="fromOutletId"
                  render={({ field }) => (
                    <Select<SelectOption>
                      options={outletOptions}
                      value={outletOptions.find((o) => Number(o.value) === Number(field.value)) || null}
                      onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                      isClearable
                      placeholder="Select outlet..."
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
                {directFromWarehouseName && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    System warehouse: {directFromWarehouseName}
                  </div>
                )}
              </div>

              <div className="col-auto d-flex align-items-center" style={{ paddingBottom: 2 }}>
                <ArrowRight size={20} color="#6b7280" />
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div style={sectionLabel}>To Outlet <span className="text-danger">*</span></div>
                <Controller
                  control={control}
                  name="toOutletId"
                  render={({ field }) => (
                    <Select<SelectOption>
                      options={outletOptions.filter((o) => Number(o.value) !== Number(fromOutletId))}
                      value={outletOptions.find((o) => Number(o.value) === Number(field.value)) || null}
                      onChange={(opt) => field.onChange(opt?.value ? Number((opt as SelectOption).value) : undefined)}
                      isClearable
                      placeholder="Select outlet..."
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
                {directToWarehouseName && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    System warehouse: {directToWarehouseName}
                  </div>
                )}
              </div>

              <div className="col-12">
                <div className="alert alert-info py-2 px-3 mb-0" style={{ fontSize: 12 }}>
                  This transfers stock immediately between each outlet&apos;s system warehouse —
                  no approval step, no separate receive step. It completes as soon as you save.
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="mt-4">
            <div style={sectionLabel}>Remarks</div>
            <Controller
              control={control}
              name="remarks"
              render={({ field }) => (
                <textarea className="form-control" rows={2} placeholder="Optional notes..." {...field} />
              )}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Items ────────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body p-0">

          {/* Add-item bar (Request/Internal) */}
          {transferType !== "DIRECT" && (
            <div
              className="px-3 py-3"
              style={{ background: "#f8f9fa", borderBottom: "1px solid #e5e7eb", borderRadius: "8px 8px 0 0" }}
            >
              <div className="row g-2 align-items-end">
                <div className="col-lg-5 col-md-12">
                  <div style={sectionLabel}>Search / Scan Item</div>
                  <Select<SelectOption>
                    isLoading={productsLoading}
                    options={productOptions}
                    value={selectedProductOption}
                    onChange={(opt) => {
                      const selected = products.find(
                        (p) => p.itemid === Number((opt as SelectOption | null)?.value)
                      );
                      if (!selected) {
                        setToolItem((prev) => ({ ...prev, itemid: undefined, itemcode: undefined }));
                        return;
                      }
                      setToolItem((prev) => ({
                        ...prev,
                        itemid: Number(selected.itemid),
                        itemcode: String(selected.itemcode || ""),
                      }));
                    }}
                    isClearable
                    placeholder="Item code or description..."
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

                <div className="col-lg-3 col-md-6">
                  <div style={sectionLabel}>Description</div>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedProduct?.itemdescription || ""}
                    readOnly
                    placeholder="—"
                  />
                </div>

                <div className="col-lg-2 col-md-4" style={{ maxWidth: 160 }}>
                  <div style={sectionLabel}>
                    Qty{selectedProduct ? ` (avail: ${selectedProduct.availableqty})` : ""}
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min={0}
                    className="form-control text-end"
                    value={toolItem.transferquantity}
                    onChange={(e) => {
                      const n = Number(e.target.value || 0);
                      setToolItem((prev) => ({ ...prev, transferquantity: Math.round(Math.abs(n) * 1000) / 1000 }));
                    }}
                  />
                </div>

                <div className="col-auto">
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-1"
                    onClick={addRow}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <PlusCircle size={15} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add-item bar (DIRECT) — scan-driven, same convention as the invoice form:
              Pc items auto-add on scan when carriage is enabled; Wt items (or carriage
              disabled) land in the qty row below for an explicit confirm. */}
          {transferType === "DIRECT" && (
            <div
              className="px-3 py-3"
              style={{ background: "#f8f9fa", borderBottom: "1px solid #e5e7eb", borderRadius: "8px 8px 0 0" }}
            >
              {!directFromWarehouseId ? (
                <div className="text-muted" style={{ fontSize: 13 }}>Select a From Outlet above to start scanning items.</div>
              ) : (
                <div className="row g-2 align-items-end">
                  <div className="col-lg-5 col-md-12">
                    <div style={sectionLabel}>Search / Scan Item</div>
                    <div className="d-flex gap-2">
                      <div style={{ flex: 1 }}>
                        <SelectProduct
                          key={directProductClearKey}
                          storeId={parsedStoreId}
                          hasWarehouseId
                          warehouseId={directFromWarehouseId}
                          scanValue={barcodeScanValue}
                          clearKey={directProductClearKey}
                          onChangeAdditional={(selected: ItemDetails | null) => handleDirectItemSelect(selected)}
                          className=""
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        title="Scan barcode with camera"
                        onClick={() => setShowBarcodeScanner(true)}
                      >
                        📷
                      </button>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6">
                    <div style={sectionLabel}>Description</div>
                    <input
                      type="text"
                      className="form-control"
                      value={directToolItem.itemdescription || ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>

                  <div className="col-lg-2 col-md-4" style={{ maxWidth: 160 }}>
                    <div style={sectionLabel}>
                      {(directToolItem.itemunit ?? "").trim().toLowerCase() === "wt" ? "Weight/Qty" : "Qty"}
                      {directToolItem.itemid ? ` (avail: ${directToolItem.availableqty})` : ""}
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min={0}
                      className="form-control text-end"
                      value={directToolItem.transferquantity}
                      onChange={(e) => {
                        const n = Number(e.target.value || 0);
                        setDirectToolItem((prev) => ({ ...prev, transferquantity: Math.round(Math.abs(n) * 1000) / 1000 }));
                      }}
                    />
                  </div>

                  <div className="col-auto">
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center gap-1"
                      onClick={addDirectRow}
                      disabled={!directToolItem.itemid}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <PlusCircle size={15} />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items table */}
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            <table className="table datanew mb-0" style={{ fontSize: 12 }}>
              <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th className="text-nowrap">Item Code</th>
                  <th>Description</th>
                  <th className="text-center text-nowrap" style={{ width: 60 }}>Unit</th>
                  <th className="text-end text-nowrap" style={{ width: 120 }}>Qty to Transfer</th>
                  <th className="text-center" style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {!rows.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted" style={{ fontSize: 13 }}>
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  rows.map((r, index) => (
                    <tr key={r.itemid} className="align-middle">
                      <td className="text-muted">{index + 1}</td>
                      <td className="text-nowrap fw-semibold">{r.itemcode}</td>
                      <td className="text-muted">{r.itemdescription}</td>
                      <td className="text-center">
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: (r.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (r.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af" }}>
                          {r.itemunit || "Pc"}
                        </span>
                      </td>
                      <td style={{ width: 120 }}>
                        <input
                          type="number"
                          step="0.001"
                          min={0}
                          className="form-control form-control-sm px-1 text-end"
                          value={r.transferquantity}
                          onChange={(e) => {
                            const n = Number(e.target.value || 0);
                            const normalized = Math.round(Math.abs(n) * 1000) / 1000;
                            if (normalized > r.availableqty) {
                              dispatch(showNotification({ message: `${r.itemcode}: only ${r.availableqty} in stock`, type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            setRows((prev) =>
                              prev.map((x) =>
                                x.itemid === r.itemid ? { ...x, transferquantity: normalized } : x
                              )
                            );
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteRow(r.itemid)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          {rows.length > 0 && (
            <div
              className="d-flex justify-content-end gap-4 px-4 py-2"
              style={{ borderTop: "1px solid #e5e7eb", background: "#fafafa", borderRadius: "0 0 8px 8px" }}
            >
              <div className="text-end">
                <div style={{ fontSize: 11, color: "#6b7280" }}>TOTAL ITEMS</div>
                <div className="fw-bold" style={{ fontSize: 16 }}>{totalItemTransfered}</div>
              </div>
              <div className="vr" />
              <div className="text-end">
                <div style={{ fontSize: 11, color: "#6b7280" }}>TOTAL QTY</div>
                <div className="fw-bold" style={{ fontSize: 16 }}>{totalQuantities}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={saving || savingDirect}
          btnText={transferType === "DIRECT" ? "Transfer Now" : "Save Transfer"}
          loadingText="Saving..."
          className="btn btn-primary"
          disabled={!isValid}
        />
      </ActionFooter>
    </form>
    {showBarcodeScanner && (
      <BarcodeScannerModal
        onScan={(code) => {
          setBarcodeScanValue(code);
          setShowBarcodeScanner(false);
        }}
        onClose={() => setShowBarcodeScanner(false)}
      />
    )}
    </>
  );
};

export default InventoryTransferForm;
