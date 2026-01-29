"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
import { DatePicker } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectPurchaseOrder from "@/components/forms/SelectPurchaseOrder";
import SelectProduct from "@/components/forms/SelectProduct";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { Controller, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_PURCHASE_ORDER_MUTATION,
  EDIT_PURCHASE_ORDER_MUTATION,
  RETURN_PURCHASE_ORDER_MUTATION,
} from "@/lib/graphql/mutations/purchase";
import {
  GET_PURCHASE_ORDER_STATUS_LIST_QUERY,
  GET_SINGLE_PURCHASE_ORDER_QUERY,
} from "@/lib/graphql/query/purchase";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import useSupplier from "@/hooks/useSupplier";
import useOutlets from "@/hooks/useOutlets";
import useWarehouse from "@/hooks/useWarehouse";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { PurchaseOrderFormType, Status } from "@/types/purchase";
import { ItemDetails } from "@/hooks/useProducts";

const PURCHASE_ORDER_SAVE_MODE = {
  BACKORDER: "SAVE_AS_BACKORDER",
  RECEIVE: "SAVE_AND_RECEIVE",
} as const;

const MySwal = withReactContent(Swal);

const TextEditor = () => {
  return <div />;
};

const PurchaseOrderForm = ({
  disableField,
  isReturnOrder,
}: {
  disableField?: boolean;
  isReturnOrder?: boolean;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam, ponumber: ponumberParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = outletIdParam ? parseInt(outletIdParam as string, 10) : NaN;
  const parsedPoNumber = ponumberParam ? parseInt(ponumberParam as string, 10) : NaN;
  const isEdit = Number.isFinite(parsedPoNumber);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [removedItemIds, setRemovedItemIds] = useState<number[]>([]);
  const [returnOrderPoNumber, setReturnOrderPoNumber] = useState<number>(0);

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

  const [createPurchaseOrder, { loading: creating }] = useMutation(
    CREATE_PURCHASE_ORDER_MUTATION
  );

  const [editPurchaseOrder, { loading: updating }] = useMutation(
    EDIT_PURCHASE_ORDER_MUTATION
  );

  const [returnPurchaseOrder, { loading: returning }] = useMutation(
    RETURN_PURCHASE_ORDER_MUTATION
  );

  const { data: poData, loading: poLoading } = useQuery(
    GET_SINGLE_PURCHASE_ORDER_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        ponumber: parsedPoNumber,
      },
      skip: !isEdit || !parsedStoreId,
    }
  );

  const { data: returnPoData } = useQuery(
    GET_SINGLE_PURCHASE_ORDER_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        ponumber: returnOrderPoNumber,
      },
      skip:
        !isReturnOrder ||
        !parsedStoreId ||
        !Number.isFinite(returnOrderPoNumber) ||
        returnOrderPoNumber <= 0,
      fetchPolicy: "no-cache",
    }
  );

  const { data: poStatusData } = useQuery(GET_PURCHASE_ORDER_STATUS_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
    },
    skip: !isEdit || !parsedStoreId,
  });

  const poStatuses = (poStatusData?.getPurchaseOrderStatusList ?? []) as Status[];
  const poStatusById = useMemo(() => {
    const map = new Map<number, Status>();
    for (const s of poStatuses) {
      if (typeof s?.statusid === "number") map.set(s.statusid, s);
    }
    return map;
  }, [poStatuses]);

  const {
    control,
    handleSubmit,
    register,
    trigger,
    formState: { isDirty },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm<PurchaseOrderFormType>({
    defaultValues: {
      storeid: parsedStoreId,
      supplierid: "",
      warehouseid: "",
      saveMode: "save",
      podate: dayjs(),
      porequestdate: dayjs(),
      poconfirmedto: "",
      poremarks: "",
      poshippingmethod: "",
      podiscount: "",
      podiscountamt: "",
      posubtotal: "",
      pofreight: "",
      posalestax: "",
      podutypaid: "",
      posales: "",
      pototal: "",
      pototalwithoutdiscount: "",
      termsid: undefined,
      pomode: undefined,
      rmano: "",
      poordtocompanyname: "",
      poordtoadd1: "",
      poordtoadd2: "",
      poordtocity: "",
      poordtostate: "",
      poordtozip: "",
      poordtocountry: "",
      poordtophone: "",
      poshiptocompanyname: "",
      poshiptoadd1: "",
      poshiptoadd2: "",
      poshiptocity: "",
      poshiptostate: "",
      poshiptozip: "",
      poshiptocountry: "",
      poshiptophone: "",
      postatus: "",
      items: [],
    },
    mode: "all",
  });

  const { fields: itemFields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const supplierIdValue = watch("supplierid");

  const { fetchSupplier, supplier } = useSupplier();
  useEffect(() => {
    const supplierIdNumber = Number(supplierIdValue);
    if (parsedStoreId && Number.isFinite(supplierIdNumber) && supplierIdNumber > 0) {
      fetchSupplier(parsedStoreId, supplierIdNumber);
    }
  }, [fetchSupplier, parsedStoreId, supplierIdValue]);

  useEffect(() => {
    if (!supplier) return;
    if (isEdit) return;

    if (isReturnOrder) {
      setValue("poshiptocompanyname", supplier.companyname ?? "");
      setValue("poshiptoadd1", supplier.address1 ?? "");
      setValue("poshiptoadd2", supplier.address2 ?? "");
      setValue("poshiptocity", supplier.city ?? "");
      setValue("poshiptostate", supplier.state ?? "");
      setValue("poshiptozip", supplier.zipcode ?? "");
      setValue("poshiptocountry", supplier.country ?? "");
      setValue("poshiptophone", supplier.phone1 ?? supplier.phone2 ?? "");
      return;
    }

    setValue("poordtocompanyname", supplier.companyname ?? "");
    setValue("poordtoadd1", supplier.address1 ?? "");
    setValue("poordtoadd2", supplier.address2 ?? "");
    setValue("poordtocity", supplier.city ?? "");
    setValue("poordtostate", supplier.state ?? "");
    setValue("poordtozip", supplier.zipcode ?? "");
    setValue("poordtocountry", supplier.country ?? "");
    setValue("poordtophone", supplier.phone1 ?? supplier.phone2 ?? "");
  }, [supplier, setValue, isEdit, isReturnOrder]);

  const { fetchOutletsList, outlets } = useOutlets();
  useEffect(() => {
    if (parsedStoreId) {
      fetchOutletsList([parsedStoreId]);
    }
  }, [fetchOutletsList, parsedStoreId]);

  const currentOutlet = useMemo(() => {
    if (!Number.isFinite(parsedOutletId)) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (outlets as any[])?.find((o) => Number(o.outletid) === Number(parsedOutletId));
  }, [outlets, parsedOutletId]);

  useEffect(() => {
    if (!currentOutlet) return;
    if (isEdit) return;

    if (isReturnOrder) {
      setValue("poordtocompanyname", currentOutlet.outletname ?? "");
      setValue("poordtoadd1", currentOutlet.address ?? "");
      setValue("poordtoadd2", "");
      setValue("poordtocity", currentOutlet.city ?? "");
      setValue("poordtostate", currentOutlet.state ?? "");
      setValue("poordtozip", currentOutlet.zipcode ?? "");
      setValue("poordtocountry", currentOutlet.country ?? "");
      setValue("poordtophone", currentOutlet.storephone ?? "");
      return;
    }

    setValue("poshiptocompanyname", currentOutlet.outletname ?? "");
    setValue("poshiptoadd1", currentOutlet.address ?? "");
    setValue("poshiptoadd2", "");
    setValue("poshiptocity", currentOutlet.city ?? "");
    setValue("poshiptostate", currentOutlet.state ?? "");
    setValue("poshiptozip", currentOutlet.zipcode ?? "");
    setValue("poshiptocountry", currentOutlet.country ?? "");
    setValue("poshiptophone", currentOutlet.storephone ?? "");
  }, [currentOutlet, setValue, isEdit, isReturnOrder]);

  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const currentWarehouse = useMemo(
    () => warehouses.find((w) => w.issystem),
    [warehouses]
  );

  const watchedWarehouseId = watch("warehouseid");
  const parsedWarehouseId = useMemo(() => {
    const n = typeof watchedWarehouseId === "number" ? watchedWarehouseId : Number(watchedWarehouseId);
    return Number.isFinite(n) ? n : undefined;
  }, [watchedWarehouseId]);

  const [products, setProducts] = useState<ItemDetails[]>([]);

  const productById = useMemo(() => {
    const map = new Map<number, { itemcode: string; itemdescription: string }>();
    products.forEach((p) => {
      map.set(Number(p.itemid), {
        itemcode: p.itemcode ?? "",
        itemdescription: p.itemdescription ?? "",
      });
    });
    return map;
  }, [products]);

  useEffect(() => {
    if (Number.isFinite(parsedOutletId)) {
      fetchWarehouseByOutletId(parsedOutletId);
    }
  }, [fetchWarehouseByOutletId, parsedOutletId]);

  useEffect(() => {
    if (isEdit) return;
    const currentWarehouseId = getValues("warehouseid");
    if (currentWarehouse && !currentWarehouseId) {
      setValue("warehouseid", currentWarehouse.warehouseid);
    }
  }, [currentWarehouse, getValues, isEdit, setValue]);

  const calculateOrdExtendedPrice = (
    qtyordered: number,
    orderunitcost: number,
    orddiscount: number
  ) => {
    const discountMultiplier = 1 - (orddiscount || 0) / 100;
    const value = qtyordered * orderunitcost * discountMultiplier;
    return Math.round(value * 1000) / 1000;
  };

  const watchedPoDiscount = watch("podiscount");
  const defaultItemDiscount = useMemo(() => {
    const raw = watchedPoDiscount;
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }, [watchedPoDiscount]);

  const watchedItems = watch("items");
  const watchedTaxPct = watch("posales");
  const watchedFreight = watch("pofreight");
  const watchedDutyPaid = watch("podutypaid");
  useEffect(() => {
    const totals = (watchedItems || []).reduce(
      (acc, item) => {
        const qty = Number(item?.qtyordered || 0);
        const price = Number(item?.orderunitcost || 0);
        const lineTotal = qty * price;
        const discountPct = Number(item?.orddiscount || 0);
        const savedExtPrice = Number(item?.ordextendedprice as unknown as number);
        const extPrice = Number.isFinite(savedExtPrice)
          ? savedExtPrice
          : calculateOrdExtendedPrice(qty, price, discountPct);

        acc.grossTotal += lineTotal;
        acc.discountAmount += lineTotal - extPrice;
        return acc;
      },
      { grossTotal: 0, discountAmount: 0 }
    );

    const normalizedTotal = Math.round(totals.grossTotal * 1000) / 1000;
    const normalizedDiscountAmt = Math.round(totals.discountAmount * 1000) / 1000;

    const normalizedSubTotal = Math.round((normalizedTotal - normalizedDiscountAmt) * 1000) / 1000;
    const taxPct = Math.min(100, Math.max(0, Number(watchedTaxPct || 0)));
    const normalizedSalesTax = Math.round(((taxPct / 100) * normalizedSubTotal) * 1000) / 1000;

    const freight = Number(watchedFreight || 0);
    const normalizedFreight = Number.isFinite(freight) ? Math.round(freight * 1000) / 1000 : 0;

    const dutyPaid = Number(watchedDutyPaid || 0);
    const normalizedDutyPaid = Number.isFinite(dutyPaid) ? Math.round(dutyPaid * 1000) / 1000 : 0;

    const normalizedNetTotal =
      Math.round(
        (normalizedSubTotal + normalizedSalesTax + normalizedFreight + normalizedDutyPaid) * 1000
      ) / 1000;

    const currentGrandTotal = Number(getValues("pototalwithoutdiscount") || 0);
    if (Math.abs(currentGrandTotal - normalizedTotal) > 0.0005) {
      setValue("pototalwithoutdiscount", normalizedTotal, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    const currentDiscountAmt = Number(getValues("podiscountamt") || 0);
    if (Math.abs(currentDiscountAmt - normalizedDiscountAmt) > 0.0005) {
      setValue("podiscountamt", normalizedDiscountAmt, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    const currentSubTotal = Number(getValues("posubtotal") || 0);
    if (Math.abs(currentSubTotal - normalizedSubTotal) > 0.0005) {
      setValue("posubtotal", normalizedSubTotal, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    const currentSalesTax = Number(getValues("posalestax") || 0);
    if (Math.abs(currentSalesTax - normalizedSalesTax) > 0.0005) {
      setValue("posalestax", normalizedSalesTax, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    const currentNetTotal = Number(getValues("pototal") || 0);
    if (Math.abs(currentNetTotal - normalizedNetTotal) > 0.0005) {
      setValue("pototal", normalizedNetTotal, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [watchedItems, watchedTaxPct, watchedFreight, watchedDutyPaid, getValues, setValue]);

  const [isToolDiscountTouched, setIsToolDiscountTouched] = useState(false);

  const [toolItem, setToolItem] = useState<{
    itemid?: number;
    itemcode?: string;
    itemunit: string;
    qtyordered: number;
    orderunitcost: number;
    orddiscount: number;
  }>(() => ({
    itemid: undefined,
    itemcode: undefined,
    itemunit: "",
    qtyordered: isReturnOrder ? -1 : 1,
    orderunitcost: 0,
    orddiscount: defaultItemDiscount,
  }));

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const resetToolItem = () => {
    setToolItem({
      itemid: undefined,
      itemcode: undefined,
      itemunit: "",
      qtyordered: isReturnOrder ? -1 : 1,
      orderunitcost: 0,
      orddiscount: defaultItemDiscount,
    });
    setIsToolDiscountTouched(false);
  };

  useEffect(() => {
    if (editingIndex != null) return;
    if (isToolDiscountTouched) return;
    setToolItem((prev) => ({
      ...prev,
      orddiscount: defaultItemDiscount,
    }));
  }, [defaultItemDiscount, editingIndex, isToolDiscountTouched]);

  const handleRemoveItemRow = (index: number) => {
    if (editingIndex != null) {
      setEditingIndex(null);
      resetToolItem();
    }

    if (isEdit) {
      const currentItem = getValues(`items.${index}`);
      const poItemId = Number(currentItem?.poitemid);
      if (Number.isFinite(poItemId) && poItemId > 0) {
        setRemovedItemIds((prev) =>
          prev.includes(poItemId) ? prev : [...prev, poItemId]
        );
      }
    }

    remove(index);
  };

  useEffect(() => {
    if (!isEdit) return;

    const response = poData?.getSinglePurchaseOrder;
    if (!response?.purchaseorder) return;

    setRemovedItemIds([]);

    const { __typename, ...po } = response.purchaseorder;
    const items =
      response.items?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any, index: number) => ({
          poitemid: row.poitemid,
          itemid: row.itemid,
          itemcode: row.itemcode,
          itemunit: row.itemunit,
          qtyordered: Number(row.qtyordered || 0),
          orderunitcost: Number(row.orderunitcost || 0),
          orddiscount: row.orddiscount != null ? Number(row.orddiscount) : 0,
          ordextendedprice:
            row.ordextendedprice != null
              ? Number(row.ordextendedprice)
              : calculateOrdExtendedPrice(
                  Number(row.qtyordered || 0),
                  Number(row.orderunitcost || 0),
                  row.orddiscount != null ? Number(row.orddiscount) : 0
                ),
        })
      ) || [];

    reset({
      ...getValues(),
      storeid: parsedStoreId,
      supplierid: po.supplierid ?? "",
      warehouseid: po.warehouseid ?? "",
      saveMode: "save",
      podate: po.podate ? dayjs(Number(po.podate)) : dayjs(),
      porequestdate: po.porequestdate ? dayjs(Number(po.porequestdate)) : undefined,
      postatus: po.postatus != null ? String(po.postatus) : "",
      poconfirmedto: po.poconfirmedto ?? "",
      poremarks: po.poremarks ?? "",
      poshippingmethod: po.poshippingmethod ?? "",
      podiscount: po.podiscount ?? "",
      podiscountamt: po.podiscountamt ?? "",
      posubtotal: po.posubtotal ?? "",
      pofreight: po.pofreight ?? "",
      posalestax: po.posalestax ?? "",
      podutypaid: po.podutypaid ?? "",
      posales: po.posales ?? "",
      pototal: po.pototal ?? "",
      pototalwithoutdiscount: po.pototalwithoutdiscount ?? "",
      termsid: po.termsid ?? undefined,
      pomode: po.pomode ?? undefined,
      rmano: po.rmano ?? "",
      poordtocompanyname: po.poordtocompanyname ?? "",
      poordtoadd1: po.poordtoadd1 ?? "",
      poordtoadd2: po.poordtoadd2 ?? "",
      poordtocity: po.poordtocity ?? "",
      poordtostate: po.poordtostate ?? "",
      poordtozip: po.poordtozip ?? "",
      poordtocountry: po.poordtocountry ?? "",
      poordtophone: po.poordtophone ?? "",
      poshiptocompanyname: po.poshiptocompanyname ?? "",
      poshiptoadd1: po.poshiptoadd1 ?? "",
      poshiptoadd2: po.poshiptoadd2 ?? "",
      poshiptocity: po.poshiptocity ?? "",
      poshiptostate: po.poshiptostate ?? "",
      poshiptozip: po.poshiptozip ?? "",
      poshiptocountry: po.poshiptocountry ?? "",
      poshiptophone: po.poshiptophone ?? "",
      items,
    });

    if (po.podate) {
      setSelectedDate(dayjs(po.podate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, poData, parsedStoreId, reset]);

  useEffect(() => {
    if (!isReturnOrder) return;
    if (isEdit) return;
    if (!Number.isFinite(returnOrderPoNumber) || returnOrderPoNumber <= 0) return;

    const response = returnPoData?.getSinglePurchaseOrder;
    if (!response?.purchaseorder) return;

    setRemovedItemIds([]);

    const { __typename, ...po } = response.purchaseorder;
    const items =
      response.items?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any) => {
          const absQty = Math.abs(Number(row.qtyordered || 0));
          const qty = -absQty;
          const unitCost = Number(row.orderunitcost || 0);
          const discount = row.orddiscount != null ? Number(row.orddiscount) : 0;
          return {
            poitemid: row.poitemid,
            itemid: row.itemid,
            itemcode: row.itemcode,
            itemunit: row.itemunit,
            qtyordered: qty,
            orderunitcost: unitCost,
            orddiscount: discount,
            ordextendedprice:
              row.ordextendedprice != null
                ? Number(row.ordextendedprice)
                : calculateOrdExtendedPrice(qty, unitCost, discount),
          };
        }
      ) || [];

    reset({
      ...getValues(),
      storeid: parsedStoreId,
      supplierid: po.supplierid ?? "",
      warehouseid: po.warehouseid ?? "",
      saveMode: "save",
      podate: dayjs(),
      porequestdate: dayjs(),
      postatus: "",
      poconfirmedto: "",
      poremarks: "",
      poshippingmethod: "",
      podiscount: "",
      podiscountamt: "",
      posubtotal: "",
      pofreight: "",
      posalestax: "",
      podutypaid: "",
      posales: "",
      pototal: "",
      pototalwithoutdiscount: "",
      termsid: undefined,
      pomode: undefined,
      rmano: "",
      items,
    });

    setSelectedDate(dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReturnOrder, isEdit, returnOrderPoNumber, returnPoData, parsedStoreId, reset]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const handleDateChange = (date: Dayjs | null) => {
    if (date) setSelectedDate(date);
  };

  const openSaveModeModalAndSubmit = async () => {
    if (creating || updating || returning || poLoading) return;

    if (isReturnOrder) {
      await handleSubmit(onSubmit)();
      return;
    }

    const result = await MySwal.fire({
      icon: "question",
      title: "Save Purchase Order",
      html: "<div class=\"text-muted\" style=\"font-size: 0.95rem; line-height: 1.35;\">Choose how you want to save this purchase order.</div>",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Save - Back Order",
      denyButtonText: "Save & Receive All Merchandise",
      cancelButtonText: "Cancel Save",
      showCloseButton: true,
      focusConfirm: false,
      buttonsStyling: false,
      customClass: {
        popup: "p-4",
        title: "mb-2",
        htmlContainer: "mt-0 mb-3",
        actions: "d-flex flex-column w-100 gap-2 m-0",
        confirmButton: "btn btn-primary w-100",
        denyButton: "btn btn-outline-primary w-100",
        cancelButton: "btn btn-light w-100",
      },
    });

    if (result.isConfirmed) {
      setValue("saveMode", PURCHASE_ORDER_SAVE_MODE.BACKORDER, {
        shouldDirty: false,
        shouldValidate: false,
      });
      await handleSubmit(onSubmit)();
      return;
    }

    if (result.isDenied) {
      setValue("saveMode", PURCHASE_ORDER_SAVE_MODE.RECEIVE, {
        shouldDirty: false,
        shouldValidate: false,
      });
      await handleSubmit(onSubmit)();
    }
  };

  const onSubmit: SubmitHandler<PurchaseOrderFormType> = async (formData) => {
    if (!Number.isFinite(parsedOutletId) || !currentOutlet) {
      dispatch(
        showNotification({
          message: "Outlet is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const supplierIdNumber = Number(formData.supplierid);
    if (!Number.isFinite(supplierIdNumber) || supplierIdNumber <= 0) {
      dispatch(
        showNotification({
          message: "Supplier is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const warehouseIdNumber = Number(formData.warehouseid);
    if (!Number.isFinite(warehouseIdNumber) || warehouseIdNumber <= 0) {
      dispatch(
        showNotification({
          message: "Warehouse is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!formData.items?.length) {
      dispatch(
        showNotification({
          message: "At least one item is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const hasInvalidItem = formData.items.some((item) => {
      const itemIdOk = Number(item.itemid) > 0;
      const itemCodeOk = item.itemcode != null && String(item.itemcode) !== "";
      const qtyNumber = Number(item.qtyordered);
      const qtyOk = isReturnOrder
        ? Number.isFinite(qtyNumber) && Math.abs(qtyNumber) > 0
        : Number.isFinite(qtyNumber) && qtyNumber > 0;
      const priceOk = Number(item.orderunitcost) > 0;
      return !itemIdOk || !itemCodeOk || !qtyOk || !priceOk;
    });

    if (hasInvalidItem) {
      dispatch(
        showNotification({
          message: "Item, Quantity and Unit Price are required for all rows",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload: Record<string, unknown> = {
      storeid: parsedStoreId,
      supplierid: supplierIdNumber,
      warehouseid: warehouseIdNumber,
      podate: selectedDate.format("YYYY-MM-DD"),
      porequestdate: formData.porequestdate
        ? formData.porequestdate.format("YYYY-MM-DD")
        : undefined,
      poconfirmedto: formData.poconfirmedto,
      poshippingmethod:
        formData.poshippingmethod !== ""
          ? Number(formData.poshippingmethod)
          : undefined,
      rmano: formData.rmano,
      poremarks: formData.poremarks,
      podiscount: formData.podiscount !== "" ? Number(formData.podiscount) : undefined,
      podiscountamt:
        formData.podiscountamt !== "" ? Number(formData.podiscountamt) : undefined,
      posubtotal: formData.posubtotal !== "" ? Number(formData.posubtotal) : undefined,
      pofreight: formData.pofreight !== "" ? Number(formData.pofreight) : undefined,
      posalestax: formData.posalestax !== "" ? Number(formData.posalestax) : undefined,
      podutypaid: formData.podutypaid !== "" ? Number(formData.podutypaid) : undefined,
      posales: formData.posales !== "" ? Number(formData.posales) : undefined,
      pototal: formData.pototal !== "" ? Number(formData.pototal) : undefined,
      pototalwithoutdiscount:
        formData.pototalwithoutdiscount !== "" ? Number(formData.pototalwithoutdiscount) : 0,
      termsid: formData.termsid,
      pomode: formData.pomode,
      poordtocompanyname: formData.poordtocompanyname,
      poordtoadd1: formData.poordtoadd1,
      poordtoadd2: formData.poordtoadd2,
      poordtocity: formData.poordtocity,
      poordtostate: formData.poordtostate,
      poordtozip: formData.poordtozip,
      poordtocountry: formData.poordtocountry,
      poordtophone: formData.poordtophone,
      poshiptocompanyname: formData.poshiptocompanyname,
      poshiptoadd1: formData.poshiptoadd1,
      poshiptoadd2: formData.poshiptoadd2,
      poshiptocity: formData.poshiptocity,
      poshiptostate: formData.poshiptostate,
      poshiptozip: formData.poshiptozip,
      poshiptocountry: formData.poshiptocountry,
      poshiptophone: formData.poshiptophone,
      postatus: formData.postatus !== "" ? Number(formData.postatus) : undefined,
      items: formData.items?.map((item, index) => ({
        poitemid: item.poitemid,
        itemid: item.itemid,
        itemcode: item.itemcode != null ? String(item.itemcode) : "",
        itemunit: item.itemunit,
        qtyordered: isReturnOrder
          ? -Math.abs(Number(item.qtyordered || 0))
          : Number(item.qtyordered || 0),
        orderunitcost: item.orderunitcost,
        orddiscount: item.orddiscount,
        ordextendedprice: calculateOrdExtendedPrice(
          isReturnOrder
            ? -Math.abs(Number(item.qtyordered || 0))
            : Number(item.qtyordered || 0),
          item.orderunitcost,
          item.orddiscount
        ),
      })) || [],
    };

    if (isReturnOrder) {
      payload.ponumber = Number(returnOrderPoNumber);
      payload.saveMode = "SAVE_AS_RETURN";
    }

    if (!isReturnOrder) {
      payload.saveMode = formData.saveMode;
    }

    if (isEdit) {
      payload.ponumber = parsedPoNumber;
      if (removedItemIds.length) {
        payload.removeItemIds = removedItemIds;
      }
    }

    const result = await handleTryCatch(async () => {
      let response;
      if (isReturnOrder) {
        response = await returnPurchaseOrder({
          variables: { input: payload },
        });
      } else if (isEdit) {
        response = await editPurchaseOrder({
          variables: { input: payload },
        });
      } else {
        response = await createPurchaseOrder({
          variables: { input: payload },
        });
      }

      const { data } = response;
      const successData = data?.createPurchaseOrder || data?.editPurchaseOrder || data?.returnPurchaseOrder;
      if (successData) {
        dispatch(
          showNotification({
            message: successData.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        router.back();
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
    } else {
      reset({
        ...getValues(),
        supplierid: "",
        warehouseid: "",
        rmano: "",
        porequestdate: dayjs(),
        poconfirmedto: "",
        poremarks: "",
        poshippingmethod: "",
        podiscount: "",
        podiscountamt: "",
        posubtotal: "",
        pofreight: "",
        posalestax: "",
        podutypaid: "",
        posales: "",
        pototal: "",
        pototalwithoutdiscount: "",
        termsid: undefined,
        pomode: undefined,
        poordtocompanyname: "",
        poordtoadd1: "",
        poordtoadd2: "",
        poordtocity: "",
        poordtostate: "",
        poordtozip: "",
        poordtocountry: "",
        poordtophone: "",
        poshiptocompanyname: "",
        poshiptoadd1: "",
        poshiptoadd2: "",
        poshiptocity: "",
        poshiptostate: "",
        poshiptozip: "",
        poshiptocountry: "",
        poshiptophone: "",
        postatus: "",
        items: [],
      });
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (disableField) return;
          void openSaveModeModalAndSubmit();
        }}
      >
        <fieldset disabled={disableField}>
        <div className="card">
          <div className="card-body">
            {disableField ? (
              <div className="row g-3">
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 mt-1 row align-items-center">
                    <label className="col-form-label col-md-4">PO Create Date</label>
                    <div className="col-md-8">
                      <div className="input-groupicon calender-input">
                        <Calendar className="info-img" />
                        <DatePicker
                          value={selectedDate || null}
                          className="filterdatepicker w-100"
                          format="DD-MM-YYYY"
                          placeholder="Choose Date"
                          allowClear
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">PO Request Date</label>
                    <div className="col-md-8">
                      <div className="input-groupicon calender-input">
                        <Calendar className="info-img" />
                        <Controller
                          name="porequestdate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              value={field.value || null}
                              onChange={(date) => field.onChange(date)}
                              className="filterdatepicker w-100"
                              format="DD-MM-YYYY"
                              placeholder="Choose Date"
                              allowClear
                              disabled
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">PO Number</label>
                    <div className="col-md-8">
                      <input
                        type="text"
                        className="form-control"
                        value={String(ponumberParam ?? "")}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="input-blocks mb-0 mt-1 row align-items-center">
                    <label className="col-form-label col-md-4">PO Status</label>
                    <div className="col-md-8">
                      <input
                        type="text"
                        className="form-control"
                        value={(() => {
                          const raw = watch("postatus");
                          const id = typeof raw === "number" ? raw : Number(raw || 0);
                          const status = Number.isFinite(id) ? poStatusById.get(id) : undefined;
                          return status?.statusname ?? String(raw ?? "");
                        })()}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row g-3 align-items-end">
                <div className="col-lg-6 col-md-6 col-sm-12">
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">PO Request Date</label>
                    <div className="col-md-8">
                      <div className="input-groupicon calender-input">
                        <Calendar className="info-img" />
                        <Controller
                          name="porequestdate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              value={field.value || null}
                              onChange={(date) => field.onChange(date)}
                              className="filterdatepicker w-100"
                              format="DD-MM-YYYY"
                              placeholder="Choose Date"
                              allowClear
                              disabled={disableField}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isReturnOrder && !isEdit && (
                  <div className="col-lg-6 col-md-6 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Purchase Order *</label>
                      <div className="col-md-8">
                        <SelectPurchaseOrder
                          value={returnOrderPoNumber}
                          onChange={(v: number) => setReturnOrderPoNumber(Number(v || 0))}
                          storeId={parsedStoreId}
                          postatus={4}
                          disableField={disableField}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isEdit && (
                  <div className="col-lg-6 col-md-6 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">PO Status</label>
                      <div className="col-md-8">
                        <Controller
                          name="postatus"
                          control={control}
                          render={({ field }) => (
                            <select
                              className="form-select"
                              value={field.value != null ? String(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={disableField}
                            >
                              <option value="">Select</option>
                              {poStatuses.map((s) => (
                                <option key={s.statusid} value={String(s.statusid)}>
                                  {s.statusname ?? String(s.statusid)}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="row g-3 mt-1">
              <div className="col-lg-6 col-md-12 col-sm-12">
                <div className="border rounded p-3 h-100">
                  <h5 className="mb-3">Order To</h5>
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">{isReturnOrder ? "Outlet" : "Supplier *"}</label>
                    <div className="col-md-8">
                      {isReturnOrder ? (
                        <input
                          type="text"
                          className="form-control"
                          value={currentOutlet?.outletname ?? ""}
                          readOnly
                          disabled
                        />
                      ) : (
                        <Controller
                          name="supplierid"
                          control={control}
                          rules={{ required: "Supplier is required" }}
                          render={({ field }) => (
                            <SelectSupplier
                              trigger={trigger}
                              storeId={parsedStoreId}
                              disableField={disableField}
                              {...field}
                            />
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="row g-2 mt-1">

                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">Address</label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            value={watch("poordtoadd1") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poordtoadd1")} />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">&nbsp;</label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            value={watch("poordtoadd2") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poordtoadd2")} />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">City/State/Zip/Country</label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            value={
                              [
                                watch("poordtocity") || "",
                                watch("poordtostate") || "",
                                watch("poordtozip") || "",
                                watch("poordtocountry") || "",
                              ]
                                .filter(Boolean)
                                .join(", ")
                            }
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poordtocity")} />
                          <input type="hidden" {...register("poordtostate")} />
                          <input type="hidden" {...register("poordtozip")} />
                          <input type="hidden" {...register("poordtocountry")} />
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
                            value={watch("poordtophone") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poordtophone")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 col-md-12 col-sm-12">
                <div className="border rounded p-3 h-100">
                  <h5 className="mb-3">Ship To</h5>
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">{isReturnOrder ? "Supplier *" : "Company"}</label>
                        <div className="col-md-8">
                          {isReturnOrder ? (
                            <Controller
                              name="supplierid"
                              control={control}
                              rules={{ required: "Supplier is required" }}
                              render={({ field }) => (
                                <SelectSupplier
                                  trigger={trigger}
                                  storeId={parsedStoreId}
                                  disableField={disableField}
                                  {...field}
                                />
                              )}
                            />
                          ) : (
                            <>
                              <input
                                type="text"
                                className="form-control"
                                value={watch("poshiptocompanyname") || ""}
                                readOnly
                                disabled
                              />
                              <input type="hidden" {...register("poshiptocompanyname")} />
                            </>
                          )}
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
                            value={watch("poshiptoadd1") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poshiptoadd1")} />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">&nbsp;</label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            value={watch("poshiptoadd2") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poshiptoadd2")} />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="input-blocks mb-0 row align-items-center">
                        <label className="col-form-label col-md-4">City/State/Zip/Country</label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            value={
                              [
                                watch("poshiptocity") || "",
                                watch("poshiptostate") || "",
                                watch("poshiptozip") || "",
                                watch("poshiptocountry") || "",
                              ]
                                .filter(Boolean)
                                .join(", ")
                            }
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poshiptocity")} />
                          <input type="hidden" {...register("poshiptostate")} />
                          <input type="hidden" {...register("poshiptozip")} />
                          <input type="hidden" {...register("poshiptocountry")} />
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
                            value={watch("poshiptophone") || ""}
                            readOnly
                            disabled
                          />
                          <input type="hidden" {...register("poshiptophone")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1 align-items-end">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">
                    {isReturnOrder ? "Reference number" : "RMA No"}
                  </label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      {...register("rmano")}
                      disabled={disableField}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Confirmed To</label>
                  <div className="col-md-8">
                    <input type="text" className="form-control" {...register("poconfirmedto")} />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Term</label>
                  <div className="col-md-8">
                    <Controller
                      name="termsid"
                      control={control}
                      render={({ field }) => (
                        <SelectPaymentTerms
                          {...field}
                          storeId={parsedStoreId}
                          trigger={trigger}
                          disableField={disableField}
                          value={field.value}
                          onChange={(val: number | undefined) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Shipping Method</label>
                  <div className="col-md-8">
                    <Controller
                      name="poshippingmethod"
                      control={control}
                      render={({ field }) => (
                        <SelectShippingModes
                          {...field}
                          storeId={parsedStoreId}
                          trigger={trigger}
                          disableField={disableField}
                          value={field.value === "" ? undefined : field.value}
                          onChange={(val: number | undefined) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Sales Tax%</label>
                  <div className="col-md-8">
                    <input
                      type="number"
                      step="any"
                      min={0}
                      className="form-control"
                      {...register("posales", { valueAsNumber: true })}
                      disabled={disableField}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Discount %</label>
                  <div className="col-md-8">
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={100}
                      className="form-control"
                      {...register("podiscount", { valueAsNumber: true })}
                      onInput={(e) => {
                        const raw = e.currentTarget.value;
                        if (raw === "") return;

                        const n = Number(raw);
                        if (!Number.isFinite(n)) return;

                        const clamped = Math.min(100, Math.max(0, n));
                        if (clamped !== n) {
                          e.currentTarget.value = String(clamped);
                        }
                      }}
                      disabled={disableField}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Warehouse *</label>
                  <div className="col-md-8">
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
                              disableField={disableField}
                              value={toolItem.itemid}
                              onChange={(val: number | undefined) =>
                                setToolItem((prev) => ({ ...prev, itemid: val }))
                              }
                              onChangeAdditional={(selected: any) => {
                                if (!selected) {
                                  setToolItem((prev) => ({
                                    ...prev,
                                    itemid: undefined,
                                    itemcode: undefined,
                                    itemunit: "",
                                  }));
                                  return;
                                }
                                const rawQty = Number(selected?.itemreorderqty ?? 0);
                                const qtyValue = isReturnOrder ? -Math.abs(rawQty) : rawQty;
                                setToolItem((prev) => ({
                                  ...prev,
                                  itemid: Number(selected?.itemid ?? prev.itemid),
                                  itemcode:
                                    selected?.itemcode != null ? String(selected.itemcode) : prev.itemcode,
                                  itemunit: selected?.itemunit || "",
                                  qtyordered: qtyValue,
                                  orderunitcost: Number(selected?.itempurchaseprice ?? 0),
                                }));
                              }}
                            />
                        </div>
                      </div>

                      <div className="col-lg-3 col-md-6 col-sm-12">
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

                      <div className="col-lg-1 col-md-6 col-sm-12 p-0">
                        <div className="input-blocks">
                          <label>Quantity *</label>
                            <input
                              type="number"
                              step="0.001"
                              min={isReturnOrder ? undefined : 0}
                              className="form-control px-1 text-end" 
                              value={toolItem.qtyordered}
                              disabled={disableField}
                              onChange={(e) => {
                                const n = Number(e.target.value || 0);
                                const abs = Math.abs(n);
                                const normalizedAbs = Math.round(abs * 1000) / 1000;
                                const normalized = isReturnOrder ? -normalizedAbs : normalizedAbs;
                                setToolItem((prev) => ({
                                  ...prev,
                                  qtyordered: normalized,
                                }));
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
                              value={toolItem.orderunitcost}
                              disabled={disableField}
                              onChange={(e) => {
                                const n = Math.max(0, Number(e.target.value || 0));
                                const normalized = Math.round(n * 1000) / 1000;
                                setToolItem((prev) => ({
                                  ...prev,
                                  orderunitcost: normalized,
                                }));
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
                              value={toolItem.orddiscount}
                              disabled={disableField}
                              onChange={(e) => {
                                const n = Number(e.target.value || 0);
                                const clamped = Math.min(100, Math.max(0, n));
                                const normalized = Math.round(clamped * 1000) / 1000;
                                setIsToolDiscountTouched(true);
                                setToolItem((prev) => ({
                                  ...prev,
                                  orddiscount: normalized,
                                }));
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
                                const v = calculateOrdExtendedPrice(
                                  toolItem.qtyordered,
                                  toolItem.orderunitcost,
                                  toolItem.orddiscount
                                );
                                return Number.isFinite(v) ? v.toFixed(3) : "";
                              })()}
                              readOnly
                            />
                        </div>
                      </div>

                      <div className="col-lg-1 col-md-6 col-sm-12">
                        <div className="input-blocks">
                            {!disableField &&
                              (editingIndex == null ? (
                              <button
                                type="button"
                                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                onClick={() => {
                                  const supplierIdNumber = Number(getValues("supplierid"));
                                  if (!Number.isFinite(supplierIdNumber) || supplierIdNumber <= 0) {
                                    dispatch(
                                      showNotification({
                                        message: "Supplier is required",
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

                                  if (!Number.isFinite(parsedOutletId) || !currentOutlet) {
                                    dispatch(
                                      showNotification({
                                        message: "Outlet is required",
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

                                  if (!toolItem.itemcode || String(toolItem.itemcode).trim() === "") {
                                    dispatch(
                                      showNotification({
                                        message: "Product is required",
                                        type: NOTIFICATION_TYPES.ERROR,
                                      })
                                    );
                                    return;
                                  }

                                  const qtyValue = Number(toolItem.qtyordered);
                                  if (
                                    !Number.isFinite(qtyValue) ||
                                    (isReturnOrder ? Math.abs(qtyValue) <= 0 : qtyValue <= 0)
                                  ) {
                                    dispatch(
                                      showNotification({
                                        message: "Quantity is required",
                                        type: NOTIFICATION_TYPES.ERROR,
                                      })
                                    );
                                    return;
                                  }

                                  if (!Number.isFinite(toolItem.orderunitcost) || toolItem.orderunitcost <= 0) {
                                    dispatch(
                                      showNotification({
                                        message: "Unit Price is required",
                                        type: NOTIFICATION_TYPES.ERROR,
                                      })
                                    );
                                    return;
                                  }

                                  const normalizedQty = isReturnOrder
                                    ? -Math.abs(Number(toolItem.qtyordered || 0))
                                    : Number(toolItem.qtyordered || 0);
                                  append({
                                    itemid: toolItem.itemid,
                                    itemcode: toolItem.itemcode ?? "",
                                    itemunit: toolItem.itemunit,
                                    qtyordered: normalizedQty,
                                    orderunitcost: toolItem.orderunitcost,
                                    orddiscount: toolItem.orddiscount,
                                    ordextendedprice: calculateOrdExtendedPrice(
                                      normalizedQty,
                                      toolItem.orderunitcost,
                                      toolItem.orddiscount
                                    ),
                                  });

                                  resetToolItem();
                                }}
                              >
                                <PlusCircle />
                              </button>
                            ) : (
                              <div className="btn-group w-100" role="group">
                                <button
                                  type="button"
                                  className="btn btn-success d-flex align-items-center justify-content-center"
                                  onClick={() => {
                                    const supplierIdNumber = Number(getValues("supplierid"));
                                    if (!Number.isFinite(supplierIdNumber) || supplierIdNumber <= 0) {
                                      dispatch(
                                        showNotification({
                                          message: "Supplier is required",
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

                                    if (!Number.isFinite(parsedOutletId) || !currentOutlet) {
                                      dispatch(
                                        showNotification({
                                          message: "Outlet is required",
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

                                    if (!toolItem.itemcode || String(toolItem.itemcode).trim() === "") {
                                      dispatch(
                                        showNotification({
                                          message: "Product is required",
                                          type: NOTIFICATION_TYPES.ERROR,
                                        })
                                      );
                                      return;
                                    }

                                    const qtyValue = Number(toolItem.qtyordered);
                                    if (
                                      !Number.isFinite(qtyValue) ||
                                      (isReturnOrder ? Math.abs(qtyValue) <= 0 : qtyValue <= 0)
                                    ) {
                                      dispatch(
                                        showNotification({
                                          message: "Quantity is required",
                                          type: NOTIFICATION_TYPES.ERROR,
                                        })
                                      );
                                      return;
                                    }

                                    if (!Number.isFinite(toolItem.orderunitcost) || toolItem.orderunitcost <= 0) {
                                      dispatch(
                                        showNotification({
                                          message: "Unit Price is required",
                                          type: NOTIFICATION_TYPES.ERROR,
                                        })
                                      );
                                      return;
                                    }
                                    const existing = getValues(`items.${editingIndex}`);
                                    const normalizedQty = isReturnOrder
                                      ? -Math.abs(Number(toolItem.qtyordered || 0))
                                      : Number(toolItem.qtyordered || 0);
                                    update(editingIndex, {
                                      ...existing,
                                      itemid: toolItem.itemid,
                                      itemcode: toolItem.itemcode ?? "",
                                      itemunit: toolItem.itemunit,
                                      qtyordered: normalizedQty,
                                      orderunitcost: toolItem.orderunitcost,
                                      orddiscount: toolItem.orddiscount,
                                      ordextendedprice: calculateOrdExtendedPrice(
                                        normalizedQty,
                                        toolItem.orderunitcost,
                                        toolItem.orddiscount
                                      ),
                                    });
                                    setEditingIndex(null);
                                    resetToolItem();
                                  }}
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
                            ))}
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
                            <th className="text-end text-nowrap">Unit Price</th>
                            <th className="text-end text-nowrap">Discount %</th>
                            <th className="text-end text-nowrap">Ext. Price</th>
                            <th className="text-center text-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemFields.map((field, index) => {
                            const itemId = Number(getValues(`items.${index}.itemid`) || 0);
                            const product = productById.get(itemId);
                            const displayItemCode =
                              String(getValues(`items.${index}.itemcode`) || "") || product?.itemcode || "";
                            const description = product?.itemdescription ?? "";
                            const qty = Number(getValues(`items.${index}.qtyordered`) || 0);
                            const unitPrice = Number(getValues(`items.${index}.orderunitcost`) || 0);
                            const discountPct = Number(getValues(`items.${index}.orddiscount`) || 0);
                            const savedExtPrice = Number(
                              getValues(`items.${index}.ordextendedprice`) as unknown as number
                            );
                            const extPrice = Number.isFinite(savedExtPrice)
                              ? savedExtPrice
                              : calculateOrdExtendedPrice(qty, unitPrice, discountPct);
                            return (
                              <tr key={field.id} className="align-middle">
                                <td>
                                  {index + 1}
                                  <input
                                    type="hidden"
                                    {...register(`items.${index}.poitemid` as const, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                  <input
                                    type="hidden"
                                    {...register(`items.${index}.itemid` as const, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                  <input type="hidden" {...register(`items.${index}.itemcode` as const)} />
                                </td>
                                <td className="text-nowrap">{displayItemCode}</td>
                                <td>{description}</td>
                                <td className="text-end">{qty}</td>
                                <td className="text-end">{unitPrice}</td>
                                <td className="text-end">{discountPct}</td>
                                <td className="text-end">
                                  {Number.isFinite(extPrice) ? extPrice.toFixed(2) : ""}
                                </td>
                                <td className="text-center">
                                  {!disableField && (
                                    <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary me-2"
                                      onClick={() => {
                                        setEditingIndex(index);
                                        setToolItem({
                                          itemid:
                                            (getValues(`items.${index}.itemid`) as unknown as number) ??
                                            undefined,
                                          itemcode: String(getValues(`items.${index}.itemcode`) || "") || undefined,
                                          itemunit: getValues(`items.${index}.itemunit`) || "",
                                          qtyordered: Number(getValues(`items.${index}.qtyordered`) || 0),
                                          orderunitcost: Number(getValues(`items.${index}.orderunitcost`) || 0),
                                          orddiscount: Number(getValues(`items.${index}.orddiscount`) || 0),
                                        });
                                      }}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleRemoveItemRow(index)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    </>
                                  )}
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
                  <div className="input-blocks mb-0 row align-items-center">
                    <label className="col-form-label col-md-4">Customer Message</label>
                    <div className="col-md-8">
                      <textarea
                        className="form-control"
                        rows={4}
                        {...register("poremarks")}
                        disabled={disableField}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 col-md-12 col-sm-12">
                <div className="border rounded p-3 h-100">
                  <div className="row g-3">
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Grand Total</label>
                      <div className="col-md-8">
                        <input
                          type="hidden"
                          {...register("pototalwithoutdiscount", { valueAsNumber: true })}
                        />
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(watch("pototalwithoutdiscount"))}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Discount Amount</label>
                      <div className="col-md-8">
                        <input type="hidden" {...register("podiscountamt", { valueAsNumber: true })} />
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(watch("podiscountamt"))}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Subtotal</label>
                      <div className="col-md-8">
                        <input type="hidden" {...register("posubtotal", { valueAsNumber: true })} />
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(watch("posubtotal"))}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Sales Tax</label>
                      <div className="col-md-8">
                        <input type="hidden" {...register("posalestax", { valueAsNumber: true })} />
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(watch("posalestax"))}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Shipping</label>
                      <div className="col-md-8">
                        {disableField ? (
                          <>
                            <input type="hidden" {...register("pofreight", { valueAsNumber: true })} />
                            <input
                              type="text"
                              className="form-control text-end"
                              value={formatMoney(watch("pofreight"))}
                              readOnly
                              disabled
                            />
                          </>
                        ) : (
                          <input
                            type="number"
                            className="form-control"
                            {...register("pofreight", { valueAsNumber: true })}
                            disabled={disableField}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Duty/Tariff</label>
                      <div className="col-md-8">
                        {disableField ? (
                          <>
                            <input type="hidden" {...register("podutypaid", { valueAsNumber: true })} />
                            <input
                              type="text"
                              className="form-control text-end"
                              value={formatMoney(watch("podutypaid"))}
                              readOnly
                              disabled
                            />
                          </>
                        ) : (
                          <input
                            type="number"
                            className="form-control"
                            {...register("podutypaid", { valueAsNumber: true })}
                            disabled={disableField}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-sm-12">
                    <div className="input-blocks mb-0 row align-items-center">
                      <label className="col-form-label col-md-4">Net PO Total</label>
                      <div className="col-md-8">
                        <input type="hidden" {...register("pototal", { valueAsNumber: true })} />
                        <input
                          type="text"
                          className="form-control text-end"
                          value={formatMoney(watch("pototal"))}
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

        {!disableField && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={creating || updating || poLoading}
              btnText={isEdit ? "Update" : "Save"}
              loadingText={isEdit ? "Updating ..." : "Saving ..."}
              type="button"
              onClick={() => void openSaveModeModalAndSubmit()}
            />
          </ActionFooter>
        )}
        </fieldset>
      </form>
    </>
  );
};

export default PurchaseOrderForm;
