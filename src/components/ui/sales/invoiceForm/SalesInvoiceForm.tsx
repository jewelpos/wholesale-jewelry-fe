"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Check, Edit2, List, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs, { Dayjs } from "dayjs";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { isApolloError, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useDispatch } from "react-redux";

import SelectCustomer from "@/components/forms/SelectCustomer";
import SelectEmployee from "@/components/forms/SelectEmployee";
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
  CREATE_INVOICE_FROM_MEMO_MUTATION,
  CREATE_MEMO_MUTATION,
  EDIT_INVOICE_MUTATION,
  EDIT_MEMO_MUTATION,
  UPDATE_SO_AFTER_INVOICING_MUTATION,
  UPDATE_MEMO_AFTER_INVOICING_MUTATION,
} from "@/lib/graphql/mutations/sales";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { GET_ALL_WAREHOUSE_SETTINGS_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_INVOICE_BY_NUMBER_QUERY, GET_MEMO_DETAIL_QUERY, GET_SALES_ORDER_QUERY } from "@/lib/graphql/query/sales";
import { GET_PAYMENT_MODE_LIST_QUERY } from "@/lib/graphql/query/paymentMode";
import { CREATE_CUSTOMER_PAYMENT_MUTATION } from "@/lib/graphql/mutations/customer";
import { GET_PRODUCT_SETTINGS_INFO_QUERY } from "@/lib/graphql/query/products";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { GET_INVOICE_HOLDS_QUERY } from "@/lib/graphql/query/invoiceHold";
import { SAVE_INVOICE_HOLD_MUTATION, DELETE_INVOICE_HOLD_MUTATION } from "@/lib/graphql/mutations/invoiceHold";
import { GET_SHIPPING_MODES_QUERY } from "@/lib/graphql/query/shipping";
import { GET_PROMOTION_LIST_QUERY } from "@/lib/graphql/query/promotions";
import { GET_PRODUCT_BULK_DISCOUNTS_QUERY } from "@/lib/graphql/query/bulkDiscounts";
import { resolveDiscount, type BulkDiscountTier, type ActivePromotion } from "@/lib/utils/discountResolver";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useCurrency } from "@/hooks/useCurrency";
import api from "@/lib/axios";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

export type SalesInvoiceFormMode = "NEW_INVOICE" | "CREDIT_INVOICE";

export type SalesDocumentType = "INVOICE" | "MEMO";

const MySwal = withReactContent(Swal);

const EXCLUDED_PAYMENT_MODES = new Set(["ReDep", "NSF", "Void", "WriteOff", "CashChk", "MnyOrd", "CrdInv", "WireTrn"]);
const PAYMENT_MODE_ORDER = ["Card", "Cash", "Check", "Zelle"];

type SalesInvoiceItemForm = {
  salesorderitemid?: number;
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itemunit?: string;
  itemmetal?: string;
  itempremium?: number;
  broakerage?: number;
  itempcs?: number;
  memopcinvoice?: number;
  memopcsreturn?: number;
  memopcsremain?: number;
  itemquantity?: number;
  memoqtyinvoice?: number;
  memoqtyreturn?: number;
  memoqtyremain?: number;
  unitprice?: number;
  discountpercent?: number;
  discountsource?: string | null;
  discountpromotionid?: number | null;
  maxpcs?: number;
  maxqty?: number;
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

  salesreps?: { userid: number; split_percent: number }[];
};

type ToolItem = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itemunit?: string;
  itemmetal?: string;
  itempremium?: number;
  broakerage?: number;
  goldprice_used?: number;
  premium_used?: number;
  labour_used?: number;

  itempcs: number;
  itemquantity: number;
  unitprice: number;
  discountpercent?: number;
  // discount metadata (not persisted to form)
  _itemdiscount?: number;
  _itemcategoryid?: number | null;
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
  if (match) {
    const key = `${parseInt(match[1], 10)}Kt`;
    return KARAT_RATE_FIELD[key];
  }
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

type PaymentModalState = {
  open: boolean;
  invoicenumber: number | null;
  netamount: number;
  customerid: number | null;
  warehouseid: number | null;
  onDone: (() => void) | null;
};

