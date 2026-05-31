"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs, { Dayjs } from "dayjs";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
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

import { CREATE_SALES_ORDER_MUTATION, EDIT_SALES_ORDER_MUTATION } from "@/lib/graphql/mutations/sales";
import { GET_SALES_ORDER_QUERY } from "@/lib/graphql/query/sales";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import useDefaultRoute from "@/hooks/useDefaultRoute";

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
  discountpercent?: number;
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

const SalesOrderForm = ({ salesorderno: salesordernoEdit }: { salesorderno?: number }) => {
  const isEdit = salesordernoEdit != null;
  const router = useRouter();
  const dispatch = useDispatch();
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

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
      discountpercent: 0,
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

  const { fields: itemFields, append, remove, update } = useFieldArray({ control, name: "items" });

  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();
  useEffect(() => {
    if (parsedStoreId) fetchWarehouseByStoreId(parsedStoreId);
  }, [fetchWarehouseByStoreId, parsedStoreId]);

  const currentWarehouse = useMemo(() => warehouses.find((w) => w.issystem) ?? warehouses[0], [warehouses]);

  useEffect(() => {
    if (!warehouses?.length) return;
    const current = getValues("warehouseid");
    if (Number.isFinite(Number(current)) && Number(current) > 0) return;
    if (currentWarehouse?.warehouseid) {
      setValue("warehouseid", Number(currentWarehouse.warehouseid), { shouldDirty: false, shouldTouch: false });
    }
  }, [currentWarehouse, getValues, setValue, warehouses]);

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
      discountpercent: so.discountpercent ?? 0,
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
        itemcode: it.itemcode,
        itemdescription: it.itemdescription,
        itempcs: toNum(it.itempcs),
        itemquantity: toNum(it.itemquantity),
        unitprice: toNum(it.unitprice),
        discountpercent: toNum(it.discountpercent),
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
      discountpercent: toNum(values.discountpercent),
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
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
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

            <div className="col-md-2">
              <label className="form-label">Order Date</label>
              <Controller
                control={control}
                name="orderdate"
                render={({ field }) => (
                  <DatePicker
                    className="form-control"
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    suffixIcon={<Calendar size={14} />}
                    format="MM/DD/YYYY"
                    allowClear={false}
                  />
                )}
              />
            </div>

            <div className="col-md-3">
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

            <div className="col-md-3">
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

            <div className="col-md-2">
              <label className="form-label">Discount %</label>
              <input
                type="number"
                className="form-control"
                step="0.001"
                min={0}
                max={100}
                {...register("discountpercent", { valueAsNumber: true })}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Shipping</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min={0}
                {...register("shipping", { valueAsNumber: true })}
              />
            </div>

            <div className="col-md-8">
              <label className="form-label">Remarks</label>
              <input type="text" className="form-control" {...register("remarks")} />
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <h6 className="fw-semibold mb-2">Bill To</h6>
              <input className="form-control mb-2" placeholder="Company" {...register("invbilltocompanyname")} />
              <input className="form-control mb-2" placeholder="Address" {...register("invbilltoadd1")} />
              <div className="row g-2">
                <div className="col-5"><input className="form-control" placeholder="City" {...register("invbilltocity")} /></div>
                <div className="col-3"><input className="form-control" placeholder="State" {...register("invbilltostate")} /></div>
                <div className="col-4"><input className="form-control" placeholder="Zip" {...register("invbilltozip")} /></div>
              </div>
              <input className="form-control mt-2" placeholder="Phone" {...register("invbilltophone")} />
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2 mb-2">
                <h6 className="fw-semibold mb-0">Ship To</h6>
                <div className="form-check mb-0">
                  <input className="form-check-input" type="checkbox" id="shipSameAsBill" {...register("shipSameAsBill")} />
                  <label className="form-check-label small" htmlFor="shipSameAsBill">Same as Bill To</label>
                </div>
              </div>
              {!shipSameAsBill && (
                <div className="mb-2">
                  <label className="form-label small">Ship To Customer</label>
                  <Controller
                    control={control}
                    name="shiptocustomerid"
                    render={({ field }) => (
                      <SelectCustomer storeId={parsedStoreId} value={field.value} onChange={(val: number | undefined) => field.onChange(val)} trigger={trigger} />
                    )}
                  />
                </div>
              )}
              <input className="form-control mb-2" placeholder="Company" {...register("invshiptocompanyname")} disabled={shipSameAsBill} />
              <input className="form-control mb-2" placeholder="Address" {...register("invshiptoadd1")} disabled={shipSameAsBill} />
              <div className="row g-2">
                <div className="col-5"><input className="form-control" placeholder="City" {...register("invshiptocity")} disabled={shipSameAsBill} /></div>
                <div className="col-3"><input className="form-control" placeholder="State" {...register("invshiptostate")} disabled={shipSameAsBill} /></div>
                <div className="col-4"><input className="form-control" placeholder="Zip" {...register("invshiptozip")} disabled={shipSameAsBill} /></div>
              </div>
              <input className="form-control mt-2" placeholder="Phone" {...register("invshiptophone")} disabled={shipSameAsBill} />
            </div>
          </div>
        </div>
      </div>

      {/* Item Entry Tool */}
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">{editingIndex != null ? "Edit Item" : "Add Item"}</h6>
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Product</label>
              <SelectProduct
                storeId={parsedStoreId}
                hasWarehouseId={true}
                warehouseId={watch("warehouseid")}
                onProductsLoaded={(items: ItemDetails[]) => setProducts(items)}
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
                    itemquantity: 1,
                    unitprice: Number(selected.itemsellprice || 0),
                    discountpercent: toNum(watch("discountpercent")),
                  }));
                }}
              />
            </div>
            <div className="col-md-1">
              <label className="form-label small">Pcs</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                step="1"
                value={toolItem.itempcs}
                onChange={(e) => setToolItem((p) => ({ ...p, itempcs: toNum(e.target.value) }))}
              />
            </div>
            <div className="col-md-1">
              <label className="form-label small">Qty <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={1}
                step="1"
                value={toolItem.itemquantity}
                onChange={(e) => setToolItem((p) => ({ ...p, itemquantity: toNum(e.target.value) }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Unit Price</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                step="0.01"
                value={toolItem.unitprice}
                onChange={(e) => setToolItem((p) => ({ ...p, unitprice: toNum(e.target.value) }))}
              />
            </div>
            <div className="col-md-1">
              <label className="form-label small">Disc %</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                max={100}
                step="0.1"
                value={toolItem.discountpercent ?? 0}
                onChange={(e) => setToolItem((p) => ({ ...p, discountpercent: toNum(e.target.value) }))}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Extended</label>
              <input type="text" className="form-control form-control-sm bg-light" readOnly value={formatMoney(toolLine.net)} />
            </div>
            <div className="col-md-1 d-flex gap-1">
              <button type="button" className="btn btn-success btn-sm" onClick={handleSaveToolItem}>
                {editingIndex != null ? <Check size={14} /> : <PlusCircle size={14} />}
              </button>
              {editingIndex != null && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditingIndex(null); resetToolItem(); }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card mb-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="text-end">Pcs</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Disc %</th>
                  <th className="text-end">Extended</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itemFields.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted py-4">No items added yet</td></tr>
                ) : (
                  itemFields.map((field, index) => {
                    const line = computeLine(field);
                    const prod = productById.get(Number(field.itemid));
                    return (
                      <tr key={field.id} className={editingIndex === index ? "table-warning" : ""}>
                        <td>{index + 1}</td>
                        <td>{field.itemcode ?? prod?.itemcode ?? "—"}</td>
                        <td>{field.itemdescription ?? prod?.itemdescription ?? "—"}</td>
                        <td className="text-end">{toNum(field.itempcs)}</td>
                        <td className="text-end">{toNum(field.itemquantity)}</td>
                        <td className="text-end">{formatMoney(field.unitprice)}</td>
                        <td className="text-end">{toNum(field.discountpercent).toFixed(1)}%</td>
                        <td className="text-end">{formatMoney(line.net)}</td>
                        <td>
                          <div className="d-flex gap-1 justify-content-end">
                            <button type="button" className="btn btn-outline-primary btn-xs p-1" onClick={() => handleEditItem(index)}>
                              <Edit2 size={12} />
                            </button>
                            <button type="button" className="btn btn-outline-danger btn-xs p-1" onClick={() => handleRemoveItem(index)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
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

      {/* Totals */}
      <div className="row justify-content-end mb-4">
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

      <ActionFooter handleCancel={handleDeleteConfirm}>
        <ButtonLoader
          loading={saving}
          btnText="Save Sales Order"
          loadingText="Saving..."
          type="submit"
          className="btn btn-primary"
        />
      </ActionFooter>
    </form>
  );
};

export default SalesOrderForm;
