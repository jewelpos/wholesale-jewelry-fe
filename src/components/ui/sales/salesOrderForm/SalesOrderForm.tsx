"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs, { Dayjs } from "dayjs";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useDispatch } from "react-redux";

import SelectCustomer from "@/components/forms/SelectCustomer";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectProduct from "@/components/forms/SelectProduct";
import SelectShippingModes from "@/components/forms/SelectShippingModes";

import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";

import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { useAutoHoldOnLeave } from "@/hooks/useAutoHoldOnLeave";
import { useNavigationGuard } from "@/lib/context/NavigationGuardContext";
import useWarehouse from "@/hooks/useWarehouse";
import useOutlets from "@/hooks/useOutlets";
import type { ItemDetails } from "@/hooks/useProducts";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import { handleEnterAsTab } from "@/lib/utils/formKeyboard";

import { CREATE_SALES_ORDER_MUTATION, EDIT_SALES_ORDER_MUTATION } from "@/lib/graphql/mutations/sales";
import { GET_SALES_ORDER_QUERY } from "@/lib/graphql/query/sales";
import { GET_INVOICE_HOLDS_QUERY } from "@/lib/graphql/query/invoiceHold";
import { SAVE_INVOICE_HOLD_MUTATION, DELETE_INVOICE_HOLD_MUTATION } from "@/lib/graphql/mutations/invoiceHold";
import { GET_PRODUCT_SETTINGS_INFO_QUERY } from "@/lib/graphql/query/products";
import { GET_ALL_WAREHOUSE_SETTINGS_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { GET_PROMOTION_LIST_QUERY } from "@/lib/graphql/query/promotions";
import { GET_PRODUCT_BULK_DISCOUNTS_QUERY } from "@/lib/graphql/query/bulkDiscounts";
import { resolveDiscount, type BulkDiscountTier, type ActivePromotion } from "@/lib/utils/discountResolver";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useCurrency } from "@/hooks/useCurrency";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { formatQty } from "@/lib/utils/numberFormat";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

const MySwal = withReactContent(Swal);

type SalesOrderItemForm = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itemunit?: string;
  itempcs?: number;
  itemquantity?: number;
  unitprice?: number;
  discountpercent?: number;
  discountsource?: string | null;
  discountpromotionid?: number | null;
  invoicepcs?: number;
  invoiceqty?: number;
  bordpcs?: number;
  bordqty?: number;
  itemmetal?: string;
  itempremium?: number;
  broakerage?: number;
  goldprice_used?: number;
  premium_used?: number;
  labour_used?: number;

  // Only set for rows added via carriage/rapid-entry auto-add — informational only,
  // lets the rows table flag a likely backorder for those rows too.
  availableqty?: number;
  trackinventory?: number;
};

type ToolItem = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itemunit?: string;
  itempcs: number;
  itemquantity: number;
  unitprice: number;
  discountpercent?: number;
  itemmetal?: string;
  itempremium?: number;
  broakerage?: number;
  goldprice_used?: number;
  premium_used?: number;
  labour_used?: number;
  _itemdiscount?: number;
  _itemcategoryid?: number | null;

  // On-hand qty when this item was selected — informational only for a Sales Order
  // (a SO is allowed to exceed it; this just lets staff flag a backorder up front).
  availableqty?: number;
  trackinventory?: number;
};

type SalesOrderFormType = {
  storeid: number;
  customerid?: number;
  shiptocustomerid?: number;
  warehouseid?: number;
  orderdate: Dayjs;
  termsid?: number;
  invshippingmethod?: number;
  orderedby?: string;
  discountpercent?: number;
  orderdiscountpercent?: number;
  orderdiscountamount?: number;
  salestaxrate?: number;
  shipping?: number;
  remarks?: string;
  shipSameAsBill: boolean;
  invbilltocompanyname?: string;
  invbilltoadd1?: string;
  invbilltocity?: string;
  invbilltostate?: string;
  invbilltozip?: string;
  invbilltophone?: string;
  invshiptocompanyname?: string;
  invshiptoadd1?: string;
  invshiptocity?: string;
  invshiptostate?: string;
  invshiptozip?: string;
  invshiptophone?: string;
  items: SalesOrderItemForm[];
};

const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const KARAT_RATE_FIELD: Record<string, string> = {
  "10Kt": "gold10kt_gram",
  "14Kt": "gold14kt_gram",
  "18Kt": "gold18kt_gram",
  "22Kt": "gold22kt_gram",
};

function getRateField(metalType: string | undefined, metalTypeList?: any[]): string | undefined {
  if (!metalType) return undefined;
  // DB lookup first — supports Silver, Rhodium, Platinum, custom metals
  if (metalTypeList) {
    const match = metalTypeList.find((m: any) => m.metalname === metalType);
    if (match?.ratescolumn) return match.ratescolumn;
  }
  if (KARAT_RATE_FIELD[metalType]) return KARAT_RATE_FIELD[metalType];
  const match = metalType.match(/(\d+)\s*k/i);
  if (match) { const key = `${parseInt(match[1], 10)}Kt`; return KARAT_RATE_FIELD[key]; }
  return undefined;
}

function calcWtUnitPrice(
  metalType: string | undefined,
  rates: Record<string, number> | null | undefined,
  premium: number,
  labour: number,
  metalTypeList?: any[]
): number {
  if (!metalType || !rates) return 0;
  const rateField = getRateField(metalType, metalTypeList);
  const goldRate = Number(rateField ? (rates[rateField] ?? 0) : 0);
  return Math.round((goldRate + premium + labour) * 100) / 100;
}

const computeLine = (item: SalesOrderItemForm) => {
  const qty = toNum(item.itemquantity);
  const unit = toNum(item.unitprice);
  const disc = toNum(item.discountpercent);
  const gross = qty * unit;
  const discountAmt = gross * (disc / 100);
  const net = gross - discountAmt;
  const unitAfterDiscount = Math.round(unit * (1 - disc / 100) * 100) / 100;
  return { qty, unit, disc, gross, discountAmt, net, unitAfterDiscount };
};

