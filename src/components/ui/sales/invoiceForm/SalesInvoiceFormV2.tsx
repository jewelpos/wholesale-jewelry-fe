"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bookmark, Calendar, Check, Edit2, List, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs, { Dayjs } from "dayjs";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { isApolloError, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useDispatch } from "react-redux";

import SelectCustomer from "@/components/forms/SelectCustomer";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectProduct from "@/components/forms/SelectProduct";
import SelectShippingModes from "@/components/forms/SelectShippingModes";

import ActionFooter from "@/components/ui/ActionFooter";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import ButtonLoader from "@/components/ui/ButtonLoader";

import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import useWarehouse from "@/hooks/useWarehouse";
import type { ItemDetails } from "@/hooks/useProducts";

import {
  CREATE_CREDIT_INVOICE_MUTATION,
  CREATE_CREDIT_MEMO_MUTATION,
  CREATE_INVOICE_MUTATION,
  CREATE_MEMO_MUTATION,
  EDIT_INVOICE_MUTATION,
  EDIT_MEMO_MUTATION,
  UPDATE_SO_AFTER_INVOICING_MUTATION,
  UPDATE_MEMO_AFTER_INVOICING_MUTATION,
} from "@/lib/graphql/mutations/sales";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { GET_INVOICE_BY_NUMBER_QUERY, GET_MEMO_DETAIL_QUERY, GET_SALES_ORDER_QUERY } from "@/lib/graphql/query/sales";
import { GET_PRODUCT_SETTINGS_INFO_QUERY } from "@/lib/graphql/query/products";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { GET_INVOICE_HOLDS_QUERY } from "@/lib/graphql/query/invoiceHold";
import { SAVE_INVOICE_HOLD_MUTATION, DELETE_INVOICE_HOLD_MUTATION } from "@/lib/graphql/mutations/invoiceHold";
import type { ProductSettingsInfo } from "@/types/product";
import { GET_SHIPPING_MODES_QUERY } from "@/lib/graphql/query/shipping";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import api from "@/lib/axios";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

export type SalesInvoiceFormMode = "NEW_INVOICE" | "CREDIT_INVOICE";

export type SalesDocumentType = "INVOICE" | "MEMO";

const MySwal = withReactContent(Swal);

type SalesInvoiceItemForm = {
  salesorderitemid?: number;
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itempcs?: number;
  itemquantity?: number;
  unitprice?: number;
  discountpercent?: number;
  maxpcs?: number;
  maxqty?: number;
  itemmetal?: string;
  itemunit?: string;
  itempremium?: number;
  broakerage?: number;
  goldprice_used?: number;
  premium_used?: number;
  labour_used?: number;
};

const extractMemoNumber = (raw: unknown): number | undefined => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;

  if (typeof raw === "string") {
    const direct = Number(raw);
    if (Number.isFinite(direct)) return direct;
    try {
      const parsed = JSON.parse(raw);
      return extractMemoNumber(parsed);
    } catch {
      return undefined;
    }
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [obj.memonumber, obj.memoNumber, obj.memo_no, obj.memo, obj.data];
    for (const c of candidates) {
      const found: number | undefined = extractMemoNumber(c);
      if (typeof found === "number") return found;
    }
  }

  return undefined;
};

const extractInvoiceNumber = (raw: unknown): number | undefined => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;

  if (typeof raw === "string") {
    const direct = Number(raw);
    if (Number.isFinite(direct)) return direct;
    try {
      const parsed = JSON.parse(raw);
      return extractInvoiceNumber(parsed);
    } catch {
      return undefined;
    }
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [
      obj.invoicenumber,
      obj.invoiceNumber,
      obj.invoice_no,
      obj.invoice,
      obj.data,
    ];
    for (const c of candidates) {
      const found: number | undefined = extractInvoiceNumber(c);
      if (typeof found === "number") return found;
    }
  }

  return undefined;
};

type SalesInvoiceFormType = {
  storeid: number;
  customerid?: number;
  shiptocustomerid?: number;
  warehouseid?: number;

  saledate: Dayjs;

  termsid?: number;
  invshippingmethod?: number;
  invoicestatusid?: number;

  discountpercent?: number;
  salestaxrate?: number;
  invoicereference?: string;
  orderedby?: string;

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

  shippingdate?: Dayjs;
  shippingtrackingno?: string;
  shipping?: number;

  remarks?: string;

  amountreceived?: number;

  items: SalesInvoiceItemForm[];
};

type ToolItem = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;

  itempcs: number;
  itemquantity: number;
  unitprice: number;
  discountpercent?: number;

  itemmetal?: string;
  itemunit?: string;
  itempremium?: number;
  broakerage?: number;
  goldprice_used?: number;
  premium_used?: number;
  labour_used?: number;
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

function getRateField(metalType: string | undefined): string | undefined {
  if (!metalType) return undefined;
  // Try exact match first
  if (KARAT_RATE_FIELD[metalType]) return KARAT_RATE_FIELD[metalType];
  // Extract karat number from any format: "18K", "18Kt", "18 Karat", "Gold 18kt", "18KT" etc.
  const match = metalType.match(/(\d+)\s*k/i);
  if (match) {
    const kt = parseInt(match[1], 10);
    const key = `${kt}Kt`;
    return KARAT_RATE_FIELD[key];
  }
  return undefined;
}

function calcWtUnitPrice(
  weight: number,
  metalType: string | undefined,
  rates: Record<string, number> | null | undefined,
  premium: number,
  labour: number
): number {
  if (!weight || !metalType || !rates) return 0;
  const rateField = getRateField(metalType);
  const goldRate = rateField ? (rates[rateField] ?? 0) : 0;
  return Math.round((goldRate + premium + labour) * weight * 100) / 100;
}

const computeLine = (item: SalesInvoiceItemForm, mode: SalesInvoiceFormMode) => {
  const qtyRaw = toNum(item.itemquantity);
  const qty = mode === "CREDIT_INVOICE" ? -Math.abs(qtyRaw) : qtyRaw;
  const unit = toNum(item.unitprice);
  const disc = toNum(item.discountpercent);

  const gross = qty * unit;
  const discountAmt = gross * (disc / 100);
  const net = gross - discountAmt;

  return {
    qty,
    unit,
    disc,
    gross,
    discountAmt,
    net,
  };
};

