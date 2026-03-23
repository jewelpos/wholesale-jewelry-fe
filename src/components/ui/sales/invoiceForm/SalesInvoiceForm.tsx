"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs, { Dayjs } from "dayjs";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { isApolloError, useMutation, useQuery } from "@apollo/client";
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

import {
  CREATE_CREDIT_INVOICE_MUTATION,
  CREATE_CREDIT_MEMO_MUTATION,
  CREATE_INVOICE_MUTATION,
  CREATE_MEMO_MUTATION,
  EDIT_INVOICE_MUTATION,
} from "@/lib/graphql/mutations/sales";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

export type SalesInvoiceFormMode = "NEW_INVOICE" | "CREDIT_INVOICE";

export type SalesDocumentType = "INVOICE" | "MEMO";

const MySwal = withReactContent(Swal);

type SalesInvoiceItemForm = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;

  itempcs?: number;
  itemquantity?: number;
  unitprice?: number;
  discountpercent?: number;
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

  discountpercent?: number;
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
};

const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

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

const SalesInvoiceForm = ({
  mode,
  invoiceId,
  documentType = "INVOICE",
}: {
  mode: SalesInvoiceFormMode;
  invoiceId?: number;
  documentType?: SalesDocumentType;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const config = getEnvironmentConfig();

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
      const response = await api.post(`${config.apiUrl}${urlPath}`, payload, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      if (data) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          documentType === "MEMO" ? `memo-${documentNumber}.pdf` : `invoice-${documentNumber}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
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

  const handleEmailInvoiceNumber = async () => {
    const label = documentType === "MEMO" ? "memo" : "invoice";
    dispatch(
      showNotification({
        message: `Email ${label} is not configured yet. Share the email endpoint/mutation to wire this.`,
        type: NOTIFICATION_TYPES.ERROR,
      })
    );
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

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  const saving =
    savingInvoice ||
    savingCreditInvoice ||
    savingEditInvoice ||
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
      discountpercent: 0,
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

  const { fields: itemFields, append, remove, update } = useFieldArray({
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

    const shipping = toNum(watchedShipping);
    const salesTax = 0;
    const invoiceTotal = subtotal + salesTax + shipping;

    const amountPaid = toNum(watchedAmountReceived);
    const balanceDue = invoiceTotal - amountPaid;

    const totalPcs = items.reduce((acc, it) => acc + toNum(it.itempcs), 0);

    const taxableSale = items.reduce((acc, it) => {
      if (toNum(it.itemtaxable) !== 1) return acc;
      return acc + computeLine(it, mode).net;
    }, 0);
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
  }, [mode, watchedAmountReceived, watchedDiscountPercent, watchedItems, watchedShipping]);

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
    };

    if (editingIndex == null) {
      append(nextItem);
    } else {
      update(editingIndex, nextItem);
      setEditingIndex(null);
    }

    resetToolItem();
  };

  const onSubmit: SubmitHandler<SalesInvoiceFormType> = async (formData) => {
    const warehouseId = Number(formData.warehouseid);
    if (!parsedStoreId || !warehouseId) return;

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
      };
    });

    const payload = {
      storeid: parsedStoreId,
      customerid: formData.customerid ? Number(formData.customerid) : undefined,
      warehouseid: warehouseId,

      saledate: formData.saledate?.toISOString?.(),

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
      netamount: totals.invoiceTotal,
      amountreceived: totals.amountPaid,
      balancedue: totals.balanceDue,

      taxablesale: totals.taxableSale,
      nontaxablesale: totals.nonTaxableSale,

      items,
    };

    const isEdit =
      documentType === "INVOICE" &&
      typeof invoiceId === "number" &&
      Number.isFinite(invoiceId) &&
      invoiceId > 0;

    let result:
      | Awaited<ReturnType<typeof createCreditMemo>>
      | Awaited<ReturnType<typeof createMemo>>
      | Awaited<ReturnType<typeof editInvoice>>
      | Awaited<ReturnType<typeof createCreditInvoice>>
      | Awaited<ReturnType<typeof createInvoice>>;

    try {
      result =
        documentType === "MEMO"
          ? mode === "CREDIT_INVOICE"
            ? await createCreditMemo({ variables: { input: payload } })
            : await createMemo({ variables: { input: payload } })
          : isEdit
            ? await editInvoice({
                variables: {
                  input: {
                    ...payload,
                    invoiceid: Number(invoiceId),
                  },
                },
              })
            : mode === "CREDIT_INVOICE"
              ? await createCreditInvoice({ variables: { input: payload } })
              : await createInvoice({ variables: { input: payload } });
    } catch (err: unknown) {
      const fallback = documentType === "MEMO" ? "Failed to create memo" : "Failed to create invoice";

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
        ? mode === "CREDIT_INVOICE"
          ? result?.data?.createCreditMemo
          : result?.data?.createMemo
        : isEdit
          ? result?.data?.editInvoice
          : mode === "CREDIT_INVOICE"
            ? result?.data?.createCreditInvoice
            : result?.data?.createInvoice;

    if (response?.success) {
      const documentNumber =
        documentType === "MEMO"
          ? extractMemoNumber(response?.data)
          : extractInvoiceNumber(response?.data);
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
        html: `<div class=\"text-muted\" style=\"font-size: 0.95rem; line-height: 1.35;\">${docLabel} ${label} saved successfully.</div>`,
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

      if (popupResult.isDenied) {
        await handleEmailInvoiceNumber();
      }

      dispatch(
        showNotification({
          message: response?.message || `${docLabel} saved successfully`,
          type: NOTIFICATION_TYPES.SUCCESS,
        })
      );

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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Create Date</label>
                <div className="col-md-8">
                  <div className="input-groupicon calender-input">
                    <Calendar className="info-img" />
                    <Controller
                      name="saledate"
                      control={control}
                      rules={{ required: "Create Date is required" }}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value || null}
                          onChange={(date) => field.onChange(date ?? dayjs())}
                          className="filterdatepicker w-100"
                          format="DD-MM-YYYY"
                          placeholder="Choose Date"
                          allowClear
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Invoice No</label>
                <div className="col-md-8">
                  <input type="text" className="form-control" value="" readOnly disabled />
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <h5 className="mb-3">Bill To</h5>
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Customer *</label>
                  <div className="col-md-8">
                    <Controller
                      name="customerid"
                      control={control}
                      rules={{ required: "Bill To customer is required" }}
                      render={({ field }) => (
                        <SelectCustomer
                          trigger={trigger}
                          storeId={parsedStoreId}
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="row g-2 mt-1">
                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Address</label>
                      <div className="col-md-8">
                        <input type="text" className="form-control" value={billToAddress} readOnly disabled />
                        <input type="hidden" {...register("invbilltoadd1")} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">City/State/Zip</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          value={`${watch("invbilltocity") || ""}${watch("invbilltostate") ? ", " + watch("invbilltostate") : ""}${watch("invbilltozip") ? " " + watch("invbilltozip") : ""}`}
                          readOnly
                          disabled
                        />
                        <input type="hidden" {...register("invbilltocity")} />
                        <input type="hidden" {...register("invbilltostate")} />
                        <input type="hidden" {...register("invbilltozip")} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Phone</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          value={watch("invbilltophone") || ""}
                          readOnly
                          disabled
                        />
                        <input type="hidden" {...register("invbilltophone")} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Ship To</h5>
                  <label className="d-flex align-items-center gap-2 m-0">
                    <input type="checkbox" {...register("shipSameAsBill")} />
                    <span>Same as Bill to</span>
                  </label>
                </div>

                <div className="row g-2">
                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Customer</label>
                      <div className="col-md-8">
                        <Controller
                          name="shiptocustomerid"
                          control={control}
                          render={({ field }) => (
                            <SelectCustomer
                              trigger={trigger}
                              storeId={parsedStoreId}
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Company</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          value={shipToCompanyName}
                          onChange={(e) => setValue("invshiptocompanyname", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Address</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          value={shipToAddress}
                          onChange={(e) => setValue("invshiptoadd1", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">City/State/Zip</label>
                      <div className="col-md-8">
                        <div className="row g-1">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control"
                              value={watch("invshiptocity") || ""}
                              onChange={(e) => setValue("invshiptocity", e.target.value)}
                              placeholder="City"
                            />
                          </div>
                          <div className="col-4">
                            <input
                              type="text"
                              className="form-control"
                              value={watch("invshiptostate") || ""}
                              onChange={(e) => setValue("invshiptostate", e.target.value)}
                              placeholder="State"
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="text"
                              className="form-control"
                              value={watch("invshiptozip") || ""}
                              onChange={(e) => setValue("invshiptozip", e.target.value)}
                              placeholder="Zip"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Phone</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          value={watch("invshiptophone") || ""}
                          onChange={(e) => setValue("invshiptophone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>PO #</label>
                <input type="text" className="form-control" {...register("invoicereference")} />
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>Ordered By</label>
                <input type="text" className="form-control" {...register("orderedby")} />
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>Term *</label>
                <Controller
                  name="termsid"
                  control={control}
                  rules={{ required: "Term is required" }}
                  render={({ field }) => (
                    <SelectPaymentTerms trigger={trigger} storeId={parsedStoreId} {...field} />
                  )}
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>Shipping Method *</label>
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

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>Discount %</label>
                <input type="number" step="0.01" className="form-control" {...register("discountpercent")} />
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0">
                <label>Warehouse</label>
                <input
                  type="text"
                  className="form-control"
                  value={currentWarehouse?.warehousename || ""}
                  readOnly
                  disabled
                />
                <input
                  type="hidden"
                  {...register("warehouseid", {
                    valueAsNumber: true,
                    required: true,
                    min: 1,
                  })}
                />
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-12">
              <div className="border rounded p-3">
                <div className="table-responsive">
                  <div className="row g-3 align-items-end">
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        <label>Search/Scan Item/Barcode *</label>
                        <SelectProduct
                          storeId={parsedStoreId}
                          hasWarehouseId={true}
                          warehouseId={parsedWarehouseId}
                          onProductsLoaded={setProducts}
                          trigger={trigger}
                          value={toolItem.itemid}
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
                                unitprice: 0,
                              }));
                              return;
                            }
                            setToolItem((prev) => ({
                              ...prev,
                              itemid: Number(selected.itemid),
                              itemcode: selected.itemcode,
                              itemdescription: selected.itemdescription,
                              itemtaxable: toNum(selected.itemtaxable),
                              itemquantity: mode === "CREDIT_INVOICE" ? -1 : 1,
                              unitprice: Number(selected.itemsellprice || 0),
                              discountpercent: Number(watch("discountpercent") || 0),
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-lg-2 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        <label>Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={toolItem.itemdescription || ""}
                          onChange={(e) =>
                            setToolItem((prev) => ({ ...prev, itemdescription: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        <label>Pcs</label>
                        <input
                          type="number"
                          className="form-control px-1 text-end"
                          value={toolItem.itempcs}
                          onChange={(e) =>
                            setToolItem((prev) => ({ ...prev, itempcs: toNum(e.target.value) }))
                          }
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                      <div className="input-blocks">
                        <label>Quantity *</label>
                        <input
                          type="number"
                          step="0.001"
                          className="form-control px-1 text-end"
                          value={toolItem.itemquantity}
                          onChange={(e) => {
                            const n = Number(e.target.value || 0);
                            const abs = Math.abs(n);
                            const normalizedAbs = Math.round(abs * 1000) / 1000;
                            const normalized = mode === "CREDIT_INVOICE" ? -normalizedAbs : normalizedAbs;
                            setToolItem((prev) => ({ ...prev, itemquantity: normalized }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        <label>Unit Price *</label>
                        <input
                          type="number"
                          step="0.001"
                          min={0}
                          className="form-control px-1 text-end"
                          value={toolItem.unitprice}
                          onChange={(e) => {
                            const n = Math.max(0, Number(e.target.value || 0));
                            const normalized = Math.round(n * 1000) / 1000;
                            setToolItem((prev) => ({ ...prev, unitprice: normalized }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        <label>Discount %</label>
                        <input
                          type="number"
                          step="0.001"
                          min={0}
                          max={100}
                          className="form-control px-1 text-end"
                          value={toolItem.discountpercent}
                          onChange={(e) => {
                            const n = Number(e.target.value || 0);
                            const clamped = Math.min(100, Math.max(0, n));
                            const normalized = Math.round(clamped * 1000) / 1000;
                            setToolItem((prev) => ({ ...prev, discountpercent: normalized }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                      <div className="input-blocks">
                        <label>Ext Price</label>
                        <input
                          type="text"
                          className="form-control px-1 text-end"
                          value={(() => {
                            const line = computeLine(
                              {
                                itemquantity: toolItem.itemquantity,
                                unitprice: toolItem.unitprice,
                                discountpercent: toolItem.discountpercent,
                              },
                              mode
                            );
                            return formatMoney(line.net);
                          })()}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="col-lg-1 col-md-6 col-sm-12">
                      <div className="input-blocks">
                        {editingIndex == null ? (
                          <button
                            type="button"
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                            onClick={handleSaveToolItem}
                          >
                            <PlusCircle />
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
                              onClick={() => {
                                setEditingIndex(null);
                                resetToolItem();
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
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
                          <th className="text-center text-nowrap">Tax</th>
                          <th className="text-end text-nowrap">Pcs</th>
                          <th className="text-end text-nowrap">Qty</th>
                          <th className="text-end text-nowrap">Unit Price</th>
                          <th className="text-end text-nowrap">Discount %</th>
                          <th className="text-end text-nowrap">Ext. Price</th>
                          <th className="text-center text-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemFields.map((field, index) => {
                          const item = watch(`items.${index}`);
                          const line = computeLine(item, mode);
                          return (
                            <tr key={field.id} className="align-middle">
                              <td>{index + 1}</td>
                              <td className="text-nowrap">{item?.itemcode || ""}</td>
                              <td>{item?.itemdescription || ""}</td>
                              <td className="text-center">
                                {toNum(item?.itemtaxable) === 1 ? "Y" : "N"}
                              </td>
                              <td className="text-end">{toNum(item?.itempcs) || 0}</td>
                              <td className="text-end">{line.qty}</td>
                              <td className="text-end">{formatMoney(line.unit)}</td>
                              <td className="text-end">{line.disc}</td>
                              <td className="text-end">{formatMoney(line.net)}</td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary me-2"
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
                                    });
                                  }}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                      value={itemFields.length}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-3 row align-items-center">
                  <label className="col-form-label col-md-4">Total Pcs</label>
                  <div className="col-md-8">
                    <input
                      type="number"
                      className="form-control"
                      value={totals.totalPcs}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-3 row align-items-center">
                  <label className="col-form-label col-md-4">Shipping Date</label>
                  <div className="col-md-8">
                    <div className="input-groupicon calender-input">
                      <Calendar className="info-img" />
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
                  </div>
                </div>

                <div className="input-blocks mb-3 row align-items-center">
                  <label className="col-form-label col-md-4">Tracking #</label>
                  <div className="col-md-8">
                    <input type="text" className="form-control" {...register("shippingtrackingno")} />
                  </div>
                </div>

                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Customer Message</label>
                  <div className="col-md-8">
                    <textarea className="form-control" rows={4} {...register("remarks")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Total Sale</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.grossTotal)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Discount Amount</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.discountAmount)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Subtotal</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.subtotal)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Sales Tax</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.salesTax)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Shipping</label>
                      <div className="col-md-8">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control text-end"
                          {...register("shipping")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Invoice Total</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.invoiceTotal)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Amount Paid</label>
                      <div className="col-md-8">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control text-end"
                          {...register("amountreceived")}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Balance Due</label>
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(totals.balanceDue)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionFooter handleCancel={handleCancel}>
        <ButtonLoader loading={saving} btnText="Save" loadingText="Saving ..." />
      </ActionFooter>
    </form>
  );
};

export default SalesInvoiceForm;