const SalesOrderForm = ({ salesorderno: salesordernoEdit, readOnly = false }: { salesorderno?: number; readOnly?: boolean }) => {
  const isEdit = salesordernoEdit != null;
  const router = useRouter();
  const dispatch = useDispatch();
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [emailModalSONumber, setEmailModalSONumber] = useState<number | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);

  const [productClearKey, setProductClearKey] = useState(0);

  // ─── Discount resolution ────────────────────────────────────────────────
  const { data: promotionsData } = useQuery(GET_PROMOTION_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId || !!salesordernoEdit,
  });
  const activePromotions: ActivePromotion[] = promotionsData?.getPromotionList ?? [];
  const [fetchBulkDiscounts] = useLazyQuery(GET_PRODUCT_BULK_DISCOUNTS_QUERY);
  const bulkDiscountCache = useRef<Map<number, BulkDiscountTier[]>>(new Map());

  const getBulkTiers = useCallback(async (itemid: number): Promise<BulkDiscountTier[]> => {
    if (bulkDiscountCache.current.has(itemid)) return bulkDiscountCache.current.get(itemid)!;
    const { data } = await fetchBulkDiscounts({ variables: { storeid: parsedStoreId, itemid: String(itemid) } });
    const tiers: BulkDiscountTier[] = data?.getProductBulkDiscounts ?? [];
    bulkDiscountCache.current.set(itemid, tiers);
    return tiers;
  }, [fetchBulkDiscounts, parsedStoreId]);

  const currencyFormatter = useCurrency();

  const formatMoney = (raw: unknown) => {
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    return currencyFormatter.formatFixed(Number.isFinite(n) ? n : 0);
  };

  const [products, setProducts] = useState<ItemDetails[]>([]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toolItem, setToolItem] = useState<ToolItem>({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: undefined,
    itemtaxable: undefined,
    itemunit: undefined,
    itempcs: 0,
    itemquantity: 1,
    unitprice: 0,
    discountpercent: 0,
  });

  const [createSalesOrder, { loading: savingCreate }] = useMutation(CREATE_SALES_ORDER_MUTATION);
  const [editSalesOrder, { loading: savingEdit }] = useMutation(EDIT_SALES_ORDER_MUTATION);
  const saving = savingCreate || savingEdit;

  const { data: metalRatesQueryData } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const currentRates = metalRatesQueryData?.getCurrentMetalRates ?? null;

  const { data: metalTypeQueryData } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const metalTypeList = metalTypeQueryData?.getMetalTypeList ?? undefined;

  const todayStr = new Date().toISOString().slice(0, 10);
  const ratesStale = !currentRates || currentRates.ratedate < todayStr;

  const { data: editData, loading: editLoading } = useQuery(GET_SALES_ORDER_QUERY, {
    variables: { storeid: parsedStoreId, salesorderno: salesordernoEdit },
    skip: !isEdit || !parsedStoreId || !salesordernoEdit,
    fetchPolicy: "network-only",
  });

  const {
    control,
    handleSubmit,
    register,
    trigger,
    setValue,
    watch,
    getValues,
    formState: { isDirty },
    reset,
  } = useForm<SalesOrderFormType>({
    defaultValues: {
      storeid: parsedStoreId,
      customerid: undefined,
      warehouseid: undefined,
      orderdate: dayjs(),
      termsid: undefined,
      invshippingmethod: undefined,
      orderedby: "",
      discountpercent: 0,
      orderdiscountpercent: 0,
      orderdiscountamount: 0,
      salestaxrate: 0,
      shipping: 0,
      remarks: "",
      shipSameAsBill: true,
      invbilltocompanyname: "",
      invbilltoadd1: "",
      invbilltocity: "",
      invbilltostate: "",
      invbilltozip: "",
      invbilltophone: "",
      invshiptocompanyname: "",
      invshiptoadd1: "",
      invshiptocity: "",
      invshiptostate: "",
      invshiptozip: "",
      invshiptophone: "",
      items: [],
    },
    mode: "all",
  });

  const { fields: itemFields, append, remove, update, replace } = useFieldArray({ control, name: "items" });

  const isNewDoc = !isEdit;
  const [showHoldsPanel, setShowHoldsPanel] = useState(false);
  const { data: holdsData, refetch: refetchHolds } = useQuery(GET_INVOICE_HOLDS_QUERY, {
    variables: { storeid: parsedStoreId, outletid: parsedOutletId || 0, doctype: "SALESORDER" },
    skip: !parsedStoreId || !isNewDoc,
    fetchPolicy: "cache-and-network",
  });
  const activeHolds: any[] = holdsData?.getInvoiceHolds ?? [];
  const [saveHoldMutation, { loading: savingHold }] = useMutation(SAVE_INVOICE_HOLD_MUTATION);
  const [deleteHoldMutation] = useMutation(DELETE_INVOICE_HOLD_MUTATION);

  const watchedWarehouseIdForSettings = watch("warehouseid");
  const productSettingsWarehouseId = Number(watchedWarehouseIdForSettings) || undefined;
  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: productSettingsWarehouseId },
    skip: !parsedStoreId || !productSettingsWarehouseId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;
  const allowPcsEntry = productSettings == null || !!productSettings.allowpcsentry;
  const allowCarriage = productSettings != null && !!productSettings.allowcarriage;

  const { fetchWarehouseByOutletId, fetchWarehouseByStoreId, warehouses } = useWarehouse();
  // getOutlets with includeAll=false is already scoped to outlets this user is actually
  // assigned to — the source of truth for "how many outlets can they pick from" below.
  const { fetchOutletsList, outlets: accessibleOutlets } = useOutlets();

  useEffect(() => {
    if (!isNewDoc) {
      if (parsedOutletId) fetchWarehouseByOutletId(parsedOutletId);
      return;
    }
    // New documents only: need warehouses across every outlet the user can access (not
    // just the current URL outlet) so a multi-outlet user can pick which outlet's stock
    // this order draws from.
    if (parsedStoreId) {
      fetchWarehouseByStoreId(parsedStoreId);
      fetchOutletsList([parsedStoreId], false);
    }
  }, [isNewDoc, fetchWarehouseByOutletId, fetchWarehouseByStoreId, fetchOutletsList, parsedStoreId, parsedOutletId]);

  const accessibleOutletIds = useMemo(
    () => new Set((accessibleOutlets ?? []).map((o: any) => Number(o.outletid))),
    [accessibleOutlets]
  );

  // Only meaningful on new documents (see fetch above) — getWarehousesByStoreId isn't
  // outlet-access scoped server-side, so this filters it down to outlets the user is
  // actually assigned to before it's ever shown as a choice.
  const accessibleSystemWarehouses = useMemo(
    () => (isNewDoc ? warehouses.filter((w) => w.issystem && accessibleOutletIds.has(Number(w.outletid))) : []),
    [isNewDoc, warehouses, accessibleOutletIds]
  );

  const hasMultiOutletAccess = isNewDoc && accessibleOutletIds.size > 1;

  const currentWarehouse = useMemo(() => {
    if (!isNewDoc) return warehouses.find((w) => w.issystem) ?? warehouses[0];
    return (
      accessibleSystemWarehouses.find((w) => Number(w.outletid) === Number(parsedOutletId)) ??
      accessibleSystemWarehouses[0]
    );
  }, [isNewDoc, warehouses, accessibleSystemWarehouses, parsedOutletId]);

  useEffect(() => {
    const nextWarehouseId = Number(currentWarehouse?.warehouseid);
    if (!Number.isFinite(nextWarehouseId) || nextWarehouseId <= 0) return;
    setValue("warehouseid", nextWarehouseId, { shouldDirty: false, shouldTouch: false });
  }, [currentWarehouse, setValue]);

  // Populate form when loading existing SO for edit
  useEffect(() => {
    const so = editData?.getSalesOrder;
    if (!so) return;
    reset({
      storeid: parsedStoreId,
      customerid: so.customerid ? Number(so.customerid) : undefined,
      warehouseid: so.warehouseid ?? undefined,
      orderdate: so.orderdate ? dayjs(so.orderdate) : dayjs(),
      termsid: so.termsid ?? undefined,
      invshippingmethod: so.invshippingmethod ? Number(so.invshippingmethod) : undefined,
      orderedby: so.orderedby ?? "",
      discountpercent: so.discountpercent ?? 0,
      orderdiscountpercent: toNum(so.orderdiscountpercent),
      orderdiscountamount: toNum(so.orderdiscountamount),
      salestaxrate: toNum(so.salestaxrate),
      shipping: so.shipping ?? 0,
      remarks: so.remarks ?? "",
      shipSameAsBill: false,
      invbilltocompanyname: so.invbilltocompanyname ?? "",
      invbilltoadd1: so.invbilltoadd1 ?? "",
      invbilltocity: so.invbilltocity ?? "",
      invbilltostate: so.invbilltostate ?? "",
      invbilltozip: so.invbilltozip ?? "",
      invbilltophone: so.invbilltophone ?? "",
      invshiptocompanyname: so.invshiptocompanyname ?? "",
      invshiptoadd1: so.invshiptoadd1 ?? "",
      invshiptocity: so.invshiptocity ?? "",
      invshiptostate: so.invshiptostate ?? "",
      invshiptozip: so.invshiptozip ?? "",
      invshiptophone: so.invshiptophone ?? "",
      items: (so.items ?? []).map((it: any) => ({
        itemid: it.itemid ? Number(it.itemid) : undefined,
        itemcode: it.itemcode,
        itemdescription: it.itemdescription,
        itemunit: it.itemunit,
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
        discountsource: it.discountsource ?? null,
        discountpromotionid: it.discountpromotionid ?? null,
        invoicepcs: toNum(it.invoicepcs),
        invoiceqty: toNum(it.invoiceqty),
        bordpcs: toNum(it.bordpcs),
        bordqty: toNum(it.bordqty),
      })),
    });
  }, [editData, parsedStoreId, reset]);

  const customerId = watch("customerid");
  const shipSameAsBill = watch("shipSameAsBill");

  const watchedWarehouseId = watch("warehouseid");
  const parsedWarehouseId = useMemo(() => {
    const n = typeof watchedWarehouseId === "number" ? watchedWarehouseId : Number(watchedWarehouseId);
    return Number.isFinite(n) ? n : undefined;
  }, [watchedWarehouseId]);

  const { data: warehouseSettingsData } = useQuery(GET_ALL_WAREHOUSE_SETTINGS_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const showUnitPriceCol = useMemo(() => {
    const allSettings: any[] = warehouseSettingsData?.getAllWarehouseSettings ?? [];
    const wSetting = allSettings.find((s: any) => s.warehouseid === parsedWarehouseId);
    return !!wSetting?.showunitpriceininvoice;
  }, [warehouseSettingsData, parsedWarehouseId]);

  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: parsedStoreId, customerid: Number(customerId) },
    skip: !parsedStoreId || !customerId,
  });

  const shipToCustomerId = watch("shiptocustomerid");
  const { data: shipToCustomerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: parsedStoreId, customerid: Number(shipToCustomerId) },
    skip: !parsedStoreId || !shipToCustomerId || shipSameAsBill,
  });

  useEffect(() => {
    const c = customerData?.getCustomer;
    if (!c) return;
    setValue("invbilltocompanyname", c.custcompanyname ?? "");
    setValue("invbilltoadd1", c.custadd1 ?? "");
    setValue("invbilltocity", c.custcity ?? "");
    setValue("invbilltostate", c.custstate ?? "");
    setValue("invbilltozip", c.custzip ?? "");
    setValue("invbilltophone", c.custphone1 ?? c.custphone2 ?? "");
    if (typeof c.termsid === "number") setValue("termsid", c.termsid);
    if (c.custshippingmethod != null) {
      const parsed = Number(c.custshippingmethod);
      if (Number.isFinite(parsed)) setValue("invshippingmethod", parsed);
    }
    if (shipSameAsBill) {
      setValue("shiptocustomerid", customerId, { shouldDirty: false, shouldTouch: false });
      setValue("invshiptocompanyname", c.custcompanyname ?? "");
      setValue("invshiptoadd1", c.custadd1 ?? "");
      setValue("invshiptocity", c.custcity ?? "");
      setValue("invshiptostate", c.custstate ?? "");
      setValue("invshiptozip", c.custzip ?? "");
      setValue("invshiptophone", c.custphone1 ?? c.custphone2 ?? "");
    }
  }, [customerData, customerId, setValue, shipSameAsBill]);

  useEffect(() => {
    if (!shipSameAsBill) return;
    setValue("shiptocustomerid", getValues("customerid"), { shouldDirty: false, shouldTouch: false });
    setValue("invshiptocompanyname", getValues("invbilltocompanyname"));
    setValue("invshiptoadd1", getValues("invbilltoadd1"));
    setValue("invshiptocity", getValues("invbilltocity"));
    setValue("invshiptostate", getValues("invbilltostate"));
    setValue("invshiptozip", getValues("invbilltozip"));
    setValue("invshiptophone", getValues("invbilltophone"));
  }, [shipSameAsBill, getValues, setValue]);

  useEffect(() => {
    if (shipSameAsBill) return;
    const c = shipToCustomerData?.getCustomer;
    if (!c) return;
    setValue("invshiptocompanyname", c.custcompanyname ?? "");
    setValue("invshiptoadd1", c.custadd1 ?? "");
    setValue("invshiptocity", c.custcity ?? "");
    setValue("invshiptostate", c.custstate ?? "");
    setValue("invshiptozip", c.custzip ?? "");
    setValue("invshiptophone", c.custphone1 ?? c.custphone2 ?? "");
  }, [shipSameAsBill, shipToCustomerData, setValue]);

  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscountPercent = useWatch({ control, name: "discountpercent" });
  const watchedOrderDiscountAmount = useWatch({ control, name: "orderdiscountamount" });
  const watchedShipping = useWatch({ control, name: "shipping" });

  const invoiceDiscountPrefill = useMemo(() => {
    const n = toNum(watchedDiscountPercent);
    return Math.round(Math.min(100, Math.max(0, n)) * 1000) / 1000;
  }, [watchedDiscountPercent]);

  useEffect(() => {
    if (editingIndex != null) return;
    setToolItem((prev) => {
      if (prev.itemid) return prev;
      if (toNum(prev.discountpercent) === invoiceDiscountPrefill) return prev;
      return { ...prev, discountpercent: invoiceDiscountPrefill };
    });
  }, [editingIndex, invoiceDiscountPrefill]);

  const totals = useMemo(() => {
    const items = watchedItems || [];
    const lines = items.map((it) => computeLine(it));
    const grossTotal = lines.reduce((acc, l) => acc + l.gross, 0);
    // The global "Discount %" box (see its onChange handler) already stamps this
    // same percent onto every line item's discountpercent, so each line's own
    // discountAmt already reflects it in full. Do not also apply discountPercent
    // here on top of the line total — that double-applies it (e.g. 10% became a
    // compounded ~19%).
    const discountAmount = lines.reduce((acc, l) => acc + l.discountAmt, 0);
    const subtotal = grossTotal - discountAmount;
    // Order Discount is a separate, order-level deduction — applied once here, after
    // line-item discounts, never blended into any line's own price/discount.
    const orderDiscountAmount = Math.min(subtotal, Math.max(0, toNum(watchedOrderDiscountAmount)));
    const shipping = toNum(watchedShipping);
    const orderTotal = subtotal - orderDiscountAmount + shipping;
    const totalPcs = items.reduce((acc, it) => acc + toNum(it.itempcs), 0);
    const unitQtyTotals: Record<string, number> = {};
    for (const it of items) {
      const unit = (it.itemunit ?? "Pc").trim() || "Pc";
      unitQtyTotals[unit] = (unitQtyTotals[unit] ?? 0) + Math.abs(toNum(it.itemquantity));
    }
    return { totalItems: items.length, totalPcs, unitQtyTotals, grossTotal, discountAmount, subtotal, orderDiscountAmount, shipping, orderTotal };
  }, [watchedDiscountPercent, watchedOrderDiscountAmount, watchedItems, watchedShipping]);

  // See useAutoHoldOnLeave.ts and the SalesInvoiceForm.tsx wiring for the full rationale
  // — this is the same pattern applied to Sales Orders.
  const { currentHoldIdRef, suppressAutoHoldRef } = useAutoHoldOnLeave({
    enabled: isNewDoc && !readOnly,
    isDirty,
    hasContent: () => {
      const v = getValues();
      return !!v.customerid || (v.items ?? []).length > 0;
    },
    getHoldPayload: () => {
      const v = getValues();
      const customerName = v.invbilltocompanyname ?? "";
      const itemCount = (v.items ?? []).length;
      const autoName = [customerName, itemCount ? `${itemCount} item${itemCount !== 1 ? "s" : ""}` : ""].filter(Boolean).join(" — ") || "Untitled";
      return {
        holdname: autoName,
        customerid: v.customerid ?? null,
        formdata: {
          ...v,
          orderdate: v.orderdate ? (v.orderdate as any).toISOString?.() ?? String(v.orderdate) : null,
        },
      };
    },
    storeid: parsedStoreId,
    outletid: parsedOutletId || 0,
    doctype: "SALESORDER",
  });

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      suppressAutoHoldRef.current = true;
      reset();
      router.back();
    },
  });

  // Editing an already-saved sales order has no hold concept — resuming a hold always
  // creates a NEW record, which would be wrong here — so it gets the same Save / Discard
  // / Cancel prompt as Customer/Product instead of auto-hold-on-leave (see
  // NavigationGuardContext.tsx and the identical wiring in CustomerForm.tsx).
  const { registerGuard } = useNavigationGuard();
  const editIsDirtyRef = useRef(isDirty);
  editIsDirtyRef.current = isDirty;
  useEffect(() => {
    if (isNewDoc || readOnly) return;
    return registerGuard({
      isDirty: () => editIsDirtyRef.current,
      onSave: () => handleSubmit(onSubmit)(),
      onDiscard: () => reset(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewDoc, readOnly]);

  // Nudges the user toward a held sales order the moment they land on a fresh New Sales
  // Order page — see the identical effect in SalesInvoiceForm.tsx for the full rationale.
  const hasPromptedResumeRef = useRef(false);
  useEffect(() => {
    if (!isNewDoc || hasPromptedResumeRef.current || activeHolds.length === 0) return;
    hasPromptedResumeRef.current = true;
    const mostRecent = [...activeHolds].sort(
      (a, b) => new Date(b.updatedat ?? b.createdat).getTime() - new Date(a.updatedat ?? a.createdat).getTime()
    )[0];
    MySwal.fire({
      toast: true,
      position: "center",
      icon: "info",
      title: "You have a sales order in progress",
      text: mostRecent.holdname || undefined,
      showConfirmButton: true,
      confirmButtonText: "Resume",
      showCloseButton: true,
      timer: 8000,
      timerProgressBar: true,
    }).then((result) => {
      if (result.isConfirmed) handleResumeHold(mostRecent);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHolds, isNewDoc]);

  const handleHold = async () => {
    const formValues = getValues();
    const hasItems = (formValues.items ?? []).length > 0;
    if (!hasItems) {
      MySwal.fire({ icon: "info", title: "Nothing to hold", text: "Add at least one item before holding.", timer: 2000, showConfirmButton: false });
      return;
    }
    const customerName = formValues.invbilltocompanyname ?? "";
    const itemCount = formValues.items.length;
    const autoName = [customerName, `${itemCount} item${itemCount !== 1 ? "s" : ""}`].filter(Boolean).join(" — ");
    const { value: holdName, isConfirmed } = await MySwal.fire({
      title: "Hold Sales Order",
      input: "text",
      inputLabel: "Hold name (optional)",
      inputValue: autoName,
      showCancelButton: true,
      confirmButtonText: "Hold",
      cancelButtonText: "Cancel",
      inputPlaceholder: "e.g. John Smith — ring + chain",
    });
    if (!isConfirmed) return;
    const holdData = {
      ...formValues,
      orderdate: formValues.orderdate ? (formValues.orderdate as any).toISOString?.() ?? String(formValues.orderdate) : null,
    };
    try {
      await saveHoldMutation({
        variables: {
          input: {
            holdid: currentHoldIdRef.current ?? undefined,
            storeid: parsedStoreId,
            outletid: parsedOutletId || 0,
            doctype: "SALESORDER",
            holdname: holdName || autoName,
            customerid: formValues.customerid ?? null,
            formdata: holdData,
          },
        },
      });
      currentHoldIdRef.current = null;
      reset();
      refetchHolds();
      MySwal.fire({ icon: "success", title: "Sales order held", text: "You can resume it from the Held Sales Orders panel.", timer: 2000, showConfirmButton: false });
    } catch {
      MySwal.fire("Error", "Failed to save hold. Please try again.", "error");
    }
  };

  const handleResumeHold = async (hold: any) => {
    const fd = hold.formdata ?? {};
    // Holds saved before the NaN-input fixes elsewhere in this form could have
    // serialized a bad numeric value (e.g. a line item's price/qty/discount) straight
    // into their stored formdata — reset() would otherwise reintroduce that exact NaN
    // on every resume, regardless of the input-level guards now in place. Re-sanitize.
    reset({
      ...fd,
      orderdate: fd.orderdate ? dayjs(fd.orderdate) : dayjs(),
      discountpercent: toNum(fd.discountpercent),
      orderdiscountpercent: toNum(fd.orderdiscountpercent),
      orderdiscountamount: toNum(fd.orderdiscountamount),
      items: (fd.items ?? []).map((it: any) => ({
        ...it,
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
        itempcs: toNum(it.itempcs),
      })),
    });
    currentHoldIdRef.current = hold.holdid;
    setShowHoldsPanel(false);
  };

  const handleDeleteHold = async (holdid: number) => {
    const result = await MySwal.fire({
      title: "Discard hold?",
      text: "This hold will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Discard",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    if (currentHoldIdRef.current === holdid) currentHoldIdRef.current = null;
    await deleteHoldMutation({ variables: { holdid, storeid: parsedStoreId } });
    refetchHolds();
  };

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined, itemcode: undefined, itemdescription: undefined, itemtaxable: undefined,
      itemunit: undefined, itempcs: 0, itemquantity: 1, unitprice: 0, discountpercent: invoiceDiscountPrefill,
    });
  };

  const autoAddItem = async (selected: ItemDetails) => {
    const itemid = Number(selected.itemid);
    const isWt = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
    const premium = Number(selected.itempremium || 0);
    const labour = Number(selected.broakerage || 0);
    const rateField = isWt ? getRateField(selected.itemmetal, metalTypeList) : undefined;
    const goldRate = isWt && currentRates && rateField ? ((currentRates as any)[rateField] ?? 0) : 0;
    const unitprice = isWt
      ? calcWtUnitPrice(selected.itemmetal, currentRates as any, premium, labour, metalTypeList)
      : Number(selected.itemsellprice || 0);
    const currentItems: SalesOrderItemForm[] = getValues("items") || [];
    const dupIndex = currentItems.findIndex((it) => Number(it.itemid) === itemid);
    const availableqty = toNum(selected.itemquantityinhand);
    const trackinventory = selected.trackinventory != null ? toNum(selected.trackinventory) : 1;
    const warnIfBackorder = (newQty: number) => {
      if (trackinventory !== 0 && Math.abs(newQty) > availableqty) {
        dispatch(
          showNotification({
            message: `${selected.itemcode || "Item"}: backorder — only ${availableqty} in stock (added ${Math.abs(newQty)})`,
            type: NOTIFICATION_TYPES.WARNING,
          })
        );
      }
    };
    // Fallback when item/bulk/promo resolve to nothing — the global "Discount %"
    // box's current value, same as the staged add-item tool's behavior.
    const boxDiscountPct = Math.min(100, Math.max(0, Number(getValues("discountpercent") || 0)));

    if (dupIndex >= 0) {
      const existing = currentItems[dupIndex];
      const newQty = Number(existing.itemquantity || 0) + 1;
      if (!existing.discountsource || existing.discountsource !== 'manual') {
        const bulkTiers = await getBulkTiers(itemid);
        const resolved = resolveDiscount({
          itemDiscount: toNum(selected.itemdiscount),
          unitprice,
          qty: Math.abs(newQty),
          bulkTiers,
          activePromotions,
          itemid,
          categoryid: selected.itemcategoryid ?? null,
          warehouseid: getValues('warehouseid'),
        });
        const prevDisc = toNum(existing.discountpercent);
        const nextDisc = resolved.discountsource ? resolved.discountpercent : boxDiscountPct;
        update(dupIndex, { ...existing, itemquantity: newQty, discountpercent: nextDisc, discountsource: resolved.discountsource, discountpromotionid: resolved.discountpromotionid, availableqty, trackinventory });
        if (nextDisc !== prevDisc && resolved.discountsource) {
          dispatch(showNotification({ message: `Discount updated: ${resolved.label}`, type: NOTIFICATION_TYPES.SUCCESS }));
        }
      } else {
        update(dupIndex, { ...existing, itemquantity: newQty, availableqty, trackinventory });
      }
      warnIfBackorder(newQty);
    } else {
      const bulkTiers = await getBulkTiers(itemid);
      const resolved = resolveDiscount({
        itemDiscount: toNum(selected.itemdiscount),
        unitprice,
        qty: 1,
        bulkTiers,
        activePromotions,
        itemid,
        categoryid: selected.itemcategoryid ?? null,
        warehouseid: getValues('warehouseid'),
      });
      append({
        itemid,
        itemcode: selected.itemcode,
        itemdescription: selected.itemdescription,
        itemtaxable: toNum(selected.itemtaxable),
        itemunit: selected.itemunit,
        itempcs: 0,
        itemquantity: 1,
        unitprice,
        discountpercent: resolved.discountsource ? resolved.discountpercent : boxDiscountPct,
        discountsource: resolved.discountsource,
        discountpromotionid: resolved.discountpromotionid,
        itemmetal: selected.itemmetal,
        itempremium: premium,
        broakerage: labour,
        goldprice_used: isWt ? goldRate : undefined,
        premium_used: isWt ? premium : undefined,
        labour_used: isWt ? labour : undefined,
        availableqty,
        trackinventory,
      });
      warnIfBackorder(1);
    }
    resetToolItem();
    setProductClearKey((k) => k + 1);
  };

  const handleSaveToolItem = async () => {
    const customerIdNumber = Number(getValues("customerid"));
    if (!Number.isFinite(customerIdNumber) || customerIdNumber <= 0) {
      dispatch(showNotification({ message: "Please select a customer first", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    if (!toolItem.itemid && !toolItem.itemcode) {
      dispatch(showNotification({ message: "Please select a product", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const qty = toNum(toolItem.itemquantity);
    if (qty <= 0) {
      dispatch(showNotification({ message: "Quantity must be greater than 0", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const discountPct = Math.min(100, Math.max(0, toNum(toolItem.discountpercent)));
    let resolvedSource: string | null = null;
    let resolvedPromotionId: number | null = null;
    let resolvedDiscountPct = discountPct;

    if (editingIndex == null) {
      const bulkTiers = toolItem.itemid ? await getBulkTiers(toolItem.itemid) : [];
      const resolved = resolveDiscount({
        itemDiscount: toolItem._itemdiscount ?? 0,
        unitprice: toNum(toolItem.unitprice),
        qty,
        bulkTiers,
        activePromotions,
        itemid: toolItem.itemid!,
        categoryid: toolItem._itemcategoryid ?? null,
        warehouseid: getValues('warehouseid'),
      });
      resolvedSource = resolved.discountsource;
      resolvedPromotionId = resolved.discountpromotionid;
      // resolveDiscount's result was being discarded here — a qty typed into
      // the tool that qualified for a bulk tier never actually reached the
      // line. Only fall back to the raw box value when nothing resolved.
      if (resolvedSource) {
        resolvedDiscountPct = resolved.discountpercent;
      }
    } else {
      // Edit: if the Disc % box was changed directly, that's an explicit manual
      // override — respect it. Otherwise (most common case: user only changed
      // Qty), re-resolve against the new quantity instead of keeping whatever
      // was resolved at the old quantity.
      const existingItem = getValues(`items.${editingIndex}`);
      const existingDiscountSource = (existingItem as any)?.discountsource ?? null;
      if (discountPct !== toNum(existingItem?.discountpercent)) {
        resolvedSource = 'manual';
        resolvedPromotionId = null;
      } else if (existingDiscountSource === 'manual') {
        resolvedSource = 'manual';
        resolvedPromotionId = (existingItem as any)?.discountpromotionid ?? null;
      } else {
        const bulkTiers = toolItem.itemid ? await getBulkTiers(toolItem.itemid) : [];
        const resolved = resolveDiscount({
          itemDiscount: toolItem._itemdiscount ?? 0,
          unitprice: toNum(toolItem.unitprice),
          qty,
          bulkTiers,
          activePromotions,
          itemid: toolItem.itemid!,
          categoryid: toolItem._itemcategoryid ?? null,
          warehouseid: getValues('warehouseid'),
        });
        resolvedSource = resolved.discountsource;
        resolvedPromotionId = resolved.discountpromotionid;
        if (resolvedSource) {
          resolvedDiscountPct = resolved.discountpercent;
        }
      }
    }

    const newItem: SalesOrderItemForm = {
      itemid: toolItem.itemid,
      itemcode: toolItem.itemcode,
      itemdescription: toolItem.itemdescription,
      itemtaxable: toolItem.itemtaxable,
      itemunit: toolItem.itemunit,
      itempcs: toNum(toolItem.itempcs),
      itemquantity: qty,
      unitprice: toNum(toolItem.unitprice),
      discountpercent: resolvedDiscountPct,
      discountsource: resolvedSource,
      discountpromotionid: resolvedPromotionId,
      itemmetal: toolItem.itemmetal,
      itempremium: toolItem.itempremium,
      broakerage: toolItem.broakerage,
      goldprice_used: toolItem.goldprice_used,
      premium_used: toolItem.premium_used,
      labour_used: toolItem.labour_used,
      availableqty: toolItem.availableqty,
      trackinventory: toolItem.trackinventory,
    };

    if (editingIndex != null) {
      update(editingIndex, newItem);
      setEditingIndex(null);
    } else {
      append(newItem);
    }
    resetToolItem();
    setProductClearKey((k) => k + 1);
  };

  const handleEditItem = (index: number) => {
    const item = itemFields[index];
    setEditingIndex(index);
    setToolItem({
      itemid: item.itemid,
      itemcode: item.itemcode,
      itemdescription: item.itemdescription,
      itemtaxable: item.itemtaxable,
      itemunit: item.itemunit,
      itempcs: toNum(item.itempcs),
      itemquantity: toNum(item.itemquantity),
      unitprice: toNum(item.unitprice),
      discountpercent: toNum(item.discountpercent),
      availableqty: item.availableqty,
      trackinventory: item.trackinventory,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (editingIndex === index) { setEditingIndex(null); resetToolItem(); }
    remove(index);
  };

  // Direct in-grid editing for an existing line — Qty/Tag Price/Disc% write straight
  // through to the row, and Ext. Price runs the same math in reverse (back-solving Tag
  // Price from qty + disc%) instead of routing every tweak back through the tool row.
  // Uses setValue on the specific field path rather than useFieldArray's update() —
  // update() unmounts and remounts the whole row on every call, which kicks focus out
  // of the input after a single keystroke.
  const updateInlineItemQuantity = (index: number, item: SalesOrderItemForm, rawValue: string) => {
    const qty = Math.round(Math.max(0, toNum(rawValue)) * 1000) / 1000;
    setValue(`items.${index}.itemquantity`, qty, { shouldDirty: true });
    const isWtItem = (item.itemunit ?? "").trim().toLowerCase() === "wt";
    if (isWtItem) {
      const rateField = getRateField(item.itemmetal, metalTypeList);
      const goldRate = currentRates && rateField ? ((currentRates as any)[rateField] ?? 0) : 0;
      const newUnitPrice = calcWtUnitPrice(item.itemmetal, currentRates as any, item.itempremium ?? 0, item.broakerage ?? 0, metalTypeList);
      setValue(`items.${index}.unitprice`, newUnitPrice, { shouldDirty: true });
      setValue(`items.${index}.goldprice_used`, goldRate, { shouldDirty: true });
      setValue(`items.${index}.premium_used`, item.itempremium, { shouldDirty: true });
      setValue(`items.${index}.labour_used`, item.broakerage, { shouldDirty: true });
    }
  };

  const updateInlineUnitPrice = (index: number, item: SalesOrderItemForm, rawValue: string) => {
    const clamped = Math.round(Math.max(0, toNum(rawValue)) * 1000) / 1000;
    setValue(`items.${index}.unitprice`, clamped, { shouldDirty: true });
  };

  const updateInlineDiscountPercent = (index: number, item: SalesOrderItemForm, rawValue: string) => {
    const clamped = Math.round(Math.min(100, Math.max(0, toNum(rawValue))) * 1000) / 1000;
    setValue(`items.${index}.discountpercent`, clamped, { shouldDirty: true });
    setValue(`items.${index}.discountsource`, "manual", { shouldDirty: true });
  };

  // Reverse calc: holds qty and disc% fixed, back-solves Tag Price so the line's net
  // total matches what was typed. No-ops on qty=0 or disc%=100 (both divide by zero).
  const updateInlineExtPrice = (index: number, item: SalesOrderItemForm, rawValue: string) => {
    const qty = toNum(item.itemquantity);
    const disc = toNum(item.discountpercent);
    if (qty <= 0 || disc >= 100) return;
    const extPrice = toNum(rawValue);
    const newUnitPrice = Math.round(((extPrice / qty) / (1 - disc / 100)) * 1000) / 1000;
    if (!Number.isFinite(newUnitPrice)) return;
    setValue(`items.${index}.unitprice`, Math.max(0, newUnitPrice), { shouldDirty: true });
    setValue(`items.${index}.discountsource`, "manual", { shouldDirty: true });
  };

  // Line items are priced/validated against the warehouse they were added under
  // (stock availability, Wt gold-rate lookups, carriage settings) — switching to a
  // different outlet's warehouse invalidates all of that, so confirm before wiping them.
  const handleWarehouseChange = (newWarehouseId: number, onConfirm: () => void) => {
    if (itemFields.length === 0) {
      onConfirm();
      return;
    }
    MySwal.fire({
      title: "Change warehouse?",
      text: "This sales order has line items added under the current warehouse. Switching warehouses will reset the order and remove all line items.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, change warehouse",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        replace([]);
        setEditingIndex(null);
        resetToolItem();
        onConfirm();
      }
    });
  };

  const onSubmit: SubmitHandler<SalesOrderFormType> = async (values) => {
    if (!values.items || values.items.length === 0) {
      dispatch(showNotification({ message: "Add at least one item", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    if (Math.abs(totals.orderTotal) <= 0) {
      dispatch(
        showNotification({
          message: "Sales order total is $0 — enter a unit price for at least one item before saving",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const hasWtItems = (values.items || []).some((it) => it.itemunit === "Wt");

    const soInput = {
      storeid: parsedStoreId,
      customerid: Number(values.customerid),
      warehouseid: Number(values.warehouseid),
      // Literal local date/time, no UTC conversion — see SalesInvoiceForm.tsx for why.
      orderdate: values.orderdate?.format("YYYY-MM-DDTHH:mm:ss.SSS"),
      termsid: values.termsid ?? null,
      invshippingmethod: values.invshippingmethod ? String(values.invshippingmethod) : null,
      orderedby: values.orderedby || null,
      discountpercent: toNum(values.discountpercent),
      orderdiscountpercent: toNum(values.orderdiscountpercent),
      orderdiscountamount: toNum(values.orderdiscountamount),
      salestaxrate: toNum(values.salestaxrate),
      shipping: toNum(values.shipping),
      remarks: values.remarks || null,
      invbilltocompanyname: values.invbilltocompanyname || null,
      invbilltoadd1: values.invbilltoadd1 || null,
      invbilltocity: values.invbilltocity || null,
      invbilltostate: values.invbilltostate || null,
      invbilltozip: values.invbilltozip || null,
      invbilltophone: values.invbilltophone || null,
      invshiptocompanyname: values.invshiptocompanyname || null,
      invshiptoadd1: values.invshiptoadd1 || null,
      invshiptocity: values.invshiptocity || null,
      invshiptostate: values.invshiptostate || null,
      invshiptozip: values.invshiptozip || null,
      invshiptophone: values.invshiptophone || null,
      goldrate_snapshot: hasWtItems && currentRates
        ? {
            ratedate: currentRates.ratedate,
            gold10kt_gram: currentRates.gold10kt_gram,
            gold14kt_gram: currentRates.gold14kt_gram,
            gold18kt_gram: currentRates.gold18kt_gram,
            gold22kt_gram: currentRates.gold22kt_gram,
            silver_gram: currentRates.silver_gram,
            platinum_gram: currentRates.platinum_gram,
            rhodium_gram: currentRates.rhodium_gram,
            source: currentRates.source,
          }
        : undefined,
      items: values.items.map((it) => ({
        ...(it.itemid != null ? { itemid: it.itemid } : {}),
        itemcode: it.itemcode ?? null,
        itemdescription: it.itemdescription ?? null,
        itemunit: it.itemunit ?? null,
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
        // Per-unit price after discount (quantity-independent) — e.g. $10 sell price
        // at 30% discount = $7, regardless of how many units are on the line.
        itemunitprice: Math.round(toNum(it.unitprice) * (1 - toNum(it.discountpercent) / 100) * 100) / 100,
        discountsource: it.discountsource ?? null,
        discountpromotionid: it.discountpromotionid ?? null,
        goldprice_used: it.goldprice_used ?? undefined,
        premium_used: it.premium_used ?? undefined,
        labour_used: it.labour_used ?? undefined,
      })),
    };

    const result = await handleTryCatch(async () => {
      let responseData: any;
      if (isEdit) {
        const { data } = await editSalesOrder({ variables: { input: { ...soInput, salesorderno: salesordernoEdit } } });
        responseData = data?.editSalesOrder;
      } else {
        const { data } = await createSalesOrder({ variables: { input: soInput } });
        responseData = data?.createSalesOrder;
      }

      if (!responseData?.success) throw new Error(responseData?.error || `Failed to ${isEdit ? "update" : "create"} sales order`);

      // Must happen before anything else — see the identical note in SalesInvoiceForm.tsx.
      suppressAutoHoldRef.current = true;
      if (currentHoldIdRef.current != null) {
        const holdIdToClear = currentHoldIdRef.current;
        currentHoldIdRef.current = null;
        deleteHoldMutation({ variables: { holdid: holdIdToClear, storeid: parsedStoreId } })
          .then(() => refetchHolds())
          .catch(() => {});
      }

      const soNumber = responseData.data ? Number(responseData.data) : (salesordernoEdit ? Number(salesordernoEdit) : null);

      const popupResult = await MySwal.fire({
        icon: "success",
        title: "Sales Order Saved",
        html: `<div class="text-muted" style="font-size:0.95rem">Sales Order${soNumber ? ` #${soNumber}` : ""} saved successfully.</div>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Print",
        denyButtonText: "Email",
        cancelButtonText: "Close",
        showCloseButton: true,
      });

      if (popupResult.isConfirmed && soNumber) {
        await handleTryCatch(async () => {
          const response = await api.post(`/store/sales-order/print`, { storeid: parsedStoreId, salesordernumbers: [soNumber] }, { responseType: "blob" });
          if (response.data) {
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setPdfPreview({ url, filename: `sales-order-${soNumber}.pdf` });
          }
          return true;
        });
      }

      if (popupResult.isDenied && soNumber) {
        setEmailModalSONumber(soNumber);
      }

      dispatch(showNotification({ message: responseData.message, type: NOTIFICATION_TYPES.SUCCESS }));
      reset();
      router.push(`${basePath}/sales/sales_order_list`);
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleDeleteConfirm = async () => {
    const result = await MySwal.fire({
      title: "Discard changes?",
      text: "All unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, discard",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) handleCancel();
  };

  const toolLine = computeLine(toolItem as SalesOrderItemForm);

  const billToCompanyName = watch("invbilltocompanyname") || "";
  const [addrOpen, setAddrOpen] = useState(true);
  // Re-collapses every time a Bill To gets (re-)selected — not just the first time ever —
  // so reopening the panel to pick a different customer collapses it again afterward.
  useEffect(() => {
    if (billToCompanyName && addrOpen) setAddrOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billToCompanyName]);
  // Also collapses when "Same as Bill To" is (re-)checked, even if the Bill To customer
  // itself didn't change. Unchecking must NOT collapse (the panel needs to stay open so
  // the user can fill in a separate Ship To), so this only fires on the true transition.
  useEffect(() => {
    if (shipSameAsBill && billToCompanyName && addrOpen) setAddrOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipSameAsBill]);

  if (isEdit && editLoading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>
      {readOnly && (
        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2">
          <strong>View Only</strong> — this sales order cannot be edited in its current status.
        </div>
      )}
      {isNewDoc && activeHolds.length > 0 && (
        <div className="card mb-3" style={{ borderColor: "#f59e0b" }}>
          <div
            className="card-body py-2 px-3 d-flex justify-content-between align-items-center"
            style={{ background: "#fffbeb", cursor: "pointer", borderBottom: showHoldsPanel ? "1px solid #f59e0b" : "none" }}
            onClick={() => setShowHoldsPanel((v) => !v)}
          >
            <span className="fw-semibold" style={{ fontSize: 13, color: "#92400e" }}>
              Held Sales Orders ({activeHolds.length})
            </span>
            <span style={{ fontSize: 11, color: "#b45309" }}>{showHoldsPanel ? "▲ Hide" : "▼ Show"}</span>
          </div>
          {showHoldsPanel && (
            <div className="card-body py-2 px-3">
              <table className="table table-sm mb-0">
                <tbody>
                  {activeHolds.map((hold: any) => (
                    <tr key={hold.holdid} style={{ borderBottom: "1px solid #fde68a" }}>
                      <td style={{ fontSize: 13 }}>{hold.holdname || `Hold #${hold.holdid}`}</td>
                      <td style={{ fontSize: 12, color: "#78716c" }}>{hold.formdata?.invbilltocompanyname || "—"}</td>
                      <td style={{ fontSize: 11, color: "#a8a29e" }}>
                        {hold.createdat ? new Date(hold.createdat).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-success" style={{ fontSize: 11, padding: "2px 10px" }} onClick={() => handleResumeHold(hold)}>Resume</button>{" "}
                        <button type="button" className="btn btn-sm btn-outline-danger" style={{ fontSize: 11, padding: "2px 10px" }} onClick={() => handleDeleteHold(hold.holdid)}>Discard</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <fieldset disabled={readOnly} style={readOnly ? { opacity: 0.85 } : undefined}>

      {/* HEADER STRIP */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-4 align-items-start">
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Order Date</div>
              <Controller
                control={control}
                name="orderdate"
                render={({ field }) => (
                  <DatePicker
                    className="filterdatepicker"
                    style={{ width: 160 }}
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    disabledDate={(current) => !!current && current > dayjs().endOf("day")}
                    format="MM/DD/YYYY"
                    allowClear={false}
                  />
                )}
              />
            </div>

            <div className="vr align-self-stretch" />

            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Warehouse</div>
              {hasMultiOutletAccess ? (
                <Controller
                  name="warehouseid"
                  control={control}
                  rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <select
                      className="form-select form-select-sm"
                      style={{ minWidth: 220 }}
                      value={Number.isFinite(field.value) ? field.value : ""}
                      onChange={(e) => {
                        const newWarehouseId = Number(e.target.value);
                        if (newWarehouseId === Number(field.value)) return;
                        handleWarehouseChange(newWarehouseId, () => field.onChange(newWarehouseId));
                      }}
                    >
                      {accessibleSystemWarehouses.map((w) => (
                        <option key={w.warehouseid} value={w.warehouseid}>
                          {(accessibleOutlets as any[]).find((o) => Number(o.outletid) === Number(w.outletid))?.outletname ?? `Outlet ${w.outletid}`} — {w.warehousename}
                        </option>
                      ))}
                    </select>
                  )}
                />
              ) : (
                <>
                  <div className="fw-semibold">{currentWarehouse?.warehousename || <span className="text-muted">&mdash;</span>}</div>
                  <input type="hidden" {...register("warehouseid", { valueAsNumber: true, required: true, min: 1 })} />
                </>
              )}
            </div>

            <div className="vr align-self-stretch" />

            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>SO #</div>
              {salesordernoEdit ? (
                <div className="fw-semibold">{salesordernoEdit}</div>
              ) : (
                <div className="text-muted fst-italic">Auto-assigned</div>
              )}
            </div>

            {billToCompanyName && (
              <>
                <div className="vr align-self-stretch" />
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Bill To</div>
                  <div className="fw-semibold">{billToCompanyName}</div>
                  <div className="text-muted small">
                    {watch("invbilltocity")}{watch("invbilltostate") ? `, ${watch("invbilltostate")}` : ""}
                  </div>
                </div>
                <div className="vr align-self-stretch" />
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Ship To</div>
                  {shipSameAsBill ? (
                    <div className="text-muted small fst-italic">Same as Bill To</div>
                  ) : (
                    <>
                      <div className="fw-semibold">{watch("invshiptocompanyname") || billToCompanyName}</div>
                      <div className="text-muted small">
                        {watch("invshiptocity")}{watch("invshiptostate") ? `, ${watch("invshiptostate")}` : ""}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADDRESSES — collapsible */}
      <div className="card mb-3">
        <div
          className="card-header d-flex align-items-center justify-content-between py-2"
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => setAddrOpen((o) => !o)}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold" style={{ fontSize: 13 }}>Addresses</span>
            {!addrOpen && billToCompanyName && (
              <span className="text-muted" style={{ fontSize: 12 }}>
                — Bill To: {billToCompanyName}
                {!shipSameAsBill && watch("invshiptocompanyname") ? ` · Ship To: ${watch("invshiptocompanyname")}` : ""}
              </span>
            )}
          </div>
          <i className={`fas fa-chevron-${addrOpen ? "up" : "down"} text-muted`} style={{ fontSize: 12 }} />
        </div>
        {addrOpen && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-6 col-md-12">
                <div className="border rounded p-3 h-100">
                  <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Bill To <span className="text-danger">*</span></div>
                  <div className="mb-2">
                    <Controller
                      control={control}
                      name="customerid"
                      rules={{ required: "Customer is required" }}
                      render={({ field, fieldState }) => (
                        <>
                          <SelectCustomer
                            storeId={parsedStoreId}
                            outletId={parsedOutletId}
                            value={field.value}
                            onChange={(val: number | undefined) => field.onChange(val)}
                            trigger={trigger}
                          />
                          {fieldState.error && <div className="text-danger small mt-1">{fieldState.error.message}</div>}
                        </>
                      )}
                    />
                  </div>
                  <div className="row g-1 mt-1">
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Address" {...register("invbilltoadd1")} />
                    </div>
                    <div className="col-5"><input className="form-control form-control-sm" placeholder="City" {...register("invbilltocity")} /></div>
                    <div className="col-3"><input className="form-control form-control-sm" placeholder="State" {...register("invbilltostate")} /></div>
                    <div className="col-4"><input className="form-control form-control-sm" placeholder="Zip" {...register("invbilltozip")} /></div>
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Phone" {...register("invbilltophone")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 col-md-12">
                <div className="border rounded p-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-uppercase fw-semibold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Ship To</div>
                    <label className="d-flex align-items-center gap-2 m-0 small text-muted" style={{ cursor: "pointer" }}>
                      <input type="checkbox" {...register("shipSameAsBill")} />
                      Same as Bill To
                    </label>
                  </div>
                  {!shipSameAsBill && (
                    <div className="mb-2">
                      <Controller
                        control={control}
                        name="shiptocustomerid"
                        render={({ field }) => (
                          <SelectCustomer storeId={parsedStoreId} outletId={parsedOutletId} value={field.value} onChange={(val: number | undefined) => field.onChange(val)} trigger={trigger} />
                        )}
                      />
                    </div>
                  )}
                  <div className="row g-1 mt-1">
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Company" {...register("invshiptocompanyname")} disabled={shipSameAsBill} />
                    </div>
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Address" {...register("invshiptoadd1")} disabled={shipSameAsBill} />
                    </div>
                    <div className="col-5"><input className="form-control form-control-sm" placeholder="City" {...register("invshiptocity")} disabled={shipSameAsBill} /></div>
                    <div className="col-3"><input className="form-control form-control-sm" placeholder="State" {...register("invshiptostate")} disabled={shipSameAsBill} /></div>
                    <div className="col-4"><input className="form-control form-control-sm" placeholder="Zip" {...register("invshiptozip")} disabled={shipSameAsBill} /></div>
                    <div className="col-12">
                      <input className="form-control form-control-sm" placeholder="Phone" {...register("invshiptophone")} disabled={shipSameAsBill} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAILS */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            {/* Reference */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Reference</div>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small text-muted mb-1">Ordered By</label>
                    <input type="text" className="form-control form-control-sm" {...register("orderedby")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Fulfillment</div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Terms</label>
                    <Controller
                      control={control}
                      name="termsid"
                      render={({ field }) => (
                        <SelectPaymentTerms
                          storeId={parsedStoreId}
                          value={field.value}
                          onChange={(val: number | undefined) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Shipping Method</label>
                    <Controller
                      control={control}
                      name="invshippingmethod"
                      render={({ field }) => (
                        <SelectShippingModes
                          storeId={parsedStoreId}
                          value={field.value}
                          onChange={(val: number | undefined) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Pricing</div>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Line Item Discount %</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      step="0.001"
                      min={0}
                      max={100}
                      {...register("discountpercent", { valueAsNumber: true })}
                      onChange={(e) => {
                        const n = Number(e.target.value || 0);
                        const clamped = Math.min(100, Math.max(0, n));
                        setValue("discountpercent", clamped, { shouldDirty: true });
                        const currentItems = getValues("items");
                        if (currentItems?.length) {
                          // Only applies to lines without their own bulk/promo discount —
                          // those were earned on their own merits and shouldn't be silently
                          // overwritten by a flat entry here.
                          replace(currentItems.map((it: any) =>
                            it.discountsource === 'bulk' || it.discountsource === 'promotion'
                              ? it
                              : { ...it, discountpercent: clamped }
                          ));
                        }
                      }}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Sales Tax %</label>
                    <input type="number" className="form-control form-control-sm" step="0.001" min={0} max={100}
                      {...register("salestaxrate", { valueAsNumber: true })} />
                  </div>
                  <div className="col-4">
                    <label className="form-label small text-muted mb-1">Shipping</label>
                    <input type="number" className="form-control form-control-sm" step="0.01" min={0}
                      {...register("shipping", { valueAsNumber: true })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gold rate warning — shown when no rates set for today */}
      {ratesStale && (
        <div
          className="d-flex align-items-center gap-2 mb-2"
          style={{ background: "#fffbeb", border: "1px solid #f59e0b", color: "#92400e", borderRadius: 8, fontSize: 12, padding: "8px 12px" }}
        >
          <span>⚠</span>
          <span>Gold rates not set for today — Wt-priced items will price at $0. Go to System Settings → Metal Rates to update.</span>
        </div>
      )}

      {/* LINE ITEMS */}
      <div className="card mb-3">
        <div className="card-body">

          {/* Scrollable items table */}
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            <table className="table datanew mb-0">
              <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                <tr>
                  <th className="text-nowrap">#</th>
                  <th className="text-nowrap">Item Code</th>
                  <th style={{ minWidth: readOnly ? (allowPcsEntry ? "160px" : "320px") : (allowPcsEntry ? "180px" : "220px") }}>Description</th>
                  <th className="text-center text-nowrap">Tax</th>
                  <th className="text-center text-nowrap">Unit</th>
                  {allowPcsEntry && <th className="text-end text-nowrap">Ord Pcs</th>}
                  {allowPcsEntry && readOnly && <th className="text-end text-nowrap">Inv Pcs</th>}
                  {allowPcsEntry && readOnly && <th className="text-end text-nowrap">Bord Pcs</th>}
                  <th className="text-end text-nowrap">Ord Qty</th>
                  {readOnly && <th className="text-end text-nowrap">Inv Qty</th>}
                  {readOnly && <th className="text-end text-nowrap">Bord Qty</th>}
                  <th className="text-end text-nowrap">Tag Price</th>
                  <th className="text-end text-nowrap">Discount %</th>
                  {showUnitPriceCol && <th className="text-end text-nowrap">Unit Price</th>}
                  <th className="text-end text-nowrap">Ext. Price</th>
                  <th className="text-center text-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {itemFields.length === 0 ? (
                  <tr>
                    <td colSpan={(readOnly ? 15 : 11) - (allowPcsEntry ? 0 : readOnly ? 3 : 1) + (showUnitPriceCol ? 1 : 0)} className="text-center text-muted py-5 fst-italic">
                      No items yet — use the form below to add line items
                    </td>
                  </tr>
                ) : (
                  itemFields.map((field, index) => {
                    // watch() (not the raw field array `field`) so inline edits made via
                    // setValue below re-render this row immediately.
                    const item = (watch(`items.${index}`) ?? field) as SalesOrderItemForm;
                    const line = computeLine(item);
                    return (
                      <tr key={field.id} className={`align-middle${editingIndex === index ? " table-warning" : ""}`}>
                        <td>{index + 1}</td>
                        <td className="text-nowrap">{item.itemcode || ""}</td>
                        <td>
                          {item.itemdescription || ""}
                          {item.trackinventory !== 0 &&
                            item.availableqty !== undefined &&
                            Math.abs(toNum(item.itemquantity)) > toNum(item.availableqty) && (
                              <div className="text-warning" style={{ fontSize: 11 }}>
                                Backorder: only {toNum(item.availableqty)} in stock
                              </div>
                            )}
                        </td>
                        <td className="text-center">{toNum(item.itemtaxable) === 1 ? "Y" : "N"}</td>
                        <td className="text-center">
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: (item.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (item.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af" }}>
                            {item.itemunit || "Pc"}
                          </span>
                        </td>
                        {allowPcsEntry && <td className="text-end">{formatQty(toNum(item.itempcs))}</td>}
                        {allowPcsEntry && readOnly && <td className="text-end">{formatQty(toNum(item.invoicepcs))}</td>}
                        {allowPcsEntry && readOnly && <td className="text-end">{formatQty(toNum(item.bordpcs))}</td>}
                        <td className="text-end" style={{ minWidth: 90 }}>
                          {readOnly ? (
                            formatQty(toNum(item.itemquantity))
                          ) : (
                            <input
                              type="number"
                              step="0.001"
                              min={0}
                              className="form-control form-control-sm text-end"
                              value={toNum(item.itemquantity)}
                              onChange={(e) => updateInlineItemQuantity(index, item, e.target.value)}
                              onKeyDown={handleEnterAsTab}
                            />
                          )}
                        </td>
                        {readOnly && <td className="text-end">{formatQty(toNum(item.invoiceqty))}</td>}
                        {readOnly && <td className="text-end">{formatQty(toNum(item.bordqty))}</td>}
                        <td className="text-end" style={{ minWidth: 100 }}>
                          {readOnly ? (
                            <>
                              <span className={toNum(item.unitprice) === 0 ? "text-danger fw-bold" : ""}>{formatMoney(item.unitprice)}</span>
                              {toNum(item.unitprice) === 0 && (
                                <div className="text-danger" style={{ fontSize: 11 }}>Price not set</div>
                              )}
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.001"
                                min={0}
                                className={`form-control form-control-sm text-end${toNum(item.unitprice) === 0 ? " border-danger" : ""}`}
                                value={toNum(item.unitprice)}
                                onChange={(e) => updateInlineUnitPrice(index, item, e.target.value)}
                                onKeyDown={handleEnterAsTab}
                              />
                              {toNum(item.unitprice) === 0 && (
                                <div className="text-danger" style={{ fontSize: 11 }}>Price not set</div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="text-end" style={{ minWidth: 90 }}>
                          {readOnly ? (
                            <>
                              <div>{toNum(item.discountpercent).toFixed(1)}%</div>
                              {item.discountsource && item.discountsource !== 'item' && (
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.discountsource === 'manual' ? '#fef3c7' : item.discountsource === 'bulk' ? '#dcfce7' : '#ede9fe', color: item.discountsource === 'manual' ? '#92400e' : item.discountsource === 'bulk' ? '#166534' : '#6d28d9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {item.discountsource === 'bulk' ? 'Bulk' : item.discountsource === 'promotion' ? 'Promo' : 'Manual'}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.001"
                                min={0}
                                max={100}
                                className="form-control form-control-sm text-end"
                                value={toNum(item.discountpercent)}
                                onChange={(e) => updateInlineDiscountPercent(index, item, e.target.value)}
                                onKeyDown={handleEnterAsTab}
                              />
                              {item.discountsource && item.discountsource !== 'item' && (
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.discountsource === 'manual' ? '#fef3c7' : item.discountsource === 'bulk' ? '#dcfce7' : '#ede9fe', color: item.discountsource === 'manual' ? '#92400e' : item.discountsource === 'bulk' ? '#166534' : '#6d28d9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {item.discountsource === 'bulk' ? 'Bulk' : item.discountsource === 'promotion' ? 'Promo' : 'Manual'}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        {showUnitPriceCol && <td className="text-end">{formatMoney(line.unitAfterDiscount)}</td>}
                        <td className="text-end" style={{ minWidth: 100 }}>
                          {readOnly ? (
                            formatMoney(line.net)
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm text-end"
                              value={Number.isFinite(line.net) ? Number(line.net.toFixed(2)) : 0}
                              onChange={(e) => updateInlineExtPrice(index, item, e.target.value)}
                              onKeyDown={handleEnterAsTab}
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleEditItem(index)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ADD / EDIT LINE ROW */}
          {!readOnly && (
            <div className="border-top pt-3 mt-1">
              <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                {editingIndex != null ? `Editing Line ${editingIndex + 1}` : "+ Add Line Item"}
              </div>
              <div className="row g-2 align-items-end">
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <label className="form-label small text-muted mb-1">Search/Scan Item/Barcode</label>
                  <SelectProduct
                    storeId={parsedStoreId}
                    hasWarehouseId={true}
                    warehouseId={watch("warehouseid")}
                    onProductsLoaded={setProducts}
                    trigger={trigger}
                    value={toolItem.itemid}
                    initialLabel={
                      toolItem.itemid != null && toolItem.itemcode
                        ? `${toolItem.itemcode} - ${toolItem.itemdescription || ""}`
                        : undefined
                    }
                    clearKey={productClearKey}
                    onChange={(val: number | undefined) =>
                      setToolItem((prev) => ({ ...prev, itemid: val }))
                    }
                    onChangeAdditional={(selected: ItemDetails) => {
                      if (!selected) {
                        setToolItem((prev) => ({
                          ...prev,
                          itemid: undefined,
                          itemcode: undefined,
                          itemdescription: undefined,
                          itemtaxable: undefined,
                          itemunit: undefined,
                          unitprice: 0,
                        }));
                        return;
                      }
                      const isWtItem = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
                      if (allowCarriage && !isWtItem) {
                        return autoAddItem(selected);
                      }
                      const premium = Number(selected.itempremium || 0);
                      const labour = Number(selected.broakerage || 0);
                      const rateField = isWtItem ? getRateField(selected.itemmetal, metalTypeList) : undefined;
                      const goldRate = isWtItem && currentRates && rateField ? ((currentRates as any)[rateField] ?? 0) : 0;
                      const unitprice = isWtItem
                        ? calcWtUnitPrice(selected.itemmetal, currentRates as any, premium, labour, metalTypeList)
                        : Number(selected.itemsellprice || 0);
                      setToolItem((prev) => ({
                        ...prev,
                        itemid: Number(selected.itemid),
                        itemcode: selected.itemcode,
                        itemdescription: selected.itemdescription,
                        itemtaxable: toNum(selected.itemtaxable),
                        itemunit: selected.itemunit,
                        itemquantity: isWtItem ? 0 : 1,
                        unitprice,
                        discountpercent: toNum(watch("discountpercent")),
                        itemmetal: selected.itemmetal,
                        itempremium: premium,
                        broakerage: labour,
                        goldprice_used: isWtItem ? goldRate : undefined,
                        premium_used: isWtItem ? premium : undefined,
                        labour_used: isWtItem ? labour : undefined,
                        _itemdiscount: toNum(selected.itemdiscount),
                        _itemcategoryid: selected.itemcategoryid ?? null,
                        availableqty: toNum(selected.itemquantityinhand),
                        trackinventory: selected.trackinventory != null ? toNum(selected.trackinventory) : 1,
                      }));
                    }}
                    onNotFound={() =>
                      dispatch(showNotification({ message: "Item not found", type: NOTIFICATION_TYPES.ERROR }))
                    }
                  />
                </div>

                <div className={`${allowPcsEntry ? "col-lg-2" : "col-lg-3"} col-md-6 col-sm-12`}>
                  <label className="form-label small text-muted mb-1">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={toolItem.itemdescription || ""}
                    onChange={(e) => setToolItem((prev) => ({ ...prev, itemdescription: e.target.value }))}
                    onKeyDown={handleEnterAsTab}
                  />
                </div>

                {allowPcsEntry && (
                  <div className="col-lg-1 col-md-6 col-sm-12">
                    <label className="form-label small text-muted mb-1">Pcs</label>
                    <input
                      type="number"
                      className="form-control px-1 text-end"
                      min={0}
                      step="1"
                      value={toolItem.itempcs}
                      onChange={(e) => setToolItem((p) => ({ ...p, itempcs: toNum(e.target.value) }))}
                      onKeyDown={handleEnterAsTab}
                    />
                  </div>
                )}

                <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                  <label className="form-label small text-muted mb-1">
                    Quantity *{toolItem.itemunit && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: (toolItem.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (toolItem.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af", marginLeft: 4 }}>
                        {toolItem.itemunit}
                      </span>
                    )}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      className="form-control px-1 text-end"
                      min={1}
                      step="0.001"
                      value={toolItem.itemquantity}
                      onChange={(e) => {
                        const qty = toNum(e.target.value);
                        setToolItem((p) => {
                          if ((p.itemunit ?? "").trim().toLowerCase() === "wt") {
                            const rateField = getRateField(p.itemmetal, metalTypeList);
                            const goldRate = currentRates && rateField ? ((currentRates as any)[rateField] ?? 0) : 0;
                            const newUnitPrice = calcWtUnitPrice(p.itemmetal, currentRates as any, p.itempremium ?? 0, p.broakerage ?? 0, metalTypeList);
                            return { ...p, itemquantity: qty, unitprice: newUnitPrice, goldprice_used: goldRate, premium_used: p.itempremium, labour_used: p.broakerage };
                          }
                          return { ...p, itemquantity: qty };
                        });
                      }}
                      onKeyDown={handleEnterAsTab}
                    />
                    {toolItem.itemid != null &&
                      toolItem.trackinventory !== 0 &&
                      Math.abs(toolItem.itemquantity || 0) > (toolItem.availableqty ?? 0) && (
                        <div
                          className="text-warning text-nowrap"
                          style={{ fontSize: 11, position: "absolute", top: "100%", left: 0, marginTop: 4 }}
                        >
                          Backorder: only {toolItem.availableqty ?? 0} in stock
                        </div>
                      )}
                  </div>
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  <label className="form-label small text-muted mb-1">Tag Price <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className={`form-control px-1 text-end${toolItem.itemid != null && !toolItem.unitprice ? " border-danger" : ""}`}
                    min={0}
                    step="0.001"
                    value={toolItem.unitprice}
                    onChange={(e) => setToolItem((p) => ({ ...p, unitprice: toNum(e.target.value) }))}
                    onKeyDown={handleEnterAsTab}
                  />
                  {toolItem.itemid != null && !toolItem.unitprice && (
                    <div className="text-danger" style={{ fontSize: 11 }}>Price not set</div>
                  )}
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  <label className="form-label small text-muted mb-1">Disc %</label>
                  <input
                    type="number"
                    className="form-control px-1 text-end"
                    min={0}
                    max={100}
                    step="0.001"
                    value={toolItem.discountpercent ?? 0}
                    onChange={(e) => setToolItem((p) => ({ ...p, discountpercent: toNum(e.target.value) }))}
                    onKeyDown={handleEnterAsTab}
                  />
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                  <label className="form-label small text-muted mb-1">Ext Price</label>
                  <input
                    type="text"
                    className="form-control px-1 text-end"
                    readOnly
                    value={formatMoney(toolLine.net)}
                  />
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  {editingIndex == null ? (
                    <button
                      type="button"
                      className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                      onClick={handleSaveToolItem}
                    >
                      <PlusCircle size={16} />
                    </button>
                  ) : (
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className="btn btn-success d-flex align-items-center justify-content-center"
                        onClick={handleSaveToolItem}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary d-flex align-items-center justify-content-center"
                        onClick={() => { setEditingIndex(null); resetToolItem(); }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NOTES + TOTALS */}
      <div className="row g-3 mb-3">

        {/* Left - customer message */}
        <div className="col-lg-6 col-md-12">
          <div className="card h-100">
            <div className="card-body">
              <label className="form-label small text-muted mb-1">Customer Message / Remarks</label>
              <textarea className="form-control" rows={6} {...register("remarks")} />
            </div>
          </div>
        </div>

        {/* Right - summary table */}
        <div className="col-lg-6 col-md-12">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3 text-muted small">
                <span>{itemFields.length} item{itemFields.length !== 1 ? "s" : ""}</span>
                <span className="d-flex gap-2 flex-wrap justify-content-end">
                  {totals.totalPcs > 0 && <span>{totals.totalPcs} pcs</span>}
                  {Object.entries(totals.unitQtyTotals).map(([unit, qty]) => (
                    <span key={unit} style={{ fontWeight: 600 }}>
                      {Number.isInteger(qty) ? qty : qty.toFixed(3)} {unit}
                    </span>
                  ))}
                </span>
              </div>
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="ps-0 text-muted">Gross Total</td>
                    <td className="pe-0 text-end fw-semibold">{formatMoney(totals.grossTotal)}</td>
                  </tr>
                  {totals.discountAmount > 0 && (
                    <tr>
                      <td className="ps-0 text-muted">Item Discount</td>
                      <td className="pe-0 text-end text-danger">-{formatMoney(totals.discountAmount)}</td>
                    </tr>
                  )}
                  <tr className="border-top">
                    <td className="ps-0 text-muted">Subtotal</td>
                    <td className="pe-0 text-end">{formatMoney(totals.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="ps-0 text-muted">Order Discount</td>
                    <td className="pe-0 text-end">
                      <div className="d-flex gap-1 justify-content-end align-items-center">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          className="form-control form-control-sm text-end d-inline-block"
                          style={{ width: 60 }}
                          value={toNum(watch("orderdiscountpercent"))}
                          onChange={(e) => {
                            const pct = Math.min(100, Math.max(0, toNum(e.target.value)));
                            setValue("orderdiscountpercent", pct, { shouldDirty: true });
                            const amt = Math.round(totals.subtotal * (pct / 100) * 100) / 100;
                            setValue("orderdiscountamount", amt, { shouldDirty: true });
                          }}
                        />
                        <span className="text-muted">%</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className="form-control form-control-sm text-end d-inline-block"
                          style={{ width: 100 }}
                          value={toNum(watch("orderdiscountamount"))}
                          onChange={(e) => {
                            const amt = Math.max(0, toNum(e.target.value));
                            setValue("orderdiscountamount", amt, { shouldDirty: true });
                            const pct = totals.subtotal > 0 ? Math.round((amt / totals.subtotal) * 100 * 100) / 100 : 0;
                            setValue("orderdiscountpercent", Math.min(100, pct), { shouldDirty: true });
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-0 text-muted">Shipping</td>
                    <td className="pe-0 text-end">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm text-end d-inline-block"
                        style={{ width: 120 }}
                        {...register("shipping")}
                      />
                    </td>
                  </tr>
                  <tr className="border-top border-2">
                    <td className="ps-0 fw-bold" style={{ fontSize: "1rem" }}>Order Total</td>
                    <td className="pe-0 text-end fw-bold" style={{ fontSize: "1rem" }}>{formatMoney(totals.orderTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      </fieldset>
      {readOnly ? (
        <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #e9ecef", padding: "12px 24px", zIndex: 10, display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Close
          </button>
        </div>
      ) : (
        <ActionFooter handleCancel={handleDeleteConfirm}>
          {isNewDoc && (
            <button type="button" className="btn btn-outline-warning me-2" disabled={savingHold} onClick={handleHold}>
              {savingHold ? "Saving…" : "Hold"}
            </button>
          )}
          <ButtonLoader
            loading={saving}
            btnText="Save Sales Order"
            loadingText="Saving..."
            type="submit"
            className="btn btn-primary"
          />
        </ActionFooter>
      )}
    </form>
    {emailModalSONumber && (
      <DocumentEmailModal
        storeId={parsedStoreId}
        documentType="SALES_ORDER"
        documentNumbers={[emailModalSONumber]}
        onClose={() => setEmailModalSONumber(null)}
        onSent={(msg) => {
          setEmailModalSONumber(null);
          dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS }));
        }}
        onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
      />
    )}
    {pdfPreview && (
      <PdfPreviewModal
        pdfUrl={pdfPreview.url}
        filename={pdfPreview.filename}
        onClose={() => setPdfPreview(null)}
      />
    )}
    </>
  );
};

export default SalesOrderForm;