const SalesInvoiceFormV2 = ({
  mode,
  invoiceId,
  documentType = "INVOICE",
  salesorderno: salesordernoFromSO,
  memonumber,
  viewInvoicenumber,
  readOnly = false,
}: {
  mode: SalesInvoiceFormMode;
  invoiceId?: number;
  documentType?: SalesDocumentType;
  salesorderno?: number;
  memonumber?: number;
  viewInvoicenumber?: number;
  readOnly?: boolean;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: 0 },
    skip: !parsedStoreId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;
  const allowPcsEntry = productSettings == null || !!productSettings.allowpcsentry;
  const allowCarriage = productSettings != null && !!productSettings.allowcarriage;
  const [productClearKey, setProductClearKey] = useState(0);

  const handlePrintDocumentNumber = async (documentNumber: number) => {
    if (!parsedStoreId || !documentNumber) return;

    const payload =
      documentType === "MEMO"
        ? {
            storeid: parsedStoreId,
            memonumbers: [documentNumber],
          }
        : {
            storeid: parsedStoreId,
            invoicenumbers: [documentNumber],
          };

    const result = await handleTryCatch(async () => {
      const urlPath =
        documentType === "MEMO" ? "/store/memo/print" : "/store/invoice/print";
      const response = await api.post(urlPath, payload, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      if (data) {
        const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        const filename = documentType === "MEMO" ? `memo-${documentNumber}.pdf` : `invoice-${documentNumber}.pdf`;
        setPdfPreview({ url, filename });
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
      return;
    }

    dispatch(
      showNotification({
        message: documentType === "MEMO" ? "Memo printed successfully" : "Invoice printed successfully",
        type: NOTIFICATION_TYPES.SUCCESS,
      })
    );
  };

  const handleEmailInvoiceNumber = (docNumber: number) => {
    setEmailModalDocNumber(docNumber);
  };

  const currencyFormatter = useMemo(() => {
    if (typeof navigator === "undefined") {
      return {
        formatFixed: (amount: number) => amount.toFixed(2),
      };
    }

    const detected = detectUserCurrency();
    const userLocale = navigator.language || "en-US";
    const formatter = new Intl.NumberFormat(userLocale, {
      style: "currency",
      currency: detected.code,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      formatFixed: (amount: number) => formatter.format(amount),
    };
  }, []);

  const formatMoney = (raw: unknown) => {
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    const safe = Number.isFinite(n) ? n : 0;
    return currencyFormatter.formatFixed(safe);
  };

  const [products, setProducts] = useState<ItemDetails[]>([]);
  const productById = useMemo(() => {
    const map = new Map<number, ItemDetails>();
    products.forEach((p) => map.set(Number(p.itemid), p));
    return map;
  }, [products]);

  const [fetchedInvoiceId, setFetchedInvoiceId] = useState<number | undefined>(undefined);
  const [fetchedBalanceDue, setFetchedBalanceDue] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [emailModalDocNumber, setEmailModalDocNumber] = useState<number | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [emailModalNavigateBack, setEmailModalNavigateBack] = useState(false);
  const [toolItem, setToolItem] = useState<ToolItem>(() => ({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: undefined,
    itemtaxable: undefined,
    itempcs: 0,
    itemquantity: mode === "CREDIT_INVOICE" ? -1 : 1,
    unitprice: 0,
    discountpercent: 0,
  }));

  const [createInvoice, { loading: savingInvoice }] = useMutation(CREATE_INVOICE_MUTATION);
  const [createCreditInvoice, { loading: savingCreditInvoice }] = useMutation(
    CREATE_CREDIT_INVOICE_MUTATION
  );
  const [createMemo, { loading: savingMemo }] = useMutation(CREATE_MEMO_MUTATION);
  const [createCreditMemo, { loading: savingCreditMemo }] = useMutation(
    CREATE_CREDIT_MEMO_MUTATION
  );
  const [editInvoice, { loading: savingEditInvoice }] = useMutation(EDIT_INVOICE_MUTATION);
  const [editMemo, { loading: savingEditMemo }] = useMutation(EDIT_MEMO_MUTATION);
  const [updateSOAfterInvoicing] = useMutation(UPDATE_SO_AFTER_INVOICING_MUTATION);
  const [updateMemoAfterInvoicing] = useMutation(UPDATE_MEMO_AFTER_INVOICING_MUTATION);

  const { data: metalRatesQueryData } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const currentRates = metalRatesQueryData?.getCurrentMetalRates ?? null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const ratesStale = !currentRates || currentRates.ratedate < todayStr;

  const isNewDoc = !invoiceId && !viewInvoicenumber;
  const [showHoldsPanel, setShowHoldsPanel] = useState(false);
  const { data: holdsData, refetch: refetchHolds } = useQuery(GET_INVOICE_HOLDS_QUERY, {
    variables: { storeid: parsedStoreId, outletid: parsedOutletId || 0, doctype: documentType },
    skip: !parsedStoreId || !isNewDoc,
    fetchPolicy: "cache-and-network",
  });
  const activeHolds: any[] = holdsData?.getInvoiceHolds ?? [];
  const [saveHoldMutation, { loading: savingHold }] = useMutation(SAVE_INVOICE_HOLD_MUTATION);
  const [deleteHoldMutation] = useMutation(DELETE_INVOICE_HOLD_MUTATION);

  const saving =
    savingInvoice ||
    savingCreditInvoice ||
    savingEditInvoice ||
    savingEditMemo ||
    savingMemo ||
    savingCreditMemo;

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
  } = useForm<SalesInvoiceFormType>({
    defaultValues: {
      storeid: parsedStoreId,
      customerid: undefined,
      warehouseid: undefined,
      saledate: dayjs(),
      termsid: undefined,
      invshippingmethod: undefined,
      invoicestatusid: undefined,
      discountpercent: 0,
      salestaxrate: 0,
      invoicereference: "",
      orderedby: "",
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
      shippingdate: undefined,
      shippingtrackingno: "",
      shipping: 0,
      remarks: "",
      amountreceived: 0.0,
      items: [],
    },
    mode: "all",
  });

  const { fields: itemFields, append, remove, update, replace } = useFieldArray({
    control,
    name: "items",
  });

  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();
  useEffect(() => {
    if (parsedStoreId) fetchWarehouseByStoreId(parsedStoreId);
  }, [fetchWarehouseByStoreId, parsedStoreId]);

  const currentWarehouse = useMemo(
    () => warehouses.find((w) => w.issystem) ?? warehouses[0],
    [warehouses]
  );

  useEffect(() => {
    if (!warehouses?.length) return;
    const current = getValues("warehouseid");
    if (Number.isFinite(Number(current)) && Number(current) > 0) return;

    const selected = currentWarehouse;
    if (selected?.warehouseid) {
      setValue("warehouseid", Number(selected.warehouseid), {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [currentWarehouse, getValues, setValue, warehouses]);

  // Load sales order data for pre-population when creating invoice from SO
  const { data: soQueryData, error: soQueryError, loading: soQueryLoading, refetch: refetchSO } = useQuery(GET_SALES_ORDER_QUERY, {
    variables: { storeid: parsedStoreId, salesorderno: salesordernoFromSO },
    skip: !salesordernoFromSO || !parsedStoreId,
    fetchPolicy: "network-only",
  });

  // Auto-retry on transient connection errors (race condition during navigation)
  useEffect(() => {
    if (!soQueryError || !salesordernoFromSO) return;
    const t = setTimeout(() => refetchSO(), 600);
    return () => clearTimeout(t);
  }, [soQueryError, salesordernoFromSO, refetchSO]);

  // Load memo data for pre-population when creating invoice from memo
  const { data: memoQueryData, error: memoQueryError, loading: memoQueryLoading, refetch: refetchMemo } = useQuery(GET_MEMO_DETAIL_QUERY, {
    variables: { storeid: parsedStoreId, memonumber },
    skip: !memonumber || !parsedStoreId,
    fetchPolicy: "network-only",
  });

  // Load invoice data for view/edit mode
  const { data: viewInvoiceQueryData, loading: viewInvoiceQueryLoading } = useQuery(GET_INVOICE_BY_NUMBER_QUERY, {
    variables: { storeid: parsedStoreId, invoicenumber: viewInvoicenumber },
    skip: !viewInvoicenumber || !parsedStoreId || documentType === "MEMO",
    fetchPolicy: "network-only",
  });

  // Load memo data for view/edit mode
  const { data: viewMemoQueryData, loading: viewMemoQueryLoading } = useQuery(GET_MEMO_DETAIL_QUERY, {
    variables: { storeid: parsedStoreId, memonumber: viewInvoicenumber },
    skip: !viewInvoicenumber || !parsedStoreId || documentType === "INVOICE",
    fetchPolicy: "network-only",
  });

  const viewQueryLoading = documentType === "MEMO" ? viewMemoQueryLoading : viewInvoiceQueryLoading;

  const { data: shippingModesData } = useQuery(GET_SHIPPING_MODES_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  // Auto-retry on transient connection errors (race condition during navigation)
  useEffect(() => {
    if (!memoQueryError || !memonumber) return;
    const t = setTimeout(() => refetchMemo(), 600);
    return () => clearTimeout(t);
  }, [memoQueryError, memonumber, refetchMemo]);

  useEffect(() => {
    const so = soQueryData?.getSalesOrder;
    if (!so) return;
    const toNum = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
    reset({
      storeid: parsedStoreId,
      customerid: so.customerid ? Number(so.customerid) : undefined,
      warehouseid: so.warehouseid ?? undefined,
      saledate: dayjs(),
      termsid: so.termsid ?? undefined,
      invshippingmethod: so.invshippingmethod ? Number(so.invshippingmethod) : undefined,
      discountpercent: toNum(so.discountpercent),
      salestaxrate: toNum(so.salestaxrate),
      invoicereference: so.salesorderno ? String(so.salesorderno) : "",
      orderedby: so.orderedby ?? "",
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
      shippingdate: undefined,
      shippingtrackingno: "",
      shipping: toNum(so.shipping),
      remarks: so.remarks ?? "",
      amountreceived: 0,
      items: (so.items ?? [])
        .map((it: any) => {
          const availQty = toNum(it.bordqty) > 0 ? toNum(it.bordqty) : Math.max(0, toNum(it.itemquantity) - toNum(it.invoiceqty));
          const availPcs = toNum(it.bordpcs) > 0 ? toNum(it.bordpcs) : Math.max(0, toNum(it.itempcs) - toNum(it.invoicepcs));
          return {
            salesorderitemid: it.salesorderitemid,
            itemid: it.itemid ? Number(it.itemid) : undefined,
            itemcode: it.itemcode,
            itemdescription: it.itemdescription,
            itemtaxable: toNum(it.itemtaxable),
            itempcs: availPcs,
            itemquantity: availQty,
            unitprice: toNum(it.unitprice),
            discountpercent: toNum(it.discountpercent),
            maxpcs: availPcs,
            maxqty: availQty,
          };
        })
        .filter((it: SalesInvoiceItemForm) => (it.maxqty ?? 0) > 0 || (it.maxpcs ?? 0) > 0),
    });
  }, [soQueryData, parsedStoreId, reset]);

  useEffect(() => {
    const memo = memoQueryData?.getMemoDetail;
    if (!memo) return;
    const toNum = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
    reset({
      storeid: parsedStoreId,
      customerid: memo.customerid ? Number(memo.customerid) : undefined,
      warehouseid: memo.warehouseid ?? undefined,
      saledate: dayjs(),
      termsid: memo.termsid ?? undefined,
      invshippingmethod: memo.invshippingmethod ? Number(memo.invshippingmethod) : undefined,
      discountpercent: toNum(memo.discountpercent),
      salestaxrate: toNum(memo.salestaxrate),
      invoicereference: memo.memonumber ? String(memo.memonumber) : "",
      orderedby: "",
      shipSameAsBill: false,
      invbilltocompanyname: memo.invbilltocompanyname ?? "",
      invbilltoadd1: memo.invbilltoadd1 ?? "",
      invbilltocity: memo.invbilltocity ?? "",
      invbilltostate: memo.invbilltostate ?? "",
      invbilltozip: memo.invbilltozip ?? "",
      invbilltophone: memo.invbilltophone ?? "",
      invshiptocompanyname: memo.invshiptocompanyname ?? "",
      invshiptoadd1: memo.invshiptoadd1 ?? "",
      invshiptocity: memo.invshiptocity ?? "",
      invshiptostate: memo.invshiptostate ?? "",
      invshiptozip: memo.invshiptozip ?? "",
      invshiptophone: memo.invshiptophone ?? "",
      shippingdate: undefined,
      shippingtrackingno: "",
      shipping: toNum(memo.shipping),
      remarks: memo.remarks ?? "",
      amountreceived: 0,
      items: (memo.items ?? [])
        .map((it: any) => ({
          salesorderitemid: it.invoiceitemid,
          itemid: it.itemid ? Number(it.itemid) : undefined,
          itemcode: it.itemcode,
          itemdescription: it.itemdescription,
          itemtaxable: toNum(it.itemtaxable),
          itempcs: toNum(it.memopcsremain),
          itemquantity: toNum(it.memoqtyremain),
          unitprice: toNum(it.unitprice),
          discountpercent: toNum(it.discountpercent),
          maxpcs: toNum(it.memopcsremain),
          maxqty: toNum(it.memoqtyremain),
        }))
        .filter((it: any) => (it.maxqty ?? 0) > 0 || (it.maxpcs ?? 0) > 0),
    });
  }, [memoQueryData, parsedStoreId, reset]);

  // Pre-populate form when viewing/editing an existing invoice
  useEffect(() => {
    const doc = viewInvoiceQueryData?.getInvoiceByNumber;
    if (!doc) return;
    if (doc.invoiceid) setFetchedInvoiceId(Number(doc.invoiceid));
    const toNum = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
    setFetchedBalanceDue(toNum(doc.balancedue));
    reset({
      storeid: parsedStoreId,
      customerid: doc.customerid ? Number(doc.customerid) : undefined,
      warehouseid: doc.warehouseid ?? undefined,
      saledate: dayjs(),
      termsid: doc.termsid ?? undefined,
      invshippingmethod: doc.invshippingmethod ? Number(doc.invshippingmethod) : undefined,
      discountpercent: toNum(doc.discountpercent),
      salestaxrate: toNum(doc.salestaxrate),
      invoicereference: "",
      orderedby: "",
      shipSameAsBill: false,
      invbilltocompanyname: doc.invbilltocompanyname ?? "",
      invbilltoadd1: doc.invbilltoadd1 ?? "",
      invbilltocity: doc.invbilltocity ?? "",
      invbilltostate: doc.invbilltostate ?? "",
      invbilltozip: doc.invbilltozip ?? "",
      invbilltophone: doc.invbilltophone ?? "",
      invshiptocompanyname: doc.invshiptocompanyname ?? "",
      invshiptoadd1: doc.invshiptoadd1 ?? "",
      invshiptocity: doc.invshiptocity ?? "",
      invshiptostate: doc.invshiptostate ?? "",
      invshiptozip: doc.invshiptozip ?? "",
      invshiptophone: doc.invshiptophone ?? "",
      shippingdate: undefined,
      shippingtrackingno: "",
      shipping: toNum(doc.shipping),
      remarks: doc.remarks ?? "",
      amountreceived: toNum(doc.amountreceived),
      items: (doc.items ?? []).map((it: any) => ({
        itemid: it.itemid ? Number(it.itemid) : undefined,
        itemcode: it.itemcode,
        itemdescription: it.itemdescription,
        itemtaxable: toNum(it.itemtaxable),
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
      })),
    });
  }, [viewInvoiceQueryData, parsedStoreId, reset]);

  // Pre-populate form when viewing/editing an existing memo
  useEffect(() => {
    const doc = viewMemoQueryData?.getMemoDetail;
    if (!doc) return;
    const toNum = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
    setFetchedBalanceDue(toNum(doc.balancedue));
    reset({
      storeid: parsedStoreId,
      customerid: doc.customerid ? Number(doc.customerid) : undefined,
      warehouseid: doc.warehouseid ?? undefined,
      saledate: dayjs(),
      termsid: doc.termsid ?? undefined,
      invshippingmethod: doc.invshippingmethod ? Number(doc.invshippingmethod) : undefined,
      discountpercent: toNum(doc.discountpercent),
      salestaxrate: toNum(doc.salestaxrate),
      invoicereference: "",
      orderedby: "",
      shipSameAsBill: false,
      invbilltocompanyname: doc.invbilltocompanyname ?? "",
      invbilltoadd1: doc.invbilltoadd1 ?? "",
      invbilltocity: doc.invbilltocity ?? "",
      invbilltostate: doc.invbilltostate ?? "",
      invbilltozip: doc.invbilltozip ?? "",
      invbilltophone: doc.invbilltophone ?? "",
      invshiptocompanyname: doc.invshiptocompanyname ?? "",
      invshiptoadd1: doc.invshiptoadd1 ?? "",
      invshiptocity: doc.invshiptocity ?? "",
      invshiptostate: doc.invshiptostate ?? "",
      invshiptozip: doc.invshiptozip ?? "",
      invshiptophone: doc.invshiptophone ?? "",
      shippingdate: undefined,
      shippingtrackingno: "",
      shipping: toNum(doc.shipping),
      remarks: doc.remarks ?? "",
      amountreceived: toNum(doc.amountreceived),
      items: (doc.items ?? []).map((it: any) => ({
        itemid: it.itemid ? Number(it.itemid) : undefined,
        itemcode: it.itemcode,
        itemdescription: it.itemdescription,
        itemtaxable: toNum(it.itemtaxable),
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
      })),
    });
  }, [viewMemoQueryData, parsedStoreId, reset]);

  const watchedWarehouseId = watch("warehouseid");
  const parsedWarehouseId = useMemo(() => {
    const n = typeof watchedWarehouseId === "number" ? watchedWarehouseId : Number(watchedWarehouseId);
    return Number.isFinite(n) ? n : undefined;
  }, [watchedWarehouseId]);

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

  const watchedTrackingNo = watch("shippingtrackingno");
  const watchedShippingMethod = watch("invshippingmethod");
  useEffect(() => {
    if (readOnly || documentType !== "INVOICE") return;
    if (viewInvoicenumber && !isDirty) return;
    const shippingName =
      shippingModesData?.getShippingModes?.find(
        (m: { shippingid: number; shippingname: string }) => m.shippingid === watchedShippingMethod
      )?.shippingname ?? "";
    if (watchedTrackingNo?.trim()) {
      setValue("invoicestatusid", 5);
    } else if (shippingName.toLowerCase().includes("pickup")) {
      setValue("invoicestatusid", 7);
    } else if (!viewInvoicenumber) {
      setValue("invoicestatusid", 2);
    }
  }, [watchedTrackingNo, watchedShippingMethod, shippingModesData, setValue, readOnly, documentType, viewInvoicenumber, isDirty]);

  useEffect(() => {
    if (!shipSameAsBill) return;
    const billId = getValues("customerid");
    const shipId = getValues("shiptocustomerid");
    if (!billId || !shipId) return;
    if (Number(billId) === Number(shipId)) return;

    setValue("shipSameAsBill", false, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [customerId, getValues, setValue, shipSameAsBill, shipToCustomerId]);

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
    if (typeof c.custshippingmethod !== "undefined") {
      const parsed = Number(c.custshippingmethod);
      if (Number.isFinite(parsed)) setValue("invshippingmethod", parsed);
    }

    if (shipSameAsBill) {
      setValue("shiptocustomerid", customerId, {
        shouldDirty: false,
        shouldTouch: false,
      });
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

    setValue("shiptocustomerid", getValues("customerid"), {
      shouldDirty: false,
      shouldTouch: false,
    });
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
  const watchedSalesTaxRate = useWatch({ control, name: "salestaxrate" });
  const watchedShipping = useWatch({ control, name: "shipping" });
  const watchedAmountReceived = useWatch({ control, name: "amountreceived" });

  const invoiceDiscountPrefill = useMemo(() => {
    const n = toNum(watchedDiscountPercent);
    const clamped = Math.min(100, Math.max(0, n));
    return Math.round(clamped * 1000) / 1000;
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

    const lines = items.map((it) => computeLine(it, mode));
    const grossTotal = lines.reduce((acc, l) => acc + l.gross, 0);
    const lineDiscountTotal = lines.reduce((acc, l) => acc + l.discountAmt, 0);
    const afterLineDiscount = grossTotal - lineDiscountTotal;
    const invoiceDiscountAmt = afterLineDiscount * (discountPercent / 100);
    const discountAmount = lineDiscountTotal + invoiceDiscountAmt;
    const subtotal = grossTotal - discountAmount;

    const totalPcs = items.reduce((acc, it) => acc + toNum(it.itempcs), 0);

    const taxableSale = items.reduce((acc, it) => {
      if (toNum(it.itemtaxable) !== 1) return acc;
      return acc + computeLine(it, mode).net;
    }, 0);

    const shipping = toNum(watchedShipping);
    const taxRate = toNum(watchedSalesTaxRate);
    const salesTax = Math.round(taxableSale * (taxRate / 100) * 100) / 100;
    const invoiceTotal = subtotal + salesTax + shipping;

    const amountPaid = toNum(watchedAmountReceived);
    const balanceDue = invoiceTotal - amountPaid;
    const nonTaxableSale = items.reduce((acc, it) => {
      if (toNum(it.itemtaxable) === 1) return acc;
      return acc + computeLine(it, mode).net;
    }, 0);

    return {
      totalItems: items.length,
      totalPcs,
      grossTotal,
      discountAmount,
      subtotal,
      salesTax,
      shipping,
      invoiceTotal,
      amountPaid,
      balanceDue,
      taxableSale,
      nonTaxableSale,
    };
  }, [mode, watchedAmountReceived, watchedDiscountPercent, watchedSalesTaxRate, watchedItems, watchedShipping]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined,
      itemcode: undefined,
      itemdescription: undefined,
      itemtaxable: undefined,
      itempcs: 0,
      itemquantity: mode === "CREDIT_INVOICE" ? -1 : 1,
      unitprice: 0,
      discountpercent: invoiceDiscountPrefill,
    });
  };

  const autoAddItem = (selected: ItemDetails) => {
    const itemid = Number(selected.itemid);
    const discountPct = Math.min(100, Math.max(0, Number(watch("discountpercent") || 0)));
    const currentItems: SalesInvoiceItemForm[] = getValues("items") || [];
    const dupIndex = currentItems.findIndex((it) => Number(it.itemid) === itemid);

    if (dupIndex >= 0) {
      const existing = currentItems[dupIndex];
      const existingQty = Number(existing.itemquantity || 0);
      update(dupIndex, {
        ...existing,
        itemquantity: mode === "CREDIT_INVOICE" ? existingQty - 1 : existingQty + 1,
      });
    } else {
      const isWt = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
      const initQty = mode === "CREDIT_INVOICE" ? -1 : 1;
      const premium = Number(selected.itempremium || 0);
      const labour = Number(selected.broakerage || 0);
      const goldRate = isWt && currentRates ? ((getRateField(selected.itemmetal) ? (currentRates[getRateField(selected.itemmetal)!] ?? 0) : 0)) : 0;
      const unitprice = isWt
        ? calcWtUnitPrice(Math.abs(initQty), selected.itemmetal, currentRates, premium, labour)
        : Number(selected.itemsellprice || 0);
      append({
        itemid,
        itemcode: selected.itemcode,
        itemdescription: selected.itemdescription,
        itemtaxable: toNum(selected.itemtaxable),
        itempcs: 0,
        itemquantity: initQty,
        unitprice,
        discountpercent: discountPct,
        itemmetal: selected.itemmetal,
        itemunit: selected.itemunit,
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

  const handleSaveToolItem = () => {
    const customerIdNumber = Number(getValues("customerid"));
    if (!Number.isFinite(customerIdNumber) || customerIdNumber <= 0) {
      dispatch(
        showNotification({
          message: "Bill To customer is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const warehouseIdNumber = Number(getValues("warehouseid"));
    if (!Number.isFinite(warehouseIdNumber) || warehouseIdNumber <= 0) {
      dispatch(
        showNotification({
          message: "Warehouse is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!toolItem.itemid) {
      dispatch(
        showNotification({
          message: "Product is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const qtyAbs = Math.abs(Number(toolItem.itemquantity || 0));
    if (!Number.isFinite(qtyAbs) || qtyAbs <= 0) {
      dispatch(
        showNotification({
          message: "Quantity is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const normalizedQty = mode === "CREDIT_INVOICE" ? -qtyAbs : qtyAbs;
    const unitPrice = Math.max(0, Number(toolItem.unitprice || 0));
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      dispatch(
        showNotification({
          message: "Unit Price is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const discountPctRaw = Number(toolItem.discountpercent || 0);
    const discountPct = Math.min(100, Math.max(0, discountPctRaw));

    const nextItem: SalesInvoiceItemForm = {
      itemid: Number(toolItem.itemid),
      itemcode: toolItem.itemcode,
      itemdescription: toolItem.itemdescription,
      itemtaxable: toNum(toolItem.itemtaxable),
      itempcs: toNum(toolItem.itempcs),
      itemquantity: normalizedQty,
      unitprice: unitPrice,
      discountpercent: discountPct,
      itemmetal: toolItem.itemmetal,
      itemunit: toolItem.itemunit,
      itempremium: toolItem.itempremium,
      broakerage: toolItem.broakerage,
      goldprice_used: toolItem.goldprice_used,
      premium_used: toolItem.premium_used,
      labour_used: toolItem.labour_used,
    };

    if (editingIndex == null) {
      append(nextItem);
    } else {
      const existingItem = getValues(`items.${editingIndex}`);
      update(editingIndex, {
        ...nextItem,
        salesorderitemid: (existingItem as any)?.salesorderitemid,
        maxpcs: (existingItem as any)?.maxpcs,
        maxqty: (existingItem as any)?.maxqty,
      });
      setEditingIndex(null);
    }

    resetToolItem();
  };

  const onSubmit: SubmitHandler<SalesInvoiceFormType> = async (formData) => {
    const warehouseId = Number(formData.warehouseid);
    if (!parsedStoreId || !warehouseId) return;

    const hasWtItems = (formData.items || []).some((it) => (it.itemunit ?? "").toLowerCase() === "wt");

    const items = (formData.items || []).map((it) => {
      const { qty, unit, disc, gross, discountAmt, net } = computeLine(it, mode);
      const taxable = toNum(it.itemtaxable);
      return {
        itemid: it.itemid ? Number(it.itemid) : undefined,
        itemcode: it.itemcode,
        itemdescription: it.itemdescription,
        itempcs: toNum(it.itempcs),
        itemquantity: qty,
        unitprice: unit,
        discountpercent: disc,
        extendedprice: net,
        itemactualsale: gross,
        itemtaxablesale: taxable === 1 ? net : 0,
        itemnontaxablesale: taxable === 1 ? 0 : net,
        itemtaxable: taxable,
        warehouseid: warehouseId,
        goldprice_used: it.goldprice_used ?? undefined,
        premium_used: it.premium_used ?? undefined,
        labour_used: it.labour_used ?? undefined,
      };
    });

    const payload = {
      storeid: parsedStoreId,
      customerid: formData.customerid ? Number(formData.customerid) : undefined,
      warehouseid: warehouseId,

      saledate: formData.saledate?.toISOString?.(),

      invoicestatusid: formData.invoicestatusid ? Number(formData.invoicestatusid) : undefined,
      termsid: formData.termsid ? Number(formData.termsid) : undefined,
      invshippingmethod:
        typeof formData.invshippingmethod !== "undefined"
          ? String(formData.invshippingmethod)
          : undefined,

      discountpercent: toNum(formData.discountpercent),

      invoicereference: formData.invoicereference,
      remarks: formData.remarks,

      invbilltocompanyname: formData.invbilltocompanyname,
      invbilltoadd1: formData.invbilltoadd1,
      invbilltocity: formData.invbilltocity,
      invbilltostate: formData.invbilltostate,
      invbilltozip: formData.invbilltozip,
      invbilltophone: formData.invbilltophone,

      invshiptocompanyname: formData.invshiptocompanyname,
      invshiptoadd1: formData.invshiptoadd1,
      invshiptocity: formData.invshiptocity,
      invshiptostate: formData.invshiptostate,
      invshiptozip: formData.invshiptozip,
      invshiptophone: formData.invshiptophone,

      shippingtrackingno: formData.shippingtrackingno,
      shippingdate: formData.shippingdate?.toISOString?.(),
      shipping: toNum(formData.shipping),

      totalamount: totals.grossTotal,
      discountamount: totals.discountAmount,
      subtotal: totals.subtotal,
      salestax: totals.salesTax,
      salestaxrate: toNum(formData.salestaxrate),
      netamount: totals.invoiceTotal,
      amountreceived: totals.amountPaid,
      balancedue: totals.balanceDue,

      taxablesale: totals.taxableSale,
      nontaxablesale: totals.nonTaxableSale,

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

      items,
    };

    const resolvedInvoiceId = fetchedInvoiceId ?? invoiceId;
    const isEdit =
      documentType === "INVOICE" &&
      typeof resolvedInvoiceId === "number" &&
      Number.isFinite(resolvedInvoiceId) &&
      resolvedInvoiceId > 0;

    const isMemoEdit =
      documentType === "MEMO" &&
      typeof viewInvoicenumber === "number" &&
      Number.isFinite(viewInvoicenumber) &&
      viewInvoicenumber > 0 &&
      !readOnly;

    let result:
      | Awaited<ReturnType<typeof createCreditMemo>>
      | Awaited<ReturnType<typeof createMemo>>
      | Awaited<ReturnType<typeof editInvoice>>
      | Awaited<ReturnType<typeof editMemo>>
      | Awaited<ReturnType<typeof createCreditInvoice>>
      | Awaited<ReturnType<typeof createInvoice>>;

    try {
      result =
        documentType === "MEMO"
          ? isMemoEdit
            ? await editMemo({
                variables: {
                  input: {
                    ...payload,
                    memoid: Number(viewInvoicenumber),
                  },
                },
              })
            : mode === "CREDIT_INVOICE"
              ? await createCreditMemo({ variables: { input: payload } })
              : await createMemo({ variables: { input: payload } })
          : isEdit
            ? await editInvoice({
                variables: {
                  input: {
                    ...payload,
                    invoiceid: Number(resolvedInvoiceId),
                  },
                },
              })
            : mode === "CREDIT_INVOICE"
              ? await createCreditInvoice({ variables: { input: payload } })
              : await createInvoice({ variables: { input: payload } });
    } catch (err: unknown) {
      const fallback = isEdit || isMemoEdit ? "Failed to save changes" : documentType === "MEMO" ? "Failed to create memo" : "Failed to create invoice";

      let message = fallback;
      if (err instanceof Error && isApolloError(err)) {
        const graphQlMsg = err.graphQLErrors?.map((e) => e.message).filter(Boolean).join("\n");
        const networkMsg = (err.networkError as { message?: string } | null | undefined)?.message;
        message = graphQlMsg || networkMsg || err.message || fallback;
      } else if (err instanceof Error) {
        message = err.message || fallback;
      }

      dispatch(
        showNotification({
          message,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const response =
      documentType === "MEMO"
        ? isMemoEdit
          ? result?.data?.editMemo
          : mode === "CREDIT_INVOICE"
            ? result?.data?.createCreditMemo
            : result?.data?.createMemo
        : isEdit
          ? result?.data?.editInvoice
          : mode === "CREDIT_INVOICE"
            ? result?.data?.createCreditInvoice
            : result?.data?.createInvoice;

    if (response?.success) {
      // Update SO items and status after successful invoice creation from SO
      if (salesordernoFromSO && documentType === "INVOICE" && !isEdit) {
        const soItems = formData.items
          .filter((it) => (it as any).salesorderitemid)
          .map((it) => ({
            salesorderitemid: (it as any).salesorderitemid as number,
            invoicedpcs: Math.abs(toNum(it.itempcs)),
            invoicedqty: Math.abs(toNum(it.itemquantity)),
          }));
        if (soItems.length > 0) {
          try {
            await updateSOAfterInvoicing({
              variables: {
                input: {
                  storeid: parsedStoreId,
                  salesorderno: salesordernoFromSO,
                  items: soItems,
                },
              },
            });
          } catch (_) {
            // Non-fatal â€" invoice was already created
          }
        }
      }

      // Update memo item quantities after successful invoice creation from memo
      if (memonumber && documentType === "INVOICE" && !isEdit) {
        const memoItems = formData.items
          .filter((it) => (it as any).salesorderitemid)
          .map((it) => ({
            invoiceitemid: (it as any).salesorderitemid as number,
            invoicedpcs: Math.abs(toNum(it.itempcs)),
            invoicedqty: Math.abs(toNum(it.itemquantity)),
          }));
        if (memoItems.length > 0) {
          try {
            await updateMemoAfterInvoicing({
              variables: {
                input: {
                  storeid: parsedStoreId,
                  memonumber,
                  items: memoItems,
                },
              },
            });
          } catch (_) {
            // Non-fatal â€" invoice was already created
          }
        }
      }

      const documentNumber =
        documentType === "MEMO"
          ? (extractMemoNumber(response?.data) ?? (isMemoEdit ? viewInvoicenumber : undefined))
          : (extractInvoiceNumber(response?.data) ?? (isEdit ? viewInvoicenumber : undefined));
      const label = documentNumber ? `#${documentNumber}` : "";
      const docLabel =
        documentType === "MEMO"
          ? mode === "CREDIT_INVOICE"
            ? "Credit Memo"
            : "Memo"
          : "Invoice";

      const popupResult = await MySwal.fire({
        icon: "success",
        title: `${docLabel} Saved`,
        html: `<div class="text-muted" style="font-size: 0.95rem; line-height: 1.35;">${docLabel} ${label} saved successfully.</div>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Print",
        denyButtonText: "Email",
        cancelButtonText: "Close",
        showCloseButton: true,
      });

      if (popupResult.isConfirmed && documentNumber) {
        await handlePrintDocumentNumber(documentNumber);
      }

      dispatch(
        showNotification({
          message: response?.message || `${docLabel} saved successfully`,
          type: NOTIFICATION_TYPES.SUCCESS,
        })
      );

      if (popupResult.isDenied && documentNumber) {
        setEmailModalDocNumber(documentNumber);
        setEmailModalNavigateBack(true);
        reset();
        return;
      }

      reset();
      router.back();
      return;
    }

    dispatch(
      showNotification({
        message:
          response?.error ||
          response?.message ||
          (documentType === "MEMO" ? "Failed to create memo" : "Failed to create invoice"),
        type: NOTIFICATION_TYPES.ERROR,
      })
    );
  };

  const shipToCompanyName = watch("invshiptocompanyname") || "";
  const billToAddress = watch("invbilltoadd1") || "";
  const shipToAddress = watch("invshiptoadd1") || "";

  // Show loader while SO data is being fetched / retrying
  if (salesordernoFromSO && (soQueryLoading || (soQueryError && !soQueryData))) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-3" />
        <span className="text-muted">Loading sales order details...</span>
      </div>
    );
  }

  if (viewInvoicenumber && viewQueryLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-3" />
        <span className="text-muted">Loading details...</span>
      </div>
    );
  }

  const handleHold = async () => {
    const formValues = getValues();
    const hasItems = (formValues.items ?? []).length > 0;
    if (!hasItems) {
      Swal.fire({ icon: "info", title: "Nothing to hold", text: "Add at least one item before holding.", timer: 2000, showConfirmButton: false });
      return;
    }
    const customerName = formValues.invbilltocompanyname ?? "";
    const itemCount = formValues.items.length;
    const autoName = [customerName, `${itemCount} item${itemCount !== 1 ? "s" : ""}`].filter(Boolean).join(" — ");
    const { value: holdName, isConfirmed } = await Swal.fire({
      title: "Hold Invoice",
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
      saledate: formValues.saledate ? (formValues.saledate as any).toISOString?.() ?? String(formValues.saledate) : null,
      shippingdate: formValues.shippingdate ? (formValues.shippingdate as any).toISOString?.() ?? String(formValues.shippingdate) : null,
    };
    try {
      await saveHoldMutation({
        variables: {
          input: {
            storeid: parsedStoreId,
            outletid: parsedOutletId || 0,
            doctype: documentType,
            holdname: holdName || autoName,
            customerid: formValues.customerid ?? null,
            formdata: holdData,
          },
        },
      });
      reset();
      refetchHolds();
      Swal.fire({ icon: "success", title: "Invoice held", text: "You can resume it from the Held Invoices panel.", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire("Error", "Failed to save hold. Please try again.", "error");
    }
  };

  const handleResumeHold = async (hold: any) => {
    const fd = hold.formdata ?? {};
    reset({
      ...fd,
      saledate: fd.saledate ? dayjs(fd.saledate) : dayjs(),
      shippingdate: fd.shippingdate ? dayjs(fd.shippingdate) : undefined,
    });
    await deleteHoldMutation({ variables: { holdid: hold.holdid, storeid: parsedStoreId } });
    refetchHolds();
    setShowHoldsPanel(false);
  };

  const handleDeleteHold = async (holdid: number) => {
    const result = await Swal.fire({
      title: "Discard hold?",
      text: "This hold will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Discard",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    await deleteHoldMutation({ variables: { holdid, storeid: parsedStoreId } });
    refetchHolds();
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>
      {readOnly && (
        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2">
          <strong>View Only</strong> â€" this record is displayed in read-only mode.
        </div>
      )}

      {/* HELD INVOICES PANEL */}
      {isNewDoc && activeHolds.length > 0 && (
        <div className="card mb-3" style={{ border: "1px solid #f59e0b" }}>
          <div
            className="card-header d-flex align-items-center justify-content-between py-2 px-3"
            style={{ background: "#fffbeb", cursor: "pointer", borderBottom: showHoldsPanel ? "1px solid #f59e0b" : "none" }}
            onClick={() => setShowHoldsPanel((v) => !v)}
          >
            <div className="d-flex align-items-center gap-2">
              <Bookmark size={14} style={{ color: "#d97706" }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: "#92400e" }}>
                Held {documentType === "MEMO" ? "Memos" : "Invoices"} ({activeHolds.length})
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#b45309" }}>{showHoldsPanel ? "▲ Hide" : "▼ Show"}</span>
          </div>
          {showHoldsPanel && (
            <div className="card-body p-0">
              <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                <thead style={{ background: "#fef3c7" }}>
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Held At</th>
                    <th className="py-2" style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {activeHolds.map((hold: any) => (
                    <tr key={hold.holdid} style={{ borderBottom: "1px solid #fde68a" }}>
                      <td className="px-3 fw-semibold" style={{ color: "#1e293b" }}>
                        {hold.holdname || `Hold #${hold.holdid}`}
                      </td>
                      <td style={{ color: "#475569" }}>
                        {hold.formdata?.invbilltocompanyname || "—"}
                      </td>
                      <td style={{ color: "#94a3b8" }}>
                        {hold.createdat ? new Date(hold.createdat).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            style={{ fontSize: 11, padding: "2px 10px" }}
                            onClick={() => handleResumeHold(hold)}
                          >
                            Resume
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            style={{ fontSize: 11, padding: "2px 10px" }}
                            onClick={() => handleDeleteHold(hold.holdid)}
                          >
                            Discard
                          </button>
                        </div>
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

      {/* â"€â"€ HEADER STRIP â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-4 align-items-start">
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Date</div>
              <Controller
                name="saledate"
                control={control}
                rules={{ required: "Create Date is required" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={(date) => field.onChange(date ?? dayjs())}
                    className="filterdatepicker"
                    style={{ width: 160 }}
                    format="DD-MM-YYYY"
                    placeholder="Choose Date"
                    allowClear
                  />
                )}
              />
            </div>

            <div className="vr align-self-stretch" />

            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Warehouse</div>
              <div className="fw-semibold">{currentWarehouse?.warehousename || <span className="text-muted">â€"</span>}</div>
              <input type="hidden" {...register("warehouseid", { valueAsNumber: true, required: true, min: 1 })} />
            </div>

            <div className="vr align-self-stretch" />

            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                {documentType === "MEMO" ? "Memo #" : "Invoice #"}
              </div>
              <div className="text-muted fst-italic">Auto-assigned</div>
            </div>

            {watch("invbilltocompanyname") && (
              <>
                <div className="vr align-self-stretch" />
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Bill To</div>
                  <div className="fw-semibold">{watch("invbilltocompanyname")}</div>
                  <div className="text-muted small">
                    {watch("invbilltocity")}{watch("invbilltostate") ? `, ${watch("invbilltostate")}` : ""}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* â"€â"€ CUSTOMERS + ORDER DETAILS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">

            {/* Bill To */}
            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Bill To <span className="text-danger">*</span></div>
                <div className="mb-2">
                  <Controller
                    name="customerid"
                    control={control}
                    rules={{ required: "Bill To customer is required" }}
                    render={({ field }) => (
                      <SelectCustomer trigger={trigger} storeId={parsedStoreId} {...field} />
                    )}
                  />
                </div>
                <div className="text-muted small lh-lg mt-2">
                  {watch("invbilltoadd1") && <div>{watch("invbilltoadd1")}</div>}
                  {(watch("invbilltocity") || watch("invbilltostate")) && (
                    <div>
                      {watch("invbilltocity")}
                      {watch("invbilltostate") ? `, ${watch("invbilltostate")}` : ""}
                      {watch("invbilltozip") ? ` ${watch("invbilltozip")}` : ""}
                    </div>
                  )}
                  {watch("invbilltophone") && <div>{watch("invbilltophone")}</div>}
                </div>
                <input type="hidden" {...register("invbilltoadd1")} />
                <input type="hidden" {...register("invbilltocity")} />
                <input type="hidden" {...register("invbilltostate")} />
                <input type="hidden" {...register("invbilltozip")} />
                <input type="hidden" {...register("invbilltophone")} />
              </div>
            </div>

            {/* Ship To */}
            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="text-uppercase fw-semibold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>Ship To</div>
                  <label className="d-flex align-items-center gap-2 m-0 small text-muted" style={{ cursor: "pointer" }}>
                    <input type="checkbox" {...register("shipSameAsBill")} />
                    Same as Bill To
                  </label>
                </div>
                {shipSameAsBill ? (
                  <>
                    <div className="text-muted small lh-lg mt-2">
                      {watch("invbilltocompanyname") && <div className="fw-semibold text-body">{watch("invbilltocompanyname")}</div>}
                      {watch("invbilltoadd1") && <div>{watch("invbilltoadd1")}</div>}
                      {(watch("invbilltocity") || watch("invbilltostate")) && (
                        <div>
                          {watch("invbilltocity")}
                          {watch("invbilltostate") ? `, ${watch("invbilltostate")}` : ""}
                          {watch("invbilltozip") ? ` ${watch("invbilltozip")}` : ""}
                        </div>
                      )}
                      {watch("invbilltophone") && <div>{watch("invbilltophone")}</div>}
                    </div>
                    {!watch("invbilltocompanyname") && (
                      <div className="text-muted small fst-italic">Select a Bill To customer to see address</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      <Controller
                        name="shiptocustomerid"
                        control={control}
                        render={({ field }) => (
                          <SelectCustomer trigger={trigger} storeId={parsedStoreId} {...field} />
                        )}
                      />
                    </div>
                    <div className="row g-1 mt-1">
                      <div className="col-12">
                        <input type="text" className="form-control form-control-sm" placeholder="Company"
                          value={shipToCompanyName} onChange={(e) => setValue("invshiptocompanyname", e.target.value)} />
                      </div>
                      <div className="col-12">
                        <input type="text" className="form-control form-control-sm" placeholder="Address"
                          value={shipToAddress} onChange={(e) => setValue("invshiptoadd1", e.target.value)} />
                      </div>
                      <div className="col-5">
                        <input type="text" className="form-control form-control-sm" placeholder="City"
                          value={watch("invshiptocity") || ""} onChange={(e) => setValue("invshiptocity", e.target.value)} />
                      </div>
                      <div className="col-4">
                        <input type="text" className="form-control form-control-sm" placeholder="State"
                          value={watch("invshiptostate") || ""} onChange={(e) => setValue("invshiptostate", e.target.value)} />
                      </div>
                      <div className="col-3">
                        <input type="text" className="form-control form-control-sm" placeholder="Zip"
                          value={watch("invshiptozip") || ""} onChange={(e) => setValue("invshiptozip", e.target.value)} />
                      </div>
                      <div className="col-12">
                        <input type="text" className="form-control form-control-sm" placeholder="Phone"
                          value={watch("invshiptophone") || ""} onChange={(e) => setValue("invshiptophone", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* â"€â"€ ORDER DETAILS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
          <div className="row g-2 mt-3">

            {/* Reference group */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Reference</div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">{salesordernoFromSO ? "SO #" : "Customer PO#"}</label>
                    <input type="text" className="form-control form-control-sm" {...register("invoicereference")} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Ordered By</label>
                    <input type="text" className="form-control form-control-sm" {...register("orderedby")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment group */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Fulfillment</div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Terms <span className="text-danger">*</span></label>
                    <Controller
                      name="termsid"
                      control={control}
                      rules={{ required: "Term is required" }}
                      render={({ field }) => (
                        <SelectPaymentTerms trigger={trigger} storeId={parsedStoreId} {...field} />
                      )}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Ship Via <span className="text-danger">*</span></label>
                    <Controller
                      name="invshippingmethod"
                      control={control}
                      rules={{ required: "Shipping Method is required" }}
                      render={({ field }) => (
                        <SelectShippingModes trigger={trigger} storeId={parsedStoreId} {...field} />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing group */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Pricing</div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Discount %</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm"
                      {...register("discountpercent")}
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
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Sales Tax %</label>
                    <input type="number" step="0.001" min={0} max={100} className="form-control form-control-sm"
                      {...register("salestaxrate", { valueAsNumber: true })} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* â"€â"€ LINE ITEMS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {/* Gold rate warning */}
      {ratesStale && (
        <div
          className="d-flex align-items-center gap-2 mb-2"
          style={{ background: "#fffbeb", border: "1px solid #f59e0b", color: "#92400e", borderRadius: 8, fontSize: 12, padding: "8px 12px" }}
        >
          ⚠ Gold rates are not set for today — Wt-priced items will have $0 unit price. Update in System Settings → Metal Rates before adding weight-based items.
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">

          {/* Scrollable items table */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table className="table datanew mb-0">
              <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                <tr>
                  <th className="text-nowrap">#</th>
                  <th className="text-nowrap">Item Code</th>
                  <th style={{ minWidth: allowPcsEntry ? "180px" : "260px" }}>Description</th>
                  <th className="text-center text-nowrap">Tax</th>
                  {allowPcsEntry && <th className="text-end text-nowrap">Pcs</th>}
                  <th className="text-end text-nowrap">Qty</th>
                  <th className="text-end text-nowrap">Unit Price</th>
                  <th className="text-end text-nowrap">Disc %</th>
                  <th className="text-end text-nowrap">Ext. Price</th>
                  <th className="text-center text-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {itemFields.length === 0 ? (
                  <tr>
                    <td colSpan={allowPcsEntry ? 10 : 9} className="text-center text-muted py-5 fst-italic">
                      No items yet -- use the form below to add line items
                    </td>
                  </tr>
                ) : (
                  itemFields.map((field, index) => {
                    const item = watch(`items.${index}`);
                    const line = computeLine(item, mode);
                    return (
                      <tr key={field.id} className={`align-middle${editingIndex === index ? " table-warning" : ""}`}>
                        <td>{index + 1}</td>
                        <td className="text-nowrap">{item?.itemcode || ""}</td>
                        <td>{item?.itemdescription || ""}</td>
                        <td className="text-center">{toNum(item?.itemtaxable) === 1 ? "Y" : "N"}</td>
                        {allowPcsEntry && <td className="text-end">{toNum(item?.itempcs) || 0}</td>}
                        <td className="text-end text-nowrap">
                          {(item as any)?.itemunit && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, marginRight: 4, background: (item as any)?.itemunit?.toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (item as any)?.itemunit?.toLowerCase() === "wt" ? "#92400e" : "#1e40af" }}>
                              {(item as any)?.itemunit}
                            </span>
                          )}
                          {line.qty}
                        </td>
                        <td className="text-end">{formatMoney(line.unit)}</td>
                        <td className="text-end">{line.disc}</td>
                        <td className="text-end">{formatMoney(line.net)}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => {
                              setEditingIndex(index);
                              setToolItem({
                                itemid: item?.itemid,
                                itemcode: item?.itemcode,
                                itemdescription: item?.itemdescription,
                                itemtaxable: item?.itemtaxable,
                                itempcs: toNum(item?.itempcs),
                                itemquantity: toNum(item?.itemquantity),
                                unitprice: toNum(item?.unitprice),
                                discountpercent: toNum(item?.discountpercent),
                                itemunit: (item as any)?.itemunit,
                                itemmetal: (item as any)?.itemmetal,
                                itempremium: (item as any)?.itempremium,
                                broakerage: (item as any)?.broakerage,
                                goldprice_used: (item as any)?.goldprice_used,
                                premium_used: (item as any)?.premium_used,
                                labour_used: (item as any)?.labour_used,
                              });
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(index)}
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

          {/* â"€â"€ ADD / EDIT LINE ROW (below the table) â"€â"€ */}
          {((!salesordernoFromSO && !memonumber) || editingIndex != null) && (
            <div className="border-top pt-3 mt-1">
              <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                {editingIndex != null ? `Editing Line ${editingIndex + 1}` : "+ Add Line Item"}
              </div>
              <div className="row g-2 align-items-end">
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <label className="form-label small text-muted mb-1">Item</label>
                  <SelectProduct
                    storeId={parsedStoreId}
                    hasWarehouseId={true}
                    warehouseId={parsedWarehouseId}
                    onProductsLoaded={setProducts}
                    trigger={trigger}
                    value={toolItem.itemid}
                    initialLabel={
                      toolItem.itemid != null && toolItem.itemcode
                        ? `${toolItem.itemcode} - ${toolItem.itemdescription || ""}`
                        : undefined
                    }
                    clearKey={productClearKey}
                    disableField={!!salesordernoFromSO || !!memonumber}
                    onChange={(val: number | undefined) => setToolItem((prev) => ({ ...prev, itemid: val }))}
                    onChangeAdditional={(selected: ItemDetails) => {
                      if (!selected) {
                        setToolItem((prev) => ({ ...prev, itemid: undefined, itemcode: undefined, itemdescription: undefined, itemtaxable: undefined, unitprice: 0 }));
                        return;
                      }
                      if (allowCarriage) { autoAddItem(selected); return; }
                      const isWt = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
                      const initQty = mode === "CREDIT_INVOICE" ? -1 : 1;
                      const premium = Number(selected.itempremium || 0);
                      const labour = Number(selected.broakerage || 0);
                      const goldRate = isWt && currentRates ? ((getRateField(selected.itemmetal) ? (currentRates[getRateField(selected.itemmetal)!] ?? 0) : 0)) : 0;
                      const unitprice = isWt
                        ? calcWtUnitPrice(Math.abs(initQty), selected.itemmetal, currentRates, premium, labour)
                        : Number(selected.itemsellprice || 0);
                      setToolItem((prev) => ({
                        ...prev,
                        itemid: Number(selected.itemid),
                        itemcode: selected.itemcode,
                        itemdescription: selected.itemdescription,
                        itemtaxable: toNum(selected.itemtaxable),
                        itemquantity: initQty,
                        unitprice,
                        discountpercent: Number(watch("discountpercent") || 0),
                        itemmetal: selected.itemmetal,
                        itemunit: selected.itemunit,
                        itempremium: premium,
                        broakerage: labour,
                        goldprice_used: isWt ? goldRate : undefined,
                        premium_used: isWt ? premium : undefined,
                        labour_used: isWt ? labour : undefined,
                      }));
                    }}
                    onNotFound={() => dispatch(showNotification({ message: "Item not found", type: NOTIFICATION_TYPES.ERROR }))}
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
                  <div className="col-lg-1 col-md-3 col-sm-6">
                    <label className="form-label small text-muted mb-1">Pcs</label>
                    <input
                      type="number"
                      className="form-control text-end"
                      value={toolItem.itempcs}
                      onChange={(e) => setToolItem((prev) => ({ ...prev, itempcs: toNum(e.target.value) }))}
                    />
                  </div>
                )}

                <div className="col-lg-1 col-md-3 col-sm-6">
                  <label className="form-label small text-muted mb-1">Qty *</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-control text-end"
                    value={toolItem.itemquantity}
                    onChange={(e) => {
                      const abs = Math.abs(Number(e.target.value || 0));
                      const normalized = mode === "CREDIT_INVOICE" ? -(Math.round(abs * 1000) / 1000) : Math.round(abs * 1000) / 1000;
                      setToolItem((prev) => {
                        if ((prev.itemunit ?? "").trim().toLowerCase() === "wt") {
                          const goldRate = currentRates ? ((getRateField(prev.itemmetal) ? (currentRates[getRateField(prev.itemmetal)!] ?? 0) : 0)) : 0;
                          const newUnitPrice = calcWtUnitPrice(abs, prev.itemmetal, currentRates, prev.itempremium ?? 0, prev.broakerage ?? 0);
                          return { ...prev, itemquantity: normalized, unitprice: newUnitPrice, goldprice_used: goldRate, premium_used: prev.itempremium, labour_used: prev.broakerage };
                        }
                        return { ...prev, itemquantity: normalized };
                      });
                    }}
                  />
                </div>

                <div className="col-lg-1 col-md-3 col-sm-6">
                  <label className="form-label small text-muted mb-1">Unit Price *</label>
                  <input
                    type="number"
                    step="0.001"
                    min={0}
                    className="form-control text-end"
                    value={toolItem.unitprice}
                    onChange={(e) => setToolItem((prev) => ({ ...prev, unitprice: Math.round(Math.max(0, Number(e.target.value || 0)) * 1000) / 1000 }))}
                  />
                </div>

                <div className="col-lg-1 col-md-3 col-sm-6">
                  <label className="form-label small text-muted mb-1">Disc %</label>
                  <input
                    type="number"
                    step="0.001"
                    min={0}
                    max={100}
                    className="form-control text-end"
                    value={toolItem.discountpercent}
                    onChange={(e) => setToolItem((prev) => ({ ...prev, discountpercent: Math.round(Math.min(100, Math.max(0, Number(e.target.value || 0))) * 1000) / 1000 }))}
                  />
                </div>

                <div className="col-lg-1 col-md-3 col-sm-6">
                  <label className="form-label small text-muted mb-1">Ext Price</label>
                  <input
                    type="text"
                    className="form-control text-end"
                    readOnly
                    value={formatMoney(computeLine({ itemquantity: toolItem.itemquantity, unitprice: toolItem.unitprice, discountpercent: toolItem.discountpercent }, mode).net)}
                  />
                </div>

                <div className="col-lg-1 col-md-3 col-sm-6">
                  {editingIndex == null ? (
                    <button type="button" className="btn btn-primary w-100 d-flex align-items-center justify-content-center" onClick={handleSaveToolItem}>
                      <PlusCircle size={16} />
                    </button>
                  ) : (
                    <div className="btn-group w-100">
                      <button type="button" className="btn btn-success d-flex align-items-center justify-content-center" onClick={handleSaveToolItem}>
                        <Check size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary d-flex align-items-center justify-content-center" onClick={() => { setEditingIndex(null); resetToolItem(); }}>
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

      {/* â"€â"€ NOTES + TOTALS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="row g-3 mb-3">

        {/* Left â€" shipping meta + customer message */}
        <div className="col-lg-6 col-md-12">
          <div className="card h-100">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label small text-muted mb-1">Shipping Date</label>
                  <Controller
                    name="shippingdate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || null}
                        onChange={(date) => field.onChange(date ?? undefined)}
                        className="filterdatepicker w-100"
                        format="DD-MM-YYYY"
                        placeholder="Choose Date"
                        allowClear
                      />
                    )}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted mb-1">Tracking #</label>
                  <input type="text" className="form-control" {...register("shippingtrackingno")} />
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted mb-1">Customer Message</label>
                  <textarea className="form-control" rows={4} {...register("remarks")} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right â€" clean summary table */}
        <div className="col-lg-6 col-md-12">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3 text-muted small">
                <span>{itemFields.length} item{itemFields.length !== 1 ? "s" : ""}</span>
                {totals.totalPcs > 0 && <span>{totals.totalPcs} pcs</span>}
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
                  {toNum(watchedSalesTaxRate) > 0 && (
                    <tr>
                      <td className="ps-0 text-muted">Sales Tax ({toNum(watchedSalesTaxRate)}%)</td>
                      <td className="pe-0 text-end">{formatMoney(totals.salesTax)}</td>
                    </tr>
                  )}
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
                    <td className="ps-0 fw-bold" style={{ fontSize: "1rem" }}>
                      {documentType === "MEMO" ? "Memo Total" : "Invoice Total"}
                    </td>
                    <td className="pe-0 text-end fw-bold" style={{ fontSize: "1rem" }}>{formatMoney(totals.invoiceTotal)}</td>
                  </tr>
                  <tr>
                    <td className="ps-0 text-muted">Amount Received</td>
                    <td className="pe-0 text-end">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm text-end d-inline-block"
                        style={{ width: 120 }}
                        {...register("amountreceived", { valueAsNumber: true })}
                      />
                    </td>
                  </tr>
                  <tr className={`border-top ${totals.balanceDue > 0 ? "text-danger" : totals.balanceDue < 0 ? "text-success" : ""}`}>
                    <td className="ps-0 fw-bold">Balance Due</td>
                    <td className="pe-0 text-end fw-bold">
                      {readOnly && fetchedBalanceDue !== null ? formatMoney(fetchedBalanceDue) : formatMoney(totals.balanceDue)}
                    </td>
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
        <ActionFooter
          handleCancel={handleCancel}
          leftContent={isNewDoc && (
            <div className="d-flex align-items-center gap-2">
              {currentRates ? (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Gold 18Kt: <strong>${Number(currentRates.gold18kt_gram ?? 0).toFixed(2)}</strong>/g
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "#ef4444" }}>No gold rates</span>
              )}
              {activeHolds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowHoldsPanel((v) => !v)}
                >
                  <List size={13} />
                  Held ({activeHolds.length})
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                style={{ fontSize: 12 }}
                onClick={handleHold}
                disabled={savingHold}
              >
                <Bookmark size={13} />
                {savingHold ? "Saving…" : "Hold"}
              </button>
            </div>
          )}
        >
          <ButtonLoader loading={saving} btnText="Save" loadingText="Saving ..." />
        </ActionFooter>
      )}
    </form>
    {emailModalDocNumber && (
      <DocumentEmailModal
        storeId={parsedStoreId}
        documentType={documentType}
        documentNumbers={[emailModalDocNumber]}
        onClose={() => {
          setEmailModalDocNumber(null);
          if (emailModalNavigateBack) {
            setEmailModalNavigateBack(false);
            router.back();
          }
        }}
        onSent={(msg) => {
          setEmailModalDocNumber(null);
          setEmailModalNavigateBack(false);
          dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS }));
          router.back();
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

export default SalesInvoiceFormV2;