const PaymentCollectModal = ({
  paymentModal,
  paymentModes,
  selectedModeId,
  setSelectedModeId,
  paymentAmount,
  setPaymentAmount,
  checkCardNo,
  setCheckCardNo,
  paymentLoading,
  formatMoney,
  onSkip,
  onCollect,
}: {
  paymentModal: PaymentModalState;
  paymentModes: { paymentmodeid: number; paymode: string }[];
  selectedModeId: number | null;
  setSelectedModeId: (id: number) => void;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  checkCardNo: string;
  setCheckCardNo: (v: string) => void;
  paymentLoading: boolean;
  formatMoney: (v: unknown) => string;
  onSkip: () => void;
  onCollect: () => void;
}) => {
  const validModes = paymentModes
    .filter((m) => !EXCLUDED_PAYMENT_MODES.has(m.paymode))
    .sort((a, b) => {
      const ai = PAYMENT_MODE_ORDER.indexOf(a.paymode);
      const bi = PAYMENT_MODE_ORDER.indexOf(b.paymode);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  const received = Number(paymentAmount) || 0;
  const invoiceAmt = paymentModal.netamount;
  const diff = received - invoiceAmt;
  const selectedMode = validModes.find((m) => m.paymentmodeid === selectedModeId);
  const isCardOrCheck = !!selectedMode?.paymode?.toLowerCase().match(/card|check/);

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content" style={{ borderRadius: 14, overflow: "hidden", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

          {/* Coloured header */}
          <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", padding: "20px 24px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
              Collect Payment
            </div>
            <div className="d-flex justify-content-between align-items-end">
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                Invoice {paymentModal.invoicenumber ? `#${paymentModal.invoicenumber}` : ""}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {formatMoney(invoiceAmt)}
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Payment method pills */}
            <div className="mb-4">
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Payment Method
              </div>
              <div className="d-flex flex-wrap gap-2">
                {validModes.map((m) => {
                  const sel = selectedModeId === m.paymentmodeid;
                  return (
                    <button
                      key={m.paymentmodeid}
                      type="button"
                      onClick={() => setSelectedModeId(m.paymentmodeid)}
                      style={{
                        padding: "6px 18px",
                        borderRadius: 20,
                        border: sel ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                        backgroundColor: sel ? "#eff6ff" : "#fff",
                        color: sel ? "#1d4ed8" : "#64748b",
                        fontWeight: sel ? 700 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {m.paymode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference for card / check */}
            {isCardOrCheck && (
              <div className="mb-4">
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  {selectedMode?.paymode?.toLowerCase().includes("card") ? "Card Reference / Last 4" : "Check Number"}
                </div>
                <input
                  className="form-control"
                  value={checkCardNo}
                  onChange={(e) => setCheckCardNo(e.target.value)}
                  placeholder={selectedMode?.paymode?.toLowerCase().includes("card") ? "Last 4 digits or auth code" : "Check number"}
                  style={{ fontSize: 13 }}
                />
              </div>
            )}

            {/* Amount box */}
            <div className="rounded-3 p-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: 13, color: "#64748b" }}>
                <span>Invoice total</span>
                <span className="fw-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#1e293b" }}>{formatMoney(invoiceAmt)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize: 13, color: "#64748b" }}>Amount received</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  autoFocus
                  className="form-control text-end fw-bold"
                  style={{ width: 130, fontSize: 15, border: "2px solid #2563eb", borderRadius: 8 }}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              {received > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2" style={{ borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: diff < -0.005 ? "#d97706" : diff > 0.005 ? "#6366f1" : "#059669" }}>
                    {diff < -0.005 ? "Balance remaining" : diff > 0.005 ? "Change due" : "Paid in full ✓"}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: diff < -0.005 ? "#d97706" : diff > 0.005 ? "#6366f1" : "#059669" }}>
                    {Math.abs(diff) > 0.005 ? formatMoney(Math.abs(diff)) : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="d-flex gap-2 px-4 pb-4">
            <button
              type="button"
              className="btn btn-light"
              style={{ fontSize: 13, color: "#64748b", border: "1.5px solid #e2e8f0", flex: "0 0 auto" }}
              onClick={onSkip}
            >
              Skip
            </button>
            <button
              type="button"
              className="btn btn-primary flex-fill"
              disabled={paymentLoading || !selectedModeId || !paymentAmount || !paymentModal.invoicenumber}
              onClick={onCollect}
              style={{ fontWeight: 600, fontSize: 14 }}
            >
              {paymentLoading ? "Processing…" : `Collect ${received > 0 ? formatMoney(received) : "Payment"}`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const SalesInvoiceForm = ({
  mode,
  invoiceId,
  documentType = "INVOICE",
  salesorderno: salesordernoFromSO,
  memonumber,
  viewInvoicenumber,
  readOnly = false,
  creditFromMemo = false,
}: {
  mode: SalesInvoiceFormMode;
  invoiceId?: number;
  documentType?: SalesDocumentType;
  salesorderno?: number;
  memonumber?: number;
  viewInvoicenumber?: number;
  readOnly?: boolean;
  creditFromMemo?: boolean;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
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

  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: 0 },
    skip: !parsedStoreId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;
  const allowPcsEntry = productSettings == null || !!productSettings.allowpcsentry;
  const allowCarriage = productSettings != null && !!productSettings.allowcarriage;
  const [productClearKey, setProductClearKey] = useState(0);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const pdfCloseNavigateBack = useRef(false);

  // ─── Discount resolution ────────────────────────────────────────────────
  const { data: promotionsData } = useQuery(GET_PROMOTION_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId || !!invoiceId,
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

  const currencyFormatter = useCurrency();

  const formatMoney = (raw: unknown) => {
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    const safe = Number.isFinite(n) ? n : 0;
    return currencyFormatter.formatFixed(safe);
  };

  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({ open: false, invoicenumber: null, netamount: 0, customerid: null, warehouseid: null, onDone: null });
  const [selectedModeId, setSelectedModeId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [checkCardNo, setCheckCardNo] = useState("");

  const [, setProducts] = useState<ItemDetails[]>([]);
  const [fetchedInvoiceId, setFetchedInvoiceId] = useState<number | undefined>(undefined);
  const [fetchedBalanceDue, setFetchedBalanceDue] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [emailModalDocNumber, setEmailModalDocNumber] = useState<number | null>(null);
  const [emailModalNavigateBack, setEmailModalNavigateBack] = useState(false);
  const [toolItem, setToolItem] = useState<ToolItem>(() => ({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: undefined,
    itemtaxable: undefined,
    itemunit: undefined,
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
  const [createInvoiceFromMemo, { loading: savingCreditFromMemo }] = useMutation(CREATE_INVOICE_FROM_MEMO_MUTATION);
  const [createPayment, { loading: paymentLoading }] = useMutation(CREATE_CUSTOMER_PAYMENT_MUTATION);

  const { data: paymentModeData } = useQuery(GET_PAYMENT_MODE_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const paymentModes: { paymentmodeid: number; paymode: string }[] = paymentModeData?.getPaymentExpenseModes ?? [];

  const saving =
    savingInvoice ||
    savingCreditInvoice ||
    savingEditInvoice ||
    savingEditMemo ||
    savingMemo ||
    savingCreditMemo ||
    savingCreditFromMemo;

  const {
    control,
    handleSubmit,
    register,
    trigger,
    setValue,
    watch,
    getValues,
    formState: { isDirty, errors },
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
      salesreps: [],
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
            itemunit: it.itemunit,
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
        .map((it: any) => {
          const remainPcs = toNum(it.memopcsremain);
          const remainQty = toNum(it.memoqtyremain);
          return {
            salesorderitemid: it.invoiceitemid,
            itemid: it.itemid ? Number(it.itemid) : undefined,
            itemcode: it.itemcode,
            itemdescription: it.itemdescription,
            itemtaxable: toNum(it.itemtaxable),
            itemunit: it.itemunit,
            itempcs: creditFromMemo ? -remainPcs : remainPcs,
            itemquantity: creditFromMemo ? -remainQty : remainQty,
            unitprice: toNum(it.unitprice),
            discountpercent: toNum(it.discountpercent),
            maxpcs: remainPcs,
            maxqty: remainQty,
          };
        })
        .filter((it: any) => (it.maxqty ?? 0) > 0 || (it.maxpcs ?? 0) > 0),
    });
  }, [creditFromMemo, memoQueryData, parsedStoreId, reset]);

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
      invoicereference: doc.invoicereference ?? "",
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
        itemunit: it.itemunit,
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
        discountsource: it.discountsource ?? null,
        discountpromotionid: it.discountpromotionid ?? null,
      })),
      salesreps: (doc.salesreps ?? []).map((r: any) => ({ userid: Number(r.userid), split_percent: Number(r.split_percent) })),
    });
  }, [viewInvoiceQueryData, parsedStoreId, reset]);

  // When viewing an invoice that was created from a memo, track the source memo number for label display
  const viewedFromMemoNumber = viewInvoiceQueryData?.getInvoiceByNumber?.frommemonumber
    ? Number(viewInvoiceQueryData.getInvoiceByNumber.frommemonumber)
    : null;

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
        itemunit: it.itemunit,
        itempcs: toNum(it.itempcs),
        memopcinvoice: toNum(it.memopcinvoice),
        memopcsreturn: toNum(it.memopcsreturn),
        memopcsremain: toNum(it.memopcsremain),
        itemquantity: toNum(it.itemquantity),
        memoqtyinvoice: toNum(it.memoqtyinvoice),
        memoqtyreturn: toNum(it.memoqtyreturn),
        memoqtyremain: toNum(it.memoqtyremain),
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

  const { data: warehouseSettingsData } = useQuery(GET_ALL_WAREHOUSE_SETTINGS_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId || !!invoiceId,
  });

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
  const watchedSalesReps = watch("salesreps") ?? [];
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

    if (Number(c.custalert) === 1 && c.custalertremarks?.trim()) {
      MySwal.fire({
        title: "Customer Alert",
        text: c.custalertremarks,
        icon: "warning",
        confirmButtonText: "OK",
      });
    }

    setValue("invbilltocompanyname", c.custcompanyname ?? "");
    setValue("invbilltoadd1", c.custadd1 ?? "");
    setValue("invbilltocity", c.custcity ?? "");
    setValue("invbilltostate", c.custstate ?? "");
    setValue("invbilltozip", c.custzip ?? "");
    setValue("invbilltophone", c.custphone1 ?? c.custphone2 ?? "");

    if (typeof c.termsid === "number" && c.termsid > 0) setValue("termsid", c.termsid);
    if (typeof c.custshippingmethod !== "undefined") {
      const parsed = Number(c.custshippingmethod);
      if (Number.isFinite(parsed) && parsed > 0) setValue("invshippingmethod", parsed);
    }
    if (c.default_salesrep_userid && isNewDoc) {
      setValue("salesreps", [{ userid: c.default_salesrep_userid, split_percent: 0 }]);
    }

    // Auto-populate tax rate on new docs only: customer rate takes priority over warehouse default
    if (!invoiceId) {
      const customerRate = Number(c.custsalestax);
      if (customerRate > 0) {
        setValue("salestaxrate", customerRate);
      } else {
        const allSettings: any[] = warehouseSettingsData?.getAllWarehouseSettings ?? [];
        const wSetting = allSettings.find((s: any) => s.warehouseid === parsedWarehouseId);
        const warehouseRate = Number(wSetting?.defaultsalestaxrate ?? 0);
        if (warehouseRate > 0) setValue("salestaxrate", warehouseRate);
      }
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
  }, [customerData, customerId, setValue, shipSameAsBill, invoiceId, isNewDoc, warehouseSettingsData, parsedWarehouseId]);
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

    const unitQtyTotals: Record<string, number> = {};
    for (const it of items) {
      const unit = (it.itemunit ?? "Pc").trim() || "Pc";
      unitQtyTotals[unit] = (unitQtyTotals[unit] ?? 0) + Math.abs(toNum(it.itemquantity));
    }

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
      unitQtyTotals,
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
      itemunit: undefined,
      itempcs: 0,
      itemquantity: mode === "CREDIT_INVOICE" ? -1 : 1,
      unitprice: 0,
      discountpercent: invoiceDiscountPrefill,
    });
  };

  const autoAddItem = async (selected: ItemDetails) => {
    const itemid = Number(selected.itemid);
    const unitprice = Number(selected.itemsellprice || 0);
    const currentItems: SalesInvoiceItemForm[] = getValues("items") || [];
    const dupIndex = currentItems.findIndex((it) => Number(it.itemid) === itemid);

    if (dupIndex >= 0) {
      const existing = currentItems[dupIndex];
      const existingQty = Number(existing.itemquantity || 0);
      const newQty = mode === "CREDIT_INVOICE" ? existingQty - 1 : existingQty + 1;
      // Re-evaluate discount if not manually set
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
        const updated = { ...existing, itemquantity: newQty, discountpercent: resolved.discountpercent, discountsource: resolved.discountsource, discountpromotionid: resolved.discountpromotionid };
        update(dupIndex, updated);
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
        itemquantity: mode === "CREDIT_INVOICE" ? -1 : 1,
        unitprice,
        discountpercent: resolved.discountpercent,
        discountsource: resolved.discountsource,
        discountpromotionid: resolved.discountpromotionid,
      });
    }
    resetToolItem();
    setProductClearKey((k) => k + 1);
  };

  const handleSaveToolItem = async () => {
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

    // Resolve discount for new items; for edits detect manual override
    let resolvedSource: string | null = null;
    let resolvedPromotionId: number | null = null;

    if (editingIndex == null) {
      // New line: resolve discount from item data + bulk + promotions
      const bulkTiers = await getBulkTiers(Number(toolItem.itemid));
      const resolved = resolveDiscount({
        itemDiscount: toolItem._itemdiscount ?? 0,
        unitprice: unitPrice,
        qty: Math.abs(normalizedQty),
        bulkTiers,
        activePromotions,
        itemid: Number(toolItem.itemid),
        categoryid: toolItem._itemcategoryid ?? null,
        warehouseid: getValues('warehouseid'),
      });
      resolvedSource = resolved.discountsource;
      resolvedPromotionId = resolved.discountpromotionid;
    } else {
      // Edit: if discount was changed by user vs existing, mark manual
      const existingItem = getValues(`items.${editingIndex}`);
      if (discountPct !== toNum(existingItem?.discountpercent)) {
        resolvedSource = 'manual';
        resolvedPromotionId = null;
      } else {
        resolvedSource = (existingItem as any)?.discountsource ?? null;
        resolvedPromotionId = (existingItem as any)?.discountpromotionid ?? null;
      }
    }

    const nextItem: SalesInvoiceItemForm = {
      itemid: Number(toolItem.itemid),
      itemcode: toolItem.itemcode,
      itemdescription: toolItem.itemdescription,
      itemtaxable: toNum(toolItem.itemtaxable),
      itemunit: toolItem.itemunit,
      itemmetal: toolItem.itemmetal,
      itempremium: toolItem.itempremium,
      broakerage: toolItem.broakerage,
      goldprice_used: toolItem.goldprice_used,
      premium_used: toolItem.premium_used,
      labour_used: toolItem.labour_used,
      itempcs: toNum(toolItem.itempcs),
      itemquantity: normalizedQty,
      unitprice: unitPrice,
      discountpercent: discountPct,
      discountsource: resolvedSource,
      discountpromotionid: resolvedPromotionId,
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
    setProductClearKey((k) => k + 1);
  };

  const handleCollectPayment = async () => {
    try {
      await createPayment({
        variables: {
          input: {
            storeid: parsedStoreId,
            customerid: paymentModal.customerid,
            outletid: parsedOutletId,
            warehouseid: paymentModal.warehouseid ?? undefined,
            paymentmodeid: selectedModeId,
            amount: Number(paymentAmount),
            invoicenumbers: [String(paymentModal.invoicenumber)],
            checkcardno: checkCardNo || undefined,
          },
        },
      });
      dispatch(showNotification({ message: "Payment recorded", type: NOTIFICATION_TYPES.SUCCESS }));
    } catch {
      dispatch(showNotification({ message: "Payment failed — invoice saved without payment", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      const done = paymentModal.onDone;
      setPaymentModal((p) => ({ ...p, open: false }));
      done?.();
    }
  };

  const onSubmit: SubmitHandler<SalesInvoiceFormType> = async (formData) => {
    const warehouseId = Number(formData.warehouseid);
    if (!parsedStoreId || !warehouseId) return;

    if (!formData.termsid || Number(formData.termsid) <= 0) {
      dispatch(showNotification({ message: "Terms is required", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    if (!formData.invshippingmethod || Number(formData.invshippingmethod) <= 0) {
      dispatch(showNotification({ message: "Shipping method is required", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const reps = (formData.salesreps ?? []).filter(r => r.userid);
    if (reps.length > 0) {
      const total = reps.reduce((s, r) => s + (r.split_percent ?? 0), 0);
      // Only enforce 100% when splits are non-zero (i.e. commission is being configured, not just tracking)
      if (total > 0 && Math.abs(total - 100) > 0.01) {
        dispatch(showNotification({ message: `Sales rep split must total 100% (currently ${total.toFixed(1)}%)`, type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
    }

    const items = (formData.items || []).map((it) => {
      const { qty, unit, disc, gross, net } = computeLine(it, mode);
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
        discountsource: it.discountsource ?? null,
        discountpromotionid: it.discountpromotionid ?? null,
      };
    });

    // Auto-append discount summary to remarks (bulk + promo only, new invoices only)
    const resolvedRemarks = (() => {
      if (invoiceId) return formData.remarks ?? '';
      const bulkItems = items.filter(i => i.discountsource === 'bulk');
      const promoItems = items.filter(i => i.discountsource === 'promotion');
      const parts: string[] = [];
      if (bulkItems.length) parts.push(`Bulk discount applied on ${bulkItems.length} item(s)`);
      if (promoItems.length) {
        const byPromo: Record<string, number> = {};
        promoItems.forEach(i => {
          const key = String(i.discountpromotionid ?? 'promo');
          byPromo[key] = (byPromo[key] ?? 0) + 1;
        });
        Object.entries(byPromo).forEach(([, count]) => {
          const promoName = activePromotions.find(p => promoItems.some(pi => pi.discountpromotionid === p.promotionid))?.promotionname ?? 'Promotion';
          parts.push(`${promoName} promo applied on ${count} item(s)`);
        });
      }
      if (!parts.length) return formData.remarks ?? '';
      const note = parts.join('; ') + '.';
      const existing = (formData.remarks ?? '').trim();
      if (existing.includes(note)) return existing;
      return [existing, note].filter(Boolean).join(' ');
    })();

    const payload = {
      storeid: parsedStoreId,
      customerid: formData.customerid ? Number(formData.customerid) : undefined,
      warehouseid: warehouseId,

      saledate: formData.saledate?.toISOString?.(),

      invoicestatusid: formData.invoicestatusid ? Number(formData.invoicestatusid) : undefined,
      termsid: formData.termsid != null ? Number(formData.termsid) : undefined,
      invshippingmethod:
        typeof formData.invshippingmethod !== "undefined"
          ? String(formData.invshippingmethod)
          : undefined,

      discountpercent: toNum(formData.discountpercent),

      invoicereference: formData.invoicereference,
      remarks: resolvedRemarks,

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

      items,
      salesreps: (formData.salesreps ?? []).filter(r => r.userid),
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
      | Awaited<ReturnType<typeof createInvoice>>
      | Awaited<ReturnType<typeof createInvoiceFromMemo>>;

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
            : memonumber
              ? await createInvoiceFromMemo({
                  variables: {
                    input: {
                      storeid: parsedStoreId,
                      memonumber,
                      creditreturn: creditFromMemo,
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
          : memonumber
            ? (result?.data as any)?.createInvoiceFromMemo
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

      // For new invoices only: show the payment collection modal before the print popup
      const isNewStandardInvoice = documentType === "INVOICE" && !isEdit && !memonumber && mode !== "CREDIT_INVOICE";
      if (isNewStandardInvoice) {
        const capturedDocNumber = documentNumber ?? null;
        const capturedNetAmount = payload.netamount as number;
        const capturedCustomerId = formData.customerid ? Number(formData.customerid) : null;
        const capturedWarehouseId = warehouseId ?? null;
        const firstModeId =
          paymentModes.find((m) => m.paymode === "Card")?.paymentmodeid ??
          paymentModes.find((m) => !EXCLUDED_PAYMENT_MODES.has(m.paymode))?.paymentmodeid ??
          null;
        setSelectedModeId(firstModeId);
        setPaymentAmount(String(capturedNetAmount));
        setCheckCardNo("");
        setPaymentModal({
          open: true,
          invoicenumber: capturedDocNumber,
          netamount: capturedNetAmount,
          customerid: capturedCustomerId,
          warehouseid: capturedWarehouseId,
          onDone: async () => {
            const num = capturedDocNumber;
            let smsSendClicked = false;
            const showSmsButton = !!num;
            const popupResult = await MySwal.fire({
              icon: "success",
              title: "Invoice Saved",
              html: `<div class="text-muted" style="font-size: 0.95rem; line-height: 1.35;">Invoice ${num ? `#${num}` : ""} saved successfully.</div>`,
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: "🖨️ Print",
              denyButtonText: "✉️ Email",
              cancelButtonText: "Close",
              showCloseButton: true,
              footer: showSmsButton
                ? `<button id="swal-sms-btn" style="background:none;border:none;color:#198754;cursor:pointer;font-size:0.85rem;padding:0;">📱 Send SMS</button>`
                : undefined,
              didOpen: () => {
                if (!showSmsButton) return;
                document.getElementById("swal-sms-btn")?.addEventListener("click", () => {
                  smsSendClicked = true;
                  MySwal.close();
                });
              },
            });
            dispatch(showNotification({ message: response?.message || "Invoice saved successfully", type: NOTIFICATION_TYPES.SUCCESS }));
            if (popupResult.isConfirmed && num) {
              reset();
              pdfCloseNavigateBack.current = true;
              await handlePrintDocumentNumber(num);
              return;
            }
            if (smsSendClicked && num) {
              try {
                await api.post(`/store/invoice/sms`, { storeid: parsedStoreId, invoicenumber: num });
                api.post('/store/comm-count/increment', { storeid: parsedStoreId, outletid: parsedOutletId, type: 'sms' }).catch(() => {});
                dispatch(showNotification({ message: `SMS sent for Invoice #${num}`, type: NOTIFICATION_TYPES.SUCCESS }));
              } catch {
                dispatch(showNotification({ message: "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
              }
              reset();
              router.back();
              return;
            }
            if (popupResult.isDenied && num) {
              setEmailModalDocNumber(num);
              setEmailModalNavigateBack(true);
              reset();
              return;
            }
            reset();
            router.back();
          },
        });
        return;
      }

      let smsSendClicked = false;
      const showSmsButton = documentType === "INVOICE" && !isEdit && !!documentNumber;
      const popupResult = await MySwal.fire({
        icon: "success",
        title: `${docLabel} Saved`,
        html: `<div class="text-muted" style="font-size: 0.95rem; line-height: 1.35;">${docLabel} ${label} saved successfully.</div>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "🖨️ Print",
        denyButtonText: "✉️ Email",
        cancelButtonText: "Close",
        showCloseButton: true,
        footer: showSmsButton
          ? `<button id="swal-sms-btn" style="background:none;border:none;color:#198754;cursor:pointer;font-size:0.85rem;padding:0;">📱 Send SMS</button>`
          : undefined,
        didOpen: () => {
          if (!showSmsButton) return;
          document.getElementById("swal-sms-btn")?.addEventListener("click", () => {
            smsSendClicked = true;
            MySwal.close();
          });
        },
      });

      dispatch(
        showNotification({
          message: response?.message || `${docLabel} saved successfully`,
          type: NOTIFICATION_TYPES.SUCCESS,
        })
      );

      if (popupResult.isConfirmed && documentNumber) {
        reset();
        pdfCloseNavigateBack.current = true;
        await handlePrintDocumentNumber(documentNumber);
        return;
      }

      if (smsSendClicked && documentNumber) {
        try {
          await api.post(`/store/invoice/sms`, {
            storeid: parsedStoreId,
            invoicenumber: documentNumber,
          });
          api.post('/store/comm-count/increment', { storeid: parsedStoreId, outletid: parsedOutletId, type: 'sms' }).catch(() => {});
          dispatch(showNotification({ message: `SMS sent for Invoice #${documentNumber}`, type: NOTIFICATION_TYPES.SUCCESS }));
        } catch {
          dispatch(showNotification({ message: "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
        }
        reset();
        router.back();
        return;
      }

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

  const billToCompanyName = watch("invbilltocompanyname") || "";
  const shipToCompanyName = watch("invshiptocompanyname") || "";
  const shipToAddress = watch("invshiptoadd1") || "";

  const [addrOpen, setAddrOpen] = useState(true);
  const autoCollapsedRef = useRef(false);
  useEffect(() => {
    if (billToCompanyName && !autoCollapsedRef.current) {
      setAddrOpen(false);
      autoCollapsedRef.current = true;
    }
  }, [billToCompanyName]);

  // Show loader while SO data is being fetched / retrying
  if (salesordernoFromSO && (soQueryLoading || (soQueryError && !soQueryData))) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-3" />
        <span className="text-muted">Loading sales order details...</span>
      </div>
    );
  }

  if (memonumber && memoQueryLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-3" />
        <span className="text-muted">Loading memo details...</span>
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

  const isMemoView = readOnly && documentType === "MEMO";

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
                          <button type="button" className="btn btn-sm btn-success" style={{ fontSize: 11, padding: "2px 10px" }} onClick={() => handleResumeHold(hold)}>Resume</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" style={{ fontSize: 11, padding: "2px 10px" }} onClick={() => handleDeleteHold(hold.holdid)}>Discard</button>
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

      {/* HEADER STRIP */}
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
                    format="MM/DD/YYYY"
                    placeholder="Choose Date"
                    allowClear
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
              <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                {documentType === "MEMO" ? "Memo #" : "Invoice #"}
              </div>
              <div className="text-muted fst-italic">Auto-assigned</div>
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
                      <div className="fw-semibold">{shipToCompanyName || billToCompanyName}</div>
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
                {!shipSameAsBill && shipToCompanyName ? ` · Ship To: ${shipToCompanyName}` : ""}
              </span>
            )}
          </div>
          <i className={`fas fa-chevron-${addrOpen ? "up" : "down"} text-muted`} style={{ fontSize: 12 }} />
        </div>
        {addrOpen && (
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
                        <SelectCustomer trigger={trigger} storeId={parsedStoreId} disableField={typeof invoiceId === "number" && invoiceId > 0} {...field} />
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
                        {billToCompanyName && <div className="fw-semibold text-body">{billToCompanyName}</div>}
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
                      {!billToCompanyName && (
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
                            <SelectCustomer trigger={trigger} storeId={parsedStoreId} disableField={typeof invoiceId === "number" && invoiceId > 0} {...field} />
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
          </div>
        )}
      </div>

      {/* ORDER DETAILS */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">

            {/* Reference group */}
            <div className="col-lg-4 col-md-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Reference</div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">{salesordernoFromSO ? "SO #" : (creditFromMemo || memonumber || viewedFromMemoNumber) ? "Memo #" : "Customer PO#"}</label>
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
                    {errors.termsid && <div className="text-danger" style={{ fontSize: "0.75rem", marginTop: 2 }}>{errors.termsid.message as string}</div>}
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
                    {errors.invshippingmethod && <div className="text-danger" style={{ fontSize: "0.75rem", marginTop: 2 }}>{errors.invshippingmethod.message as string}</div>}
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

            {/* Sales Rep — always visible; read-only in view mode, editable otherwise */}
            <div className="col-12">
              <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}>Sales Rep</div>
                {readOnly ? (
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    {watchedSalesReps.length === 0 ? (
                      <span className="text-muted" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>No sales rep selected</span>
                    ) : (
                      watchedSalesReps.map((rep, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 200 }}>
                            <SelectEmployee
                              storeId={parsedStoreId}
                              value={rep.userid || null}
                              isDisabled
                              onChange={() => {}}
                            />
                          </div>
                          <span className="text-muted" style={{ fontSize: "0.8rem" }}>{rep.split_percent}%</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    {watchedSalesReps.length === 0 && (
                      <span className="text-muted" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>None</span>
                    )}
                    {watchedSalesReps.map((rep, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 200 }}>
                          <SelectEmployee
                            storeId={parsedStoreId}
                            value={rep.userid || null}
                            trigger={trigger}
                            name={`salesreps.${idx}.userid`}
                            onChange={(val: number) => {
                              const next = [...(getValues("salesreps") ?? [])];
                              next[idx] = { ...next[idx], userid: val };
                              setValue("salesreps", next);
                            }}
                          />
                        </div>
                        <input
                          type="number" min={0} max={100} step={0.1}
                          style={{ width: 52 }}
                          className="form-control form-control-sm"
                          value={rep.split_percent ?? 0}
                          onChange={(e) => {
                            const next = [...(getValues("salesreps") ?? [])];
                            next[idx] = { ...next[idx], split_percent: Number(e.target.value) };
                            setValue("salesreps", next);
                          }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "#6c757d" }}>%</span>
                        <button type="button" className="btn btn-link p-0 text-danger" style={{ fontSize: "0.85rem", lineHeight: 1 }}
                          onClick={() => {
                            const next = (getValues("salesreps") ?? []).filter((_, i) => i !== idx);
                            if (next.length === 1) next[0].split_percent = 0;
                            setValue("salesreps", next);
                          }}>×</button>
                      </div>
                    ))}
                    {watchedSalesReps.length > 0 && (() => {
                      const total = watchedSalesReps.reduce((s, r) => s + (r.split_percent ?? 0), 0);
                      return total > 0 && Math.abs(total - 100) > 0.01;
                    })() && (
                      <span className="text-danger" style={{ fontSize: "0.7rem" }}>
                        Split must = 100% (now {watchedSalesReps.reduce((s, r) => s + (r.split_percent ?? 0), 0).toFixed(1)}%)
                      </span>
                    )}
                    {watchedSalesReps.length < 2 && (
                      <button type="button" className="btn btn-link p-0" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        onClick={() => {
                          const current = getValues("salesreps") ?? [];
                          if (current.length === 0) {
                            setValue("salesreps", [{ userid: 0, split_percent: 0 }]);
                          } else {
                            setValue("salesreps", [{ ...current[0], split_percent: 50 }, { userid: 0, split_percent: 50 }]);
                          }
                        }}>
                        + Add Rep
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LINE ITEMS */}
      <div className="card mb-3">
        <div className="card-body">

          {/* Scrollable items table */}
          <div style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
            <table className="table datanew mb-0">
              <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                <tr>
                  <th className="text-nowrap">#</th>
                  <th className="text-nowrap">Item Code</th>
                  <th style={{ minWidth: allowPcsEntry ? "180px" : "260px" }}>Description</th>
                  <th className="text-center text-nowrap">Tax</th>
                  <th className="text-center text-nowrap">Unit</th>
                  {allowPcsEntry && <th className="text-end text-nowrap">{isMemoView ? "Ord Pcs" : "Pcs"}</th>}
                  {isMemoView && allowPcsEntry && <th className="text-end text-nowrap">Inv Pcs</th>}
                  {isMemoView && allowPcsEntry && <th className="text-end text-nowrap">Ret Pcs</th>}
                  {isMemoView && allowPcsEntry && <th className="text-end text-nowrap">Rem Pcs</th>}
                  <th className="text-end text-nowrap">{isMemoView ? "Ord Qty" : "Qty"}</th>
                  {isMemoView && <th className="text-end text-nowrap">Inv Qty</th>}
                  {isMemoView && <th className="text-end text-nowrap">Ret Qty</th>}
                  {isMemoView && <th className="text-end text-nowrap">Rem Qty</th>}
                  <th className="text-end text-nowrap">Unit Price</th>
                  <th className="text-end text-nowrap">Disc %</th>
                  <th className="text-end text-nowrap">Ext. Price</th>
                  {!readOnly && <th className="text-center text-nowrap">Action</th>}
                </tr>
              </thead>
              <tbody>
                {itemFields.length === 0 ? (
                  <tr>
                    <td colSpan={isMemoView ? (allowPcsEntry ? 16 : 12) : (allowPcsEntry ? 11 : 10)} className="text-center text-muted py-5 fst-italic">
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
                        <td className="text-center">
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: (item?.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (item?.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af" }}>
                            {item?.itemunit || "Pc"}
                          </span>
                        </td>
                        {allowPcsEntry && <td className="text-end">{toNum(item?.itempcs) || 0}</td>}
                        {isMemoView && allowPcsEntry && <td className="text-end">{toNum(item?.memopcinvoice) || 0}</td>}
                        {isMemoView && allowPcsEntry && <td className="text-end">{toNum(item?.memopcsreturn) || 0}</td>}
                        {isMemoView && allowPcsEntry && <td className="text-end">{toNum(item?.memopcsremain) || 0}</td>}
                        <td className="text-end">{line.qty}</td>
                        {isMemoView && <td className="text-end">{toNum(item?.memoqtyinvoice) || 0}</td>}
                        {isMemoView && <td className="text-end">{toNum(item?.memoqtyreturn) || 0}</td>}
                        {isMemoView && <td className="text-end">{toNum(item?.memoqtyremain) || 0}</td>}
                        <td className="text-end">{formatMoney(line.unit)}</td>
                        <td className="text-end">
                          <div>{line.disc}</div>
                          {item?.discountsource && item.discountsource !== 'item' && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: item.discountsource === 'manual' ? '#fef3c7' : item.discountsource === 'bulk' ? '#dcfce7' : '#ede9fe', color: item.discountsource === 'manual' ? '#92400e' : item.discountsource === 'bulk' ? '#166534' : '#6d28d9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {item.discountsource === 'bulk' ? 'Bulk' : item.discountsource === 'promotion' ? 'Promo' : 'Manual'}
                            </span>
                          )}
                        </td>
                        <td className="text-end">{formatMoney(line.net)}</td>
                        {!readOnly && (
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
                                  itemunit: item?.itemunit,
                                  itempcs: toNum(item?.itempcs),
                                  itemquantity: toNum(item?.itemquantity),
                                  unitprice: toNum(item?.unitprice),
                                  discountpercent: toNum(item?.discountpercent),
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
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ADD / EDIT LINE ROW */}
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
                        setToolItem((prev) => ({ ...prev, itemid: undefined, itemcode: undefined, itemdescription: undefined, itemtaxable: undefined, itemunit: undefined, unitprice: 0 }));
                        return;
                      }
                      const isWtItem = (selected.itemunit ?? "").trim().toLowerCase() === "wt";
                      if (allowCarriage && !isWtItem) { autoAddItem(selected); return; }
                      const initQty = isWtItem ? 0 : (mode === "CREDIT_INVOICE" ? -1 : 1);
                      const premium = Number((selected as any).itempremium || 0);
                      const labour = Number((selected as any).broakerage || 0);
                      const metalType = (selected as any).itemmetal;
                      const goldRate = isWtItem && currentRates ? (getRateField(metalType, metalTypeList) ? ((currentRates as any)[getRateField(metalType, metalTypeList)!] ?? 0) : 0) : 0;
                      const unitprice = isWtItem
                        ? calcWtUnitPrice(metalType, currentRates as any, premium, labour, metalTypeList)
                        : Number(selected.itemsellprice || 0);
                      setToolItem((prev) => ({
                        ...prev,
                        itemid: Number(selected.itemid),
                        itemcode: selected.itemcode,
                        itemdescription: selected.itemdescription,
                        itemtaxable: toNum(selected.itemtaxable),
                        itemunit: selected.itemunit,
                        itemmetal: metalType,
                        itempremium: premium,
                        broakerage: labour,
                        itemquantity: initQty,
                        unitprice,
                        discountpercent: Number(watch("discountpercent") || 0),
                        goldprice_used: isWtItem ? goldRate : undefined,
                        premium_used: isWtItem ? premium : undefined,
                        labour_used: isWtItem ? labour : undefined,
                        _itemdiscount: toNum(selected.itemdiscount),
                        _itemcategoryid: selected.itemcategoryid ?? null,
                      }));
                      if (Number(selected.itemalertwarning) === 1 && selected.itemwarningmessage?.trim()) {
                        MySwal.fire({
                          title: "Item Alert",
                          html: `<strong>${selected.itemcode ?? ""}</strong><br/>${selected.itemwarningmessage}`,
                          icon: "warning",
                          confirmButtonText: "OK",
                        });
                      }
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
                  <label className="form-label small text-muted mb-1">
                    Qty *{toolItem.itemunit && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: (toolItem.itemunit ?? "").toLowerCase() === "wt" ? "#fef3c7" : "#eff6ff", color: (toolItem.itemunit ?? "").toLowerCase() === "wt" ? "#92400e" : "#1e40af", marginLeft: 4 }}>
                        {toolItem.itemunit}
                      </span>
                    )}
                  </label>
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
                          const rateField = getRateField(prev.itemmetal, metalTypeList);
                          const goldRate = currentRates && rateField ? ((currentRates as any)[rateField] ?? 0) : 0;
                          const newUnitPrice = calcWtUnitPrice(prev.itemmetal, currentRates as any, prev.itempremium ?? 0, prev.broakerage ?? 0, metalTypeList);
                          return { ...prev, itemquantity: normalized, unitprice: newUnitPrice, goldprice_used: goldRate, premium_used: prev.itempremium, labour_used: prev.broakerage };
                        }
                        return { ...prev, itemquantity: normalized };
                      });
                    }}
                  />
                </div>

                <div className="col-lg-1 col-md-3 col-sm-6">
                  <label className="form-label small text-muted mb-1">Unit Price <span className="text-danger">*</span></label>
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

      {/* NOTES + TOTALS */}
      <div className="row g-3 mb-3">

        {/* Left - shipping meta + customer message */}
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
                        format="MM/DD/YYYY"
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

        {/* Right - clean summary table */}
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
        outletId={parsedOutletId}
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

    {paymentModal.open && (
      <PaymentCollectModal
        paymentModal={paymentModal}
        paymentModes={paymentModes}
        selectedModeId={selectedModeId}
        setSelectedModeId={setSelectedModeId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        checkCardNo={checkCardNo}
        setCheckCardNo={setCheckCardNo}
        paymentLoading={paymentLoading}
        formatMoney={formatMoney}
        onSkip={() => {
          const done = paymentModal.onDone;
          setPaymentModal((p) => ({ ...p, open: false }));
          done?.();
        }}
        onCollect={handleCollectPayment}
      />
    )}
    {pdfPreview && (
      <PdfPreviewModal
        pdfUrl={pdfPreview.url}
        filename={pdfPreview.filename}
        onClose={() => {
          setPdfPreview(null);
          if (pdfCloseNavigateBack.current) {
            pdfCloseNavigateBack.current = false;
            router.back();
          }
        }}
      />
    )}
    </>
  );
};

export default SalesInvoiceForm;

