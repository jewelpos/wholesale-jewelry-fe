"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
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
import type { ProductSettingsInfo } from "@/types/product";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";

const MySwal = withReactContent(Swal);

type SalesOrderItemForm = {
  itemid?: number;
  itemcode?: string;
  itemdescription?: string;
  itemtaxable?: number;
  itempcs?: number;
  itemquantity?: number;
  unitprice?: number;
  discountpercent?: number;
  invoicepcs?: number;
  invoiceqty?: number;
  bordpcs?: number;
  bordqty?: number;
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
  const config = getEnvironmentConfig();
  const [emailModalSONumber, setEmailModalSONumber] = useState<number | null>(null);

  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: 0 },
    skip: !parsedStoreId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;
  const allowPcsEntry = productSettings == null || !!productSettings.allowpcsentry;
  const allowCarriage = productSettings != null && !!productSettings.allowcarriage;
  const [productClearKey, setProductClearKey] = useState(0);

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
  const productById = useMemo(() => {
    const map = new Map<number, ItemDetails>();
    products.forEach((p) => map.set(Number(p.itemid), p));
    return map;
  }, [products]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toolItem, setToolItem] = useState<ToolItem>({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: undefined,
    itemtaxable: undefined,
    itempcs: 0,
    itemquantity: 1,
    unitprice: 0,
    discountpercent: 0,
  });

  const [createSalesOrder, { loading: savingCreate }] = useMutation(CREATE_SALES_ORDER_MUTATION);
  const [editSalesOrder, { loading: savingEdit }] = useMutation(EDIT_SALES_ORDER_MUTATION);
  const saving = savingCreate || savingEdit;

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
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
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
    return { totalItems: items.length, totalPcs, grossTotal, discountAmount, subtotal, shipping, orderTotal };
  }, [watchedDiscountPercent, watchedItems, watchedShipping]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => { reset(); router.back(); },
  });

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined, itemcode: undefined, itemdescription: undefined, itemtaxable: undefined,
      itempcs: 0, itemquantity: 1, unitprice: 0, discountpercent: invoiceDiscountPrefill,
    });
  };

  const autoAddItem = (selected: ItemDetails) => {
    const itemid = Number(selected.itemid);
    const discountPct = Math.min(100, Math.max(0, Number(watch("discountpercent") || 0)));
    const currentItems: SalesOrderItemForm[] = getValues("items") || [];
    const dupIndex = currentItems.findIndex((it) => Number(it.itemid) === itemid);
    if (dupIndex >= 0) {
      const existing = currentItems[dupIndex];
      update(dupIndex, { ...existing, itemquantity: Number(existing.itemquantity || 0) + 1 });
    } else {
      append({
        itemid,
        itemcode: selected.itemcode,
        itemdescription: selected.itemdescription,
        itemtaxable: toNum(selected.itemtaxable),
        itempcs: 0,
        itemquantity: 1,
        unitprice: Number(selected.itemsellprice || 0),
        discountpercent: discountPct,
      });
    }
    resetToolItem();
    setProductClearKey((k) => k + 1);
  };

  const handleSaveToolItem = () => {
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

    const newItem: SalesOrderItemForm = {
      itemid: toolItem.itemid,
      itemcode: toolItem.itemcode,
      itemdescription: toolItem.itemdescription,
      itemtaxable: toolItem.itemtaxable,
      itempcs: toNum(toolItem.itempcs),
      itemquantity: qty,
      unitprice: toNum(toolItem.unitprice),
      discountpercent: toNum(toolItem.discountpercent),
    };

    if (editingIndex != null) {
      update(editingIndex, newItem);
      setEditingIndex(null);
    } else {
      append(newItem);
    }
    resetToolItem();
  };

  const handleEditItem = (index: number) => {
    const item = itemFields[index];
    setEditingIndex(index);
    setToolItem({
      itemid: item.itemid,
      itemcode: item.itemcode,
      itemdescription: item.itemdescription,
      itemtaxable: item.itemtaxable,
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
      items: values.items.map((it) => ({
        ...(it.itemid != null ? { itemid: it.itemid } : {}),
        itemcode: it.itemcode ?? null,
        itemdescription: it.itemdescription ?? null,
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
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
          const response = await api.post(`${config.apiUrl}/store/sales-order/print`, { storeid: parsedStoreId, salesordernumbers: [soNumber] }, { responseType: "blob" });
          if (response.data) {
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const tab = window.open(url, "_blank");
            if (!tab) {
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `sales-order-${soNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
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
      {/* Header + Bill To / Ship To */}
      <div className="card mb-3">
        <div className="card-body">

          {/* Row 1: Order Date + SO Number */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6 col-md-6">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Order Date</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="orderdate"
                    render={({ field }) => (
                      <DatePicker
                        className="form-control w-100"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        suffixIcon={<Calendar size={14} />}
                        format="MM/DD/YYYY"
                        allowClear={false}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">SO Number</label>
                <div className="col-md-8">
                  <input type="text" className="form-control" value={salesordernoEdit ?? ""} readOnly disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Bill To / Ship To */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <h5 className="mb-3">Bill To</h5>
                <div className="input-blocks mb-2 row align-items-center">
                  <label className="col-form-label col-md-4">Customer <span className="text-danger">*</span></label>
                  <div className="col-md-8">
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
                          {fieldState.error && <div className="text-danger small">{fieldState.error.message}</div>}
                        </>
                      )}
                    />
                  </div>
                </div>
                <div className="row g-2 mt-1">
                  <div className="col-12">
                    <input className="form-control" placeholder="Address" {...register("invbilltoadd1")} />
                  </div>
                  <div className="col-5"><input className="form-control" placeholder="City" {...register("invbilltocity")} /></div>
                  <div className="col-3"><input className="form-control" placeholder="State" {...register("invbilltostate")} /></div>
                  <div className="col-4"><input className="form-control" placeholder="Zip" {...register("invbilltozip")} /></div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Phone" {...register("invbilltophone")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Ship To</h5>
                  <label className="d-flex align-items-center gap-2 m-0">
                    <input className="form-check-input" type="checkbox" id="shipSameAsBill" {...register("shipSameAsBill")} />
                    <span className="small">Same as Bill To</span>
                  </label>
                </div>
                {!shipSameAsBill && (
                  <div className="input-blocks mb-2 row align-items-center">
                    <label className="col-form-label col-md-4">Customer</label>
                    <div className="col-md-8">
                      <Controller
                        control={control}
                        name="shiptocustomerid"
                        render={({ field }) => (
                          <SelectCustomer storeId={parsedStoreId} value={field.value} onChange={(val: number | undefined) => field.onChange(val)} trigger={trigger} />
                        )}
                      />
                    </div>
                  </div>
                )}
                <div className="row g-2 mt-1">
                  <div className="col-12">
                    <input className="form-control" placeholder="Company" {...register("invshiptocompanyname")} disabled={shipSameAsBill} />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Address" {...register("invshiptoadd1")} disabled={shipSameAsBill} />
                  </div>
                  <div className="col-5"><input className="form-control" placeholder="City" {...register("invshiptocity")} disabled={shipSameAsBill} /></div>
                  <div className="col-3"><input className="form-control" placeholder="State" {...register("invshiptostate")} disabled={shipSameAsBill} /></div>
                  <div className="col-4"><input className="form-control" placeholder="Zip" {...register("invshiptozip")} disabled={shipSameAsBill} /></div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Phone" {...register("invshiptophone")} disabled={shipSameAsBill} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Warehouse, Terms, Shipping Method, Discount, Shipping, Remarks */}
          <div className="row g-3">
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Warehouse</label>
              <input
                type="text"
                className="form-control"
                value={currentWarehouse?.warehousename || ""}
                readOnly
                disabled
              />
              <input type="hidden" {...register("warehouseid", { valueAsNumber: true, required: true, min: 1 })} />
            </div>
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Terms</label>
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
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Shipping Method</label>
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
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Discount %</label>
              <input
                type="number"
                className="form-control"
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
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Sales Tax %</label>
              <input
                type="number"
                className="form-control"
                step="0.001"
                min={0}
                max={100}
                {...register("salestaxrate", { valueAsNumber: true })}
              />
            </div>
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Shipping</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min={0}
                {...register("shipping", { valueAsNumber: true })}
              />
            </div>
            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label">Ordered By</label>
              <input type="text" className="form-control" {...register("orderedby")} />
            </div>
          </div>

        </div>
      </div>

      {/* Item Entry Tool + Line Items */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="border rounded p-3">
            <div className="table-responsive">
              <div className="row g-3 align-items-end">
                <div className="col-lg-4 col-md-6 col-sm-12">
                  <div className="input-blocks">
                    <label>Search/Scan Item/Barcode</label>
                    <SelectProduct
                      storeId={parsedStoreId}
                      hasWarehouseId={true}
                      warehouseId={watch("warehouseid")}
                      onProductsLoaded={(items: ItemDetails[]) => setProducts(items)}
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
                            unitprice: 0,
                          }));
                          return;
                        }
                        if (allowCarriage) {
                          autoAddItem(selected);
                          return;
                        }
                        setToolItem((prev) => ({
                          ...prev,
                          itemid: Number(selected.itemid),
                          itemcode: selected.itemcode,
                          itemdescription: selected.itemdescription,
                          itemtaxable: toNum(selected.itemtaxable),
                          itemquantity: 1,
                          unitprice: Number(selected.itemsellprice || 0),
                          discountpercent: toNum(watch("discountpercent")),
                        }));
                      }}
                      onNotFound={() =>
                        dispatch(showNotification({ message: "Item not found", type: NOTIFICATION_TYPES.ERROR }))
                      }
                    />
                  </div>
                </div>

                <div className={`${allowPcsEntry ? "col-lg-2" : "col-lg-3"} col-md-6 col-sm-12`}>
                  <div className="input-blocks">
                    <label>Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={toolItem.itemdescription || ""}
                      onChange={(e) => setToolItem((prev) => ({ ...prev, itemdescription: e.target.value }))}
                    />
                  </div>
                </div>

                {allowPcsEntry && (
                <div className="col-lg-1 col-md-6 col-sm-12">
                  <div className="input-blocks">
                    <label>Pc</label>
                    <input
                      type="number"
                      className="form-control px-1 text-end"
                      min={0}
                      step="1"
                      value={toolItem.itempcs}
                      onChange={(e) => setToolItem((p) => ({ ...p, itempcs: toNum(e.target.value) }))}
                    />
                  </div>
                </div>
                )}

                <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                  <div className="input-blocks">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      className="form-control px-1 text-end"
                      min={1}
                      step="0.001"
                      value={toolItem.itemquantity}
                      onChange={(e) => setToolItem((p) => ({ ...p, itemquantity: toNum(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  <div className="input-blocks">
                    <label>Unit Price *</label>
                    <input
                      type="number"
                      className="form-control px-1 text-end"
                      min={0}
                      step="0.001"
                      value={toolItem.unitprice}
                      onChange={(e) => setToolItem((p) => ({ ...p, unitprice: toNum(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12">
                  <div className="input-blocks">
                    <label>Discount %</label>
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
                </div>

                <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                  <div className="input-blocks">
                    <label>Ext Price</label>
                    <input
                      type="text"
                      className="form-control px-1 text-end"
                      readOnly
                      value={formatMoney(toolLine.net)}
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
                          onClick={() => { setEditingIndex(null); resetToolItem(); }}
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
                      <th style={{ minWidth: readOnly ? (allowPcsEntry ? "160px" : "320px") : (allowPcsEntry ? "180px" : "220px") }}>Description</th>
                      <th className="text-center text-nowrap">Tax</th>
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
                      <tr><td colSpan={(readOnly ? 14 : 10) - (allowPcsEntry ? 0 : readOnly ? 3 : 1)} className="text-center text-muted py-4">No items added yet</td></tr>
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
                            {allowPcsEntry && <td className="text-end">{toNum(item.itempcs)}</td>}
                            {allowPcsEntry && readOnly && <td className="text-end">{toNum(item.invoicepcs)}</td>}
                            {allowPcsEntry && readOnly && <td className="text-end">{toNum(item.bordpcs)}</td>}
                            <td className="text-end">{toNum(item.itemquantity)}</td>
                            {readOnly && <td className="text-end">{toNum(item.invoiceqty)}</td>}
                            {readOnly && <td className="text-end">{toNum(item.bordqty)}</td>}
                            <td className="text-end">{formatMoney(item.unitprice)}</td>
                            <td className="text-end">{toNum(item.discountpercent).toFixed(1)}%</td>
                            <td className="text-end">{formatMoney(line.net)}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleEditItem(index)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks + Totals */}
      <div className="row mb-4">
        <div className="col-md-8">
          <label className="form-label">Remarks</label>
          <textarea className="form-control" rows={5} {...register("remarks")} />
        </div>
        <div className="col-md-4">
          <table className="table table-sm">
            <tbody>
              <tr><td>Items</td><td className="text-end">{totals.totalItems}</td></tr>
              <tr><td>Gross Total</td><td className="text-end">{formatMoney(totals.grossTotal)}</td></tr>
              <tr><td>Discount</td><td className="text-end text-danger">-{formatMoney(totals.discountAmount)}</td></tr>
              <tr><td>Subtotal</td><td className="text-end">{formatMoney(totals.subtotal)}</td></tr>
              <tr><td>Shipping</td><td className="text-end">{formatMoney(totals.shipping)}</td></tr>
              <tr className="fw-bold"><td>Order Total</td><td className="text-end">{formatMoney(totals.orderTotal)}</td></tr>
            </tbody>
          </table>
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
    </>
  );
};

export default SalesOrderForm;
