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
import useWarehouse from "@/hooks/useWarehouse";
import type { ItemDetails } from "@/hooks/useProducts";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";

import { CREATE_SALES_ORDER_MUTATION, EDIT_SALES_ORDER_MUTATION } from "@/lib/graphql/mutations/sales";
import { GET_SALES_ORDER_QUERY } from "@/lib/graphql/query/sales";
import { GET_PRODUCT_SETTINGS_INFO_QUERY } from "@/lib/graphql/query/products";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { GET_PROMOTION_LIST_QUERY } from "@/lib/graphql/query/promotions";
import { GET_PRODUCT_BULK_DISCOUNTS_QUERY } from "@/lib/graphql/query/bulkDiscounts";
import { resolveDiscount, type BulkDiscountTier, type ActivePromotion } from "@/lib/utils/discountResolver";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
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
  return { qty, unit, disc, gross, discountAmt, net };
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

  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: 0 },
    skip: !parsedStoreId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;
  const allowPcsEntry = productSettings == null || !!productSettings.allowpcsentry;
  const allowCarriage = productSettings != null && !!productSettings.allowcarriage;
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

  const currencyFormatter = useMemo(() => {
    if (typeof navigator === "undefined") return { formatFixed: (n: number) => n.toFixed(2) };
    const detected = detectUserCurrency();
    const formatter = new Intl.NumberFormat(navigator.language || "en-US", {
      style: "currency",
      currency: detected.code,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return { formatFixed: (n: number) => formatter.format(n) };
  }, []);

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

  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  useEffect(() => {
    if (parsedOutletId) fetchWarehouseByOutletId(parsedOutletId);
  }, [fetchWarehouseByOutletId, parsedOutletId]);

  const currentWarehouse = useMemo(() => warehouses.find((w) => w.issystem) ?? warehouses[0], [warehouses]);

  useEffect(() => {
    if (!warehouses?.length || !currentWarehouse?.warehouseid) return;
    setValue("warehouseid", Number(currentWarehouse.warehouseid), { shouldDirty: false, shouldTouch: false });
  }, [currentWarehouse, setValue, warehouses]);

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
    const discountPercent = toNum(watchedDiscountPercent);
    const lines = items.map((it) => computeLine(it));
    const grossTotal = lines.reduce((acc, l) => acc + l.gross, 0);
    const lineDiscountTotal = lines.reduce((acc, l) => acc + l.discountAmt, 0);
    const afterLineDiscount = grossTotal - lineDiscountTotal;
    const invoiceDiscountAmt = afterLineDiscount * (discountPercent / 100);
    const discountAmount = lineDiscountTotal + invoiceDiscountAmt;
    const subtotal = grossTotal - discountAmount;
    const shipping = toNum(watchedShipping);
    const orderTotal = subtotal + shipping;
    const totalPcs = items.reduce((acc, it) => acc + toNum(it.itempcs), 0);
    const unitQtyTotals: Record<string, number> = {};
    for (const it of items) {
      const unit = (it.itemunit ?? "Pc").trim() || "Pc";
      unitQtyTotals[unit] = (unitQtyTotals[unit] ?? 0) + Math.abs(toNum(it.itemquantity));
    }
    return { totalItems: items.length, totalPcs, unitQtyTotals, grossTotal, discountAmount, subtotal, shipping, orderTotal };
  }, [watchedDiscountPercent, watchedItems, watchedShipping]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => { reset(); router.back(); },
  });

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
        update(dupIndex, { ...existing, itemquantity: newQty, discountpercent: resolved.discountpercent, discountsource: resolved.discountsource, discountpromotionid: resolved.discountpromotionid });
        if (resolved.discountpercent !== prevDisc && resolved.discountsource) {
          dispatch(showNotification({ message: `Discount updated: ${resolved.label}`, type: NOTIFICATION_TYPES.SUCCESS }));
        }
      } else {
        update(dupIndex, { ...existing, itemquantity: newQty });
      }
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
        discountpercent: resolved.discountpercent,
        discountsource: resolved.discountsource,
        discountpromotionid: resolved.discountpromotionid,
        itemmetal: selected.itemmetal,
        itempremium: premium,
        broakerage: labour,
        goldprice_used: isWt ? goldRate : undefined,
        premium_used: isWt ? premium : undefined,
        labour_used: isWt ? labour : undefined,
      });
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
    } else {
      const existingItem = getValues(`items.${editingIndex}`);
      if (discountPct !== toNum(existingItem?.discountpercent)) {
        resolvedSource = 'manual';
        resolvedPromotionId = null;
      } else {
        resolvedSource = (existingItem as any)?.discountsource ?? null;
        resolvedPromotionId = (existingItem as any)?.discountpromotionid ?? null;
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
      discountpercent: discountPct,
      discountsource: resolvedSource,
      discountpromotionid: resolvedPromotionId,
      itemmetal: toolItem.itemmetal,
      itempremium: toolItem.itempremium,
      broakerage: toolItem.broakerage,
      goldprice_used: toolItem.goldprice_used,
      premium_used: toolItem.premium_used,
      labour_used: toolItem.labour_used,
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
    });
  };

  const handleRemoveItem = (index: number) => {
    if (editingIndex === index) { setEditingIndex(null); resetToolItem(); }
    remove(index);
  };

  const onSubmit: SubmitHandler<SalesOrderFormType> = async (values) => {
    if (!values.items || values.items.length === 0) {
      dispatch(showNotification({ message: "Add at least one item", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const hasWtItems = (values.items || []).some((it) => it.itemunit === "Wt");

    const soInput = {
      storeid: parsedStoreId,
      customerid: Number(values.customerid),
      warehouseid: Number(values.warehouseid),
      orderdate: values.orderdate?.toISOString(),
      termsid: values.termsid ?? null,
      invshippingmethod: values.invshippingmethod ? String(values.invshippingmethod) : null,
      orderedby: values.orderedby || null,
      discountpercent: toNum(values.discountpercent),
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
  const autoCollapsedRef = useRef(false);
  useEffect(() => {
    if (billToCompanyName && !autoCollapsedRef.current) {
      setAddrOpen(false);
      autoCollapsedRef.current = true;
    }
  }, [billToCompanyName]);

  if (isEdit && editLoading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>
      {readOnly && (
        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2">
          <strong>View Only</strong> — this sales order cannot be edited in its current status.
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
                    format="MM/DD/YYYY"
                    allowClear={false}
                  />
                )}
              />
            </div>

            <div className="vr align-self-stretch" />

            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Warehouse</div>
              <div className="fw-semibold">{currentWarehouse?.warehousename || <span className="text-muted">&mdash;</span>}</div>
              <input type="hidden" {...register("warehouseid", { valueAsNumber: true, required: true, min: 1 })} />
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
                          <SelectCustomer storeId={parsedStoreId} value={field.value} onChange={(val: number | undefined) => field.onChange(val)} trigger={trigger} />
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
                    <label className="form-label small text-muted mb-1">Discount %</label>
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
                          replace(currentItems.map((it) => ({ ...it, discountpercent: clamped })));
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
                  <th className="text-end text-nowrap">Unit Price</th>
                  <th className="text-end text-nowrap">Discount %</th>
                  <th className="text-end text-nowrap">Ext. Price</th>
                  <th className="text-center text-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {itemFields.length === 0 ? (
                  <tr>
                    <td colSpan={(readOnly ? 15 : 11) - (allowPcsEntry ? 0 : readOnly ? 3 : 1)} className="text-center text-muted py-5 fst-italic">
                      No items yet — use the form below to add line items
                    </td>
                  </tr>
                ) : (
                  itemFields.map((field, index) => {
                    const item = field;
                    const line = computeLine(item);
                    return (
                      <tr key={field.id} className={`align-middle${editingIndex === index ? " table-warning" : ""}`}>
                        <td>{index + 1}</td>
                        <td className="text-nowrap">{item.itemcode || ""}</td>
                        <td>{item.itemdescription || ""}</td>
                        <td className="text-center">{toNum(item.itemtaxable) === 1 ? "Y" : "N"}</td>
                        <td className="text-center">
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: (item.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (item.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af" }}>
                            {item.itemunit || "Pc"}
                          </span>
                        </td>
                        {allowPcsEntry && <td className="text-end">{toNum(item.itempcs)}</td>}
                        {allowPcsEntry && readOnly && <td className="text-end">{toNum(item.invoicepcs)}</td>}
                        {allowPcsEntry && readOnly && <td className="text-end">{toNum(item.bordpcs)}</td>}
                        <td className="text-end">{toNum(item.itemquantity)}</td>
                        {readOnly && <td className="text-end">{toNum(item.invoiceqty)}</td>}
                        {readOnly && <td className="text-end">{toNum(item.bordqty)}</td>}
                        <td className="text-end">{formatMoney(item.unitprice)}</td>
                        <td className="text-end">
                          <div>{toNum(item.discountpercent).toFixed(1)}%</div>
                          {item.discountsource && item.discountsource !== 'item' && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.discountsource === 'manual' ? '#fef3c7' : item.discountsource === 'bulk' ? '#dcfce7' : '#ede9fe', color: item.discountsource === 'manual' ? '#92400e' : item.discountsource === 'bulk' ? '#166534' : '#6d28d9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {item.discountsource === 'bulk' ? 'Bulk' : item.discountsource === 'promotion' ? 'Promo' : 'Manual'}
                            </span>
                          )}
                        </td>
                        <td className="text-end">{formatMoney(line.net)}</td>
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
                        autoAddItem(selected);
                        return;
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
                  />
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  <label className="form-label small text-muted mb-1">Unit Price <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control px-1 text-end"
                    min={0}
                    step="0.001"
                    value={toolItem.unitprice}
                    onChange={(e) => setToolItem((p) => ({ ...p, unitprice: toNum(e.target.value) }))}
                  />
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
                      <td className="ps-0 text-muted">Discount</td>
                      <td className="pe-0 text-end text-danger">-{formatMoney(totals.discountAmount)}</td>
                    </tr>
                  )}
                  <tr className="border-top">
                    <td className="ps-0 text-muted">Subtotal</td>
                    <td className="pe-0 text-end">{formatMoney(totals.subtotal)}</td>
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
        <div className="card sticky-footer">
          <div className="card-body">
            <div className="text-end">
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ActionFooter handleCancel={handleDeleteConfirm}>
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
