"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Edit2, PlusCircle, Trash2, X } from "react-feather";
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
import { formatCurrency } from "@/lib/utils/currencyFormat";
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
import useMenu from "@/hooks/useMenu";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import PageHeader from "@/components/ui/PageHeader";
import { PurchaseOrderFormType, Status } from "@/types/purchase";
import { ItemDetails } from "@/hooks/useProducts";
import POSupplierInvoiceModal, { POSupplierInvoiceInitialData } from "./POSupplierInvoiceModal";
import POImportWizard from "@/components/ui/purchase/import/POImportWizard";

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
  const [showAPModal, setShowAPModal] = useState(false);
  const [apInitialData, setApInitialData] = useState<POSupplierInvoiceInitialData | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [pendingImportMeta, setPendingImportMeta] = useState<{ fileName: string; count: number } | null>(null);

  const formatMoney = (raw: unknown) => {
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    return formatCurrency(Number.isFinite(n) ? n : 0);
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
  const discountMountRef = useRef(true);

  const [toolItem, setToolItem] = useState<{
    itemid?: number;
    itemcode?: string;
    itemdescription: string;
    itemunit: string;
    qtyordered: number;
    orderunitcost: number;
    orddiscount: number;
  }>(() => ({
    itemid: undefined,
    itemcode: undefined,
    itemdescription: "",
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
      itemdescription: "",
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

  // Propagate header discount to all existing line items when user changes it.
  // Skips the first render so edit-mode items keep their saved discounts on load.
  useEffect(() => {
    if (discountMountRef.current) {
      discountMountRef.current = false;
      return;
    }
    const items = getValues("items");
    if (!items?.length) return;
    items.forEach((item, index) => {
      const qty = Number(item.qtyordered || 0);
      const unitCost = Number(item.orderunitcost || 0);
      update(index, {
        ...item,
        orddiscount: defaultItemDiscount,
        ordextendedprice: calculateOrdExtendedPrice(qty, unitCost, defaultItemDiscount),
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultItemDiscount]);

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
          itemdescription: row.itemdescription ?? "",
          itemunit: row.itemunit,
          qtyordered: Number(row.qtyordered || 0),
          itemqtyreceived: Number(row.itemqtyreceived || 0),
          itemqtybackorder: Number(row.itemqtybackorder || 0),
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
          additionalcost: row.additionalcost != null ? Number(row.additionalcost) : 0,
          finalunitcost: row.finalunitcost != null ? Number(row.finalunitcost) : 0,
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
            itemdescription: row.itemdescription ?? "",
            itemunit: row.itemunit,
            qtyordered: qty,
            orderunitcost: unitCost,
            orddiscount: discount,
            ordextendedprice:
              row.ordextendedprice != null
                ? Number(row.ordextendedprice)
                : calculateOrdExtendedPrice(qty, unitCost, discount),
            additionalcost: row.additionalcost != null ? Number(row.additionalcost) : 0,
            finalunitcost: row.finalunitcost != null ? Number(row.finalunitcost) : 0,
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
        additionalcost: itemFields[index]?.additionalcost ?? undefined,
        finalunitcost: itemFields[index]?.finalunitcost ?? undefined,
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
        // Log import history now that PO is actually saved
        if (pendingImportMeta) {
          const meta = pendingImportMeta;
          setPendingImportMeta(null);
          void fetch('/api/proxy/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation { saveImportFileRecord(storeid: ${parsedStoreId}, filename: ${JSON.stringify(meta.fileName)}, importedby: 0, recordcount: ${meta.count}) }`,
            }),
          }).catch(() => {});
        }
        dispatch(
          showNotification({
            message: successData.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );

        // Only prompt for AP invoice on new PO create (not edit / return)
        if (!isEdit && !isReturnOrder) {
          const apResult = await MySwal.fire({
            icon: "question",
            title: "Create Supplier Invoice?",
            html: "<div class=\"text-muted\" style=\"font-size:0.9rem\">Do you want to create an AP invoice for this Purchase Order?</div>",
            showCancelButton: true,
            confirmButtonText: "Yes, Create Invoice",
            cancelButtonText: "No, Skip",
            buttonsStyling: false,
            customClass: {
              confirmButton: "btn btn-success me-2",
              cancelButton: "btn btn-light",
              actions: "d-flex justify-content-center gap-2 mt-0",
            },
          });

          if (apResult.isConfirmed) {
            const poNumber = successData.data?.ponumber;
            setApInitialData({
              supplierid: Number(formData.supplierid),
              supplierName: watch("poordtocompanyname") || "",
              veninvoiceno: poNumber ? String(poNumber) : "",
              refponumber: poNumber ? String(poNumber) : "",
              veninvoicetotal: String(formData.pototal || ""),
              termsid: formData.termsid ? Number(formData.termsid) : 1,
            });
            setShowAPModal(true);
            return true; // AP modal handles navigation
          }
        }

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

  // ─── JSX ──────────────────────────────────────────────────────────────────

  const { currentMenu } = useMenu();

  const sectionLabel = {
    fontSize: "0.65rem",
    letterSpacing: "0.06em",
  } as const;

  const supplierName = isReturnOrder
    ? watch("poshiptocompanyname")
    : watch("poordtocompanyname");

  const [addrOpen, setAddrOpen] = useState(true);
  const autoCollapsedRef = useRef(false);
  useEffect(() => {
    if (supplierName && !autoCollapsedRef.current) {
      setAddrOpen(false);
      autoCollapsedRef.current = true;
    }
  }, [supplierName]);

  return (
    <>
      <PageHeader title={currentMenu?.permissiondisplayname ?? ""} subtitle={currentMenu?.permissiondescription} showBreadcrumb />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (disableField) return;
          void openSaveModeModalAndSubmit();
        }}
      >
        <fieldset disabled={disableField}>

          {/* ── HEADER STRIP ─────────────────────────────── */}
          <div className="card mb-3">
            <div className="card-body py-3">
              <div className="d-flex flex-wrap gap-4 align-items-start">

                {/* PO Date */}
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>PO Date</div>
                  <DatePicker
                    value={selectedDate || null}
                    onChange={handleDateChange}
                    className="filterdatepicker"
                    format="MM/DD/YYYY"
                    placeholder="Choose Date"
                    allowClear={false}
                    disabled={disableField}
                    style={{ width: 140 }}
                  />
                </div>
                <div className="vr align-self-stretch" />

                {/* Request Date */}
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>Request Date</div>
                  <Controller
                    name="porequestdate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || null}
                        onChange={(date) => field.onChange(date)}
                        className="filterdatepicker"
                        format="MM/DD/YYYY"
                        placeholder="Choose Date"
                        allowClear
                        disabled={disableField}
                        style={{ width: 140 }}
                      />
                    )}
                  />
                </div>
                <div className="vr align-self-stretch" />

                {/* Warehouse */}
                <div>
                  <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>Warehouse</div>
                  <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6 }}>
                    {currentWarehouse?.warehousename || "—"}
                  </div>
                  <input type="hidden" {...register("warehouseid", { valueAsNumber: true, required: true, min: 1 })} />
                </div>

                {/* Return order: source PO selector */}
                {isReturnOrder && !isEdit && (
                  <>
                    <div className="vr align-self-stretch" />
                    <div>
                      <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>Return for PO <span className="text-danger">*</span></div>
                      <SelectPurchaseOrder
                        value={returnOrderPoNumber}
                        onChange={(v: number) => setReturnOrderPoNumber(Number(v || 0))}
                        storeId={parsedStoreId}
                        postatus={4}
                        disableField={disableField}
                      />
                    </div>
                  </>
                )}

                {/* PO# — only in edit/view */}
                {(isEdit || disableField) && (
                  <>
                    <div className="vr align-self-stretch" />
                    <div>
                      <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>PO #</div>
                      <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6 }}>
                        {ponumberParam || "—"}
                      </div>
                    </div>
                  </>
                )}

                {/* Status — only in edit */}
                {isEdit && (
                  <>
                    <div className="vr align-self-stretch" />
                    <div>
                      <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>Status</div>
                      {disableField ? (
                        <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6 }}>
                          {(() => {
                            const raw = watch("postatus");
                            const id = typeof raw === "number" ? raw : Number(raw || 0);
                            const status = Number.isFinite(id) ? poStatusById.get(id) : undefined;
                            return status?.statusname ?? String(raw ?? "");
                          })()}
                        </div>
                      ) : (
                        <Controller
                          name="postatus"
                          control={control}
                          render={({ field }) => (
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 160 }}
                              value={field.value != null ? String(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value)}
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
                      )}
                    </div>
                  </>
                )}

                {/* Supplier summary chip */}
                {supplierName && (
                  <>
                    <div className="vr align-self-stretch" />
                    <div>
                      <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>Supplier</div>
                      <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6 }}>{supplierName}</div>
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
                {!addrOpen && supplierName && (
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    — {isReturnOrder ? "Order From" : "Order To"}: {supplierName}
                  </span>
                )}
              </div>
              <i className={`fas fa-chevron-${addrOpen ? "up" : "down"} text-muted`} style={{ fontSize: 12 }} />
            </div>
            {addrOpen && (
              <div className="card-body">
                <div className="row g-3">

                  {/* Order To */}
                  <div className="col-lg-6 col-md-12">
                    <div className="border rounded p-3 h-100">
                      <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                        {isReturnOrder ? "Order From" : "Order To"}
                      </div>

                      {!isReturnOrder && (
                        <Controller
                          name="supplierid"
                          control={control}
                          rules={{ required: "Supplier is required" }}
                          render={({ field }) => (
                            <SelectSupplier
                              trigger={trigger}
                              storeId={parsedStoreId}
                              disableField={disableField || isEdit}
                              {...field}
                            />
                          )}
                        />
                      )}

                      <div className="text-muted small lh-lg mt-2">
                        {isReturnOrder ? (
                          <>
                            {currentOutlet?.outletname && <div className="fw-semibold text-dark">{currentOutlet.outletname}</div>}
                            {watch("poordtoadd1") && <div>{watch("poordtoadd1")}</div>}
                            {watch("poordtoadd2") && <div>{watch("poordtoadd2")}</div>}
                            {[watch("poordtocity"), watch("poordtostate"), watch("poordtozip"), watch("poordtocountry")].filter(Boolean).length > 0 && (
                              <div>{[watch("poordtocity"), watch("poordtostate"), watch("poordtozip"), watch("poordtocountry")].filter(Boolean).join(", ")}</div>
                            )}
                            {watch("poordtophone") && <div>{watch("poordtophone")}</div>}
                          </>
                        ) : (
                          <>
                            {watch("poordtocompanyname") && <div className="fw-semibold text-dark">{watch("poordtocompanyname")}</div>}
                            {watch("poordtoadd1") && <div>{watch("poordtoadd1")}</div>}
                            {watch("poordtoadd2") && <div>{watch("poordtoadd2")}</div>}
                            {[watch("poordtocity"), watch("poordtostate"), watch("poordtozip"), watch("poordtocountry")].filter(Boolean).length > 0 && (
                              <div>{[watch("poordtocity"), watch("poordtostate"), watch("poordtozip"), watch("poordtocountry")].filter(Boolean).join(", ")}</div>
                            )}
                            {watch("poordtophone") && <div>{watch("poordtophone")}</div>}
                          </>
                        )}
                      </div>

                      <input type="hidden" {...register("poordtocompanyname")} />
                      <input type="hidden" {...register("poordtoadd1")} />
                      <input type="hidden" {...register("poordtoadd2")} />
                      <input type="hidden" {...register("poordtocity")} />
                      <input type="hidden" {...register("poordtostate")} />
                      <input type="hidden" {...register("poordtozip")} />
                      <input type="hidden" {...register("poordtocountry")} />
                      <input type="hidden" {...register("poordtophone")} />
                    </div>
                  </div>

                  {/* Ship To */}
                  <div className="col-lg-6 col-md-12">
                    <div className="border rounded p-3 h-100">
                      <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                        {isReturnOrder ? "Ship To (Supplier)" : "Ship To"}
                      </div>

                      {isReturnOrder && (
                        <Controller
                          name="supplierid"
                          control={control}
                          rules={{ required: "Supplier is required" }}
                          render={({ field }) => (
                            <SelectSupplier
                              trigger={trigger}
                              storeId={parsedStoreId}
                              disableField={disableField || isEdit}
                              {...field}
                            />
                          )}
                        />
                      )}

                      <div className="text-muted small lh-lg mt-2">
                        {watch("poshiptocompanyname") && <div className="fw-semibold text-dark">{watch("poshiptocompanyname")}</div>}
                        {watch("poshiptoadd1") && <div>{watch("poshiptoadd1")}</div>}
                        {watch("poshiptoadd2") && <div>{watch("poshiptoadd2")}</div>}
                        {[watch("poshiptocity"), watch("poshiptostate"), watch("poshiptozip"), watch("poshiptocountry")].filter(Boolean).length > 0 && (
                          <div>{[watch("poshiptocity"), watch("poshiptostate"), watch("poshiptozip"), watch("poshiptocountry")].filter(Boolean).join(", ")}</div>
                        )}
                        {watch("poshiptophone") && <div>{watch("poshiptophone")}</div>}
                      </div>

                      <input type="hidden" {...register("poshiptocompanyname")} />
                      <input type="hidden" {...register("poshiptoadd1")} />
                      <input type="hidden" {...register("poshiptoadd2")} />
                      <input type="hidden" {...register("poshiptocity")} />
                      <input type="hidden" {...register("poshiptostate")} />
                      <input type="hidden" {...register("poshiptozip")} />
                      <input type="hidden" {...register("poshiptocountry")} />
                      <input type="hidden" {...register("poshiptophone")} />
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
                    <div className="text-uppercase fw-semibold text-muted mb-2" style={sectionLabel}>Reference</div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">{isReturnOrder ? "RMA No" : "Ref No"}</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          {...register("rmano")}
                          disabled={disableField}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Confirmed To</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          {...register("poconfirmedto")}
                          disabled={disableField}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fulfillment */}
                <div className="col-lg-4 col-md-12">
                  <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                    <div className="text-uppercase fw-semibold text-muted mb-2" style={sectionLabel}>Fulfillment</div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Terms</label>
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
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Ship Via</label>
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
                </div>

                {/* Pricing */}
                <div className="col-lg-4 col-md-12">
                  <div className="rounded px-3 py-2" style={{ background: "var(--bs-gray-100, #f8f9fa)" }}>
                    <div className="text-uppercase fw-semibold text-muted mb-2" style={sectionLabel}>Pricing</div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Discount %</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          max={100}
                          className="form-control form-control-sm"
                          {...register("podiscount", { valueAsNumber: true })}
                          disabled={disableField}
                          onInput={(e) => {
                            const raw = e.currentTarget.value;
                            if (raw === "") return;
                            const n = Number(raw);
                            if (!Number.isFinite(n)) return;
                            const clamped = Math.min(100, Math.max(0, n));
                            if (clamped !== n) e.currentTarget.value = String(clamped);
                          }}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Sales Tax %</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          className="form-control form-control-sm"
                          {...register("posales", { valueAsNumber: true })}
                          disabled={disableField}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── LINE ITEMS ───────────────────────────────── */}
          <div className="card mb-3">
            <div className="card-body">

              {/* Items table */}
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                <table className="table datanew mb-0">
                  <thead className="sticky-top bg-white" style={{ zIndex: 1 }}>
                    <tr>
                      <th className="text-nowrap">#</th>
                      <th className="text-nowrap">Item Code</th>
                      <th>Description</th>
                      <th className="text-nowrap">Unit</th>
                      <th className="text-end text-nowrap">{disableField ? "Order Qty" : "Qty"}</th>
                      {disableField && <th className="text-end text-nowrap">Recv Qty</th>}
                      {disableField && <th className="text-end text-nowrap">Backorder</th>}
                      <th className="text-end text-nowrap">Unit Price</th>
                      <th className="text-end text-nowrap">Disc %</th>
                      <th className="text-end text-nowrap">Ext. Price</th>
                      <th className="text-end text-nowrap">Add. Cost</th>
                      <th className="text-end text-nowrap">Final Cost</th>
                      {!disableField && <th className="text-center text-nowrap">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itemFields.length === 0 ? (
                      <tr>
                        <td colSpan={disableField ? 12 : 11} className="text-center text-muted py-5 fst-italic">
                          No items yet — use the form above to add line items
                        </td>
                      </tr>
                    ) : (
                      itemFields.map((field, index) => {
                        const displayItemCode =
                          String(getValues(`items.${index}.itemcode`) || "");
                        const description = String(getValues(`items.${index}.itemdescription`) || "");
                        const qty = Number(getValues(`items.${index}.qtyordered`) || 0);
                        const recvQty = Number(getValues(`items.${index}.itemqtyreceived`) || 0);
                        const backorder = Number(getValues(`items.${index}.itemqtybackorder`) || 0);
                        const unitPrice = Number(getValues(`items.${index}.orderunitcost`) || 0);
                        const discountPct = Number(getValues(`items.${index}.orddiscount`) || 0);
                        const savedExtPrice = Number(
                          getValues(`items.${index}.ordextendedprice`) as unknown as number
                        );
                        const extPrice = Number.isFinite(savedExtPrice)
                          ? savedExtPrice
                          : calculateOrdExtendedPrice(qty, unitPrice, discountPct);
                        const additionalcost = Number(getValues(`items.${index}.additionalcost`) || 0);
                        const finalunitcost = Number(getValues(`items.${index}.finalunitcost`) || 0);
                        return (
                          <tr key={field.id} className={`align-middle${editingIndex === index ? " table-warning" : ""}`}>
                            <td>
                              {index + 1}
                              <input
                                type="hidden"
                                {...register(`items.${index}.poitemid` as const, { valueAsNumber: true })}
                              />
                              <input
                                type="hidden"
                                {...register(`items.${index}.itemid` as const, { valueAsNumber: true })}
                              />
                              <input type="hidden" {...register(`items.${index}.itemcode` as const)} />
                            </td>
                            <td className="text-nowrap">{displayItemCode}</td>
                            <td>{description}</td>
                            <td className="text-nowrap text-muted small">{getValues(`items.${index}.itemunit`)}</td>
                            <td className="text-end">{qty}</td>
                            {disableField && <td className="text-end">{recvQty}</td>}
                            {disableField && <td className="text-end">{backorder}</td>}
                            <td className="text-end">{unitPrice}</td>
                            <td className="text-end">{discountPct}</td>
                            <td className="text-end">
                              {Number.isFinite(extPrice) ? extPrice.toFixed(2) : ""}
                            </td>
                            <td className="text-end text-muted">
                              {additionalcost > 0 ? additionalcost.toFixed(3) : "—"}
                            </td>
                            <td className="text-end text-muted">
                              {finalunitcost > 0 ? finalunitcost.toFixed(3) : "—"}
                            </td>
                            {!disableField && (
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => {
                                    setEditingIndex(index);
                                    setToolItem({
                                      itemid:
                                        (getValues(`items.${index}.itemid`) as unknown as number) ??
                                        undefined,
                                      itemcode: String(getValues(`items.${index}.itemcode`) || "") || undefined,
                                      itemdescription: String(getValues(`items.${index}.itemdescription`) || ""),
                                      itemunit: getValues(`items.${index}.itemunit`) || "",
                                      qtyordered: Number(getValues(`items.${index}.qtyordered`) || 0),
                                      orderunitcost: Number(getValues(`items.${index}.orderunitcost`) || 0),
                                      orddiscount: Number(getValues(`items.${index}.orddiscount`) || 0),
                                    });
                                  }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveItemRow(index)}
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

              {/* Add / Edit item row */}
              {!disableField && (
                <div className="border-top pt-3 mt-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="text-uppercase fw-semibold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                      {editingIndex != null ? `Editing Line ${editingIndex + 1}` : "+ Add Line Item"}
                    </div>
                    {editingIndex == null && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowImportWizard(true)}
                      >
                        Import from File
                      </button>
                    )}
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <label className="form-label small text-muted mb-1">Item <span className="text-danger">*</span></label>
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
                              itemdescription: "",
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
                            itemdescription: selected?.itemdescription || "",
                            itemunit: selected?.itemunit || "",
                            qtyordered: qtyValue,
                            orderunitcost: Number(selected?.itempurchaseprice ?? 0),
                          }));
                        }}
                      />
                    </div>

                    <div className="col-lg-3 col-md-6 col-sm-12">
                      <label className="form-label small text-muted mb-1">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        value={toolItem.itemdescription}
                        readOnly
                      />
                    </div>

                    <div className="col-lg-1 col-md-3 col-sm-6">
                      <label className="form-label small text-muted mb-1">Qty <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.001"
                        min={isReturnOrder ? undefined : 0}
                        className="form-control text-end"
                        value={toolItem.qtyordered}
                        disabled={disableField}
                        onChange={(e) => {
                          const n = Number(e.target.value || 0);
                          const abs = Math.abs(n);
                          const normalizedAbs = Math.round(abs * 1000) / 1000;
                          const normalized = isReturnOrder ? -normalizedAbs : normalizedAbs;
                          setToolItem((prev) => ({ ...prev, qtyordered: normalized }));
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
                        value={toolItem.orderunitcost}
                        disabled={disableField}
                        onChange={(e) => {
                          const n = Math.max(0, Number(e.target.value || 0));
                          setToolItem((prev) => ({ ...prev, orderunitcost: Math.round(n * 1000) / 1000 }));
                        }}
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
                        value={toolItem.orddiscount}
                        disabled={disableField}
                        onChange={(e) => {
                          const n = Number(e.target.value || 0);
                          const clamped = Math.min(100, Math.max(0, n));
                          setIsToolDiscountTouched(true);
                          setToolItem((prev) => ({ ...prev, orddiscount: Math.round(clamped * 1000) / 1000 }));
                        }}
                      />
                    </div>

                    <div className="col-lg-1 col-md-3 col-sm-6">
                      <label className="form-label small text-muted mb-1">Ext Price</label>
                      <input
                        type="text"
                        className="form-control text-end"
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

                    <div className="col-lg-1 col-md-3 col-sm-6">
                      {editingIndex == null ? (
                        <button
                          type="button"
                          className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                          onClick={() => {
                            const supplierIdNumber = Number(getValues("supplierid"));
                            if (!Number.isFinite(supplierIdNumber) || supplierIdNumber <= 0) {
                              dispatch(showNotification({ message: "Supplier is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            const warehouseIdNumber = Number(getValues("warehouseid"));
                            if (!Number.isFinite(warehouseIdNumber) || warehouseIdNumber <= 0) {
                              dispatch(showNotification({ message: "Warehouse is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            if (!Number.isFinite(parsedOutletId) || !currentOutlet) {
                              dispatch(showNotification({ message: "Outlet is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            if (!toolItem.itemid) {
                              dispatch(showNotification({ message: "Product is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            if (!toolItem.itemcode || String(toolItem.itemcode).trim() === "") {
                              dispatch(showNotification({ message: "Product is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            const qtyValue = Number(toolItem.qtyordered);
                            if (!Number.isFinite(qtyValue) || (isReturnOrder ? Math.abs(qtyValue) <= 0 : qtyValue <= 0)) {
                              dispatch(showNotification({ message: "Quantity is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            if (!Number.isFinite(toolItem.orderunitcost) || toolItem.orderunitcost <= 0) {
                              dispatch(showNotification({ message: "Unit Price is required", type: NOTIFICATION_TYPES.ERROR }));
                              return;
                            }
                            const normalizedQty = isReturnOrder
                              ? -Math.abs(Number(toolItem.qtyordered || 0))
                              : Number(toolItem.qtyordered || 0);
                            append({
                              itemid: toolItem.itemid,
                              itemcode: toolItem.itemcode ?? "",
                              itemdescription: toolItem.itemdescription,
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
                          <PlusCircle size={16} />
                        </button>
                      ) : (
                        <div className="btn-group w-100" role="group">
                          <button
                            type="button"
                            className="btn btn-success d-flex align-items-center justify-content-center"
                            onClick={() => {
                              const supplierIdNumber = Number(getValues("supplierid"));
                              if (!Number.isFinite(supplierIdNumber) || supplierIdNumber <= 0) {
                                dispatch(showNotification({ message: "Supplier is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              const warehouseIdNumber = Number(getValues("warehouseid"));
                              if (!Number.isFinite(warehouseIdNumber) || warehouseIdNumber <= 0) {
                                dispatch(showNotification({ message: "Warehouse is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              if (!Number.isFinite(parsedOutletId) || !currentOutlet) {
                                dispatch(showNotification({ message: "Outlet is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              if (!toolItem.itemid) {
                                dispatch(showNotification({ message: "Product is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              if (!toolItem.itemcode || String(toolItem.itemcode).trim() === "") {
                                dispatch(showNotification({ message: "Product is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              const qtyValue = Number(toolItem.qtyordered);
                              if (!Number.isFinite(qtyValue) || (isReturnOrder ? Math.abs(qtyValue) <= 0 : qtyValue <= 0)) {
                                dispatch(showNotification({ message: "Quantity is required", type: NOTIFICATION_TYPES.ERROR }));
                                return;
                              }
                              if (!Number.isFinite(toolItem.orderunitcost) || toolItem.orderunitcost <= 0) {
                                dispatch(showNotification({ message: "Unit Price is required", type: NOTIFICATION_TYPES.ERROR }));
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
                                itemdescription: toolItem.itemdescription,
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
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── NOTES + TOTALS ───────────────────────────── */}
          <div className="row g-3 mb-3">

            {/* Left — remarks */}
            <div className="col-lg-6 col-md-12">
              <div className="card h-100">
                <div className="card-body">
                  <label className="form-label small text-muted mb-1">Remarks</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    {...register("poremarks")}
                    disabled={disableField}
                  />
                </div>
              </div>
            </div>

            {/* Right — summary table */}
            <div className="col-lg-6 col-md-12">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3 text-muted small">
                    <span>{itemFields.length} item{itemFields.length !== 1 ? "s" : ""}</span>
                  </div>
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="ps-0 text-muted">Gross Total</td>
                        <td className="pe-0 text-end fw-semibold">{formatMoney(watch("pototalwithoutdiscount"))}</td>
                      </tr>
                      {Number(watch("podiscountamt") || 0) > 0 && (
                        <tr>
                          <td className="ps-0 text-muted">Discount</td>
                          <td className="pe-0 text-end text-danger">-{formatMoney(watch("podiscountamt"))}</td>
                        </tr>
                      )}
                      <tr className="border-top">
                        <td className="ps-0 text-muted">Subtotal</td>
                        <td className="pe-0 text-end">{formatMoney(watch("posubtotal"))}</td>
                      </tr>
                      {Number(watch("posales") || 0) > 0 && (
                        <tr>
                          <td className="ps-0 text-muted">
                            Sales Tax ({Number(watch("posales"))}%)
                          </td>
                          <td className="pe-0 text-end">{formatMoney(watch("posalestax"))}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="ps-0 text-muted">Freight / Shipping</td>
                        <td className="pe-0 text-end">
                          {disableField ? (
                            <span>{formatMoney(watch("pofreight"))}</span>
                          ) : (
                            <input
                              type="number"
                              className="form-control form-control-sm text-end d-inline-block"
                              style={{ width: 120 }}
                              {...register("pofreight", { valueAsNumber: true })}
                            />
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-0 text-muted">Duty / Tariff</td>
                        <td className="pe-0 text-end">
                          {disableField ? (
                            <span>{formatMoney(watch("podutypaid"))}</span>
                          ) : (
                            <input
                              type="number"
                              className="form-control form-control-sm text-end d-inline-block"
                              style={{ width: 120 }}
                              {...register("podutypaid", { valueAsNumber: true })}
                            />
                          )}
                        </td>
                      </tr>
                      {!disableField && (
                        <tr>
                          <td colSpan={2} className="pt-1 pb-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary w-100"
                              onClick={() => {
                                const freight = Number(watchedFreight || 0);
                                const duty = Number(watchedDutyPaid || 0);
                                const salesTax = Number(watch("posalestax") || 0);
                                const totalCharges = freight + duty + salesTax;
                                const currentItems = watchedItems || [];
                                const totalQty = currentItems.reduce((s: number, r: any) => s + Number(r.qtyordered || 0), 0);
                                const perPiece = totalQty > 0 ? Math.round((totalCharges / totalQty) * 1000) / 1000 : 0;
                                currentItems.forEach((item: any, i: number) => {
                                  const netCost = Number(item.orderunitcost || 0) * (1 - Number(item.orddiscount || 0) / 100);
                                  update(i, {
                                    ...item,
                                    additionalcost: perPiece,
                                    finalunitcost: Math.round((netCost + perPiece) * 1000) / 1000,
                                  });
                                });
                              }}
                            >
                              ⟳ Distribute Charges to Items
                            </button>
                          </td>
                        </tr>
                      )}
                      <tr className="border-top border-2">
                        <td className="ps-0 fw-bold" style={{ fontSize: "1rem" }}>PO Total</td>
                        <td className="pe-0 text-end fw-bold" style={{ fontSize: "1rem" }}>
                          {formatMoney(watch("pototal"))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <input type="hidden" {...register("pototalwithoutdiscount", { valueAsNumber: true })} />
                  <input type="hidden" {...register("podiscountamt", { valueAsNumber: true })} />
                  <input type="hidden" {...register("posubtotal", { valueAsNumber: true })} />
                  <input type="hidden" {...register("posalestax", { valueAsNumber: true })} />
                  <input type="hidden" {...register("pototal", { valueAsNumber: true })} />
                </div>
              </div>
            </div>

          </div>

        </fieldset>

        {disableField ? (
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
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={creating || updating || returning || poLoading}
              btnText={isEdit ? "Update" : "Save"}
              loadingText={isEdit ? "Updating ..." : "Saving ..."}
              type="button"
              onClick={() => void openSaveModeModalAndSubmit()}
            />
          </ActionFooter>
        )}
      </form>

      {showAPModal && apInitialData && (
        <POSupplierInvoiceModal
          storeId={parsedStoreId}
          initialData={apInitialData}
          onDone={() => {
            setShowAPModal(false);
            router.back();
          }}
        />
      )}

      {showImportWizard && (
        <POImportWizard
          storeId={parsedStoreId}
          userId={0}
          warehouseId={parsedWarehouseId}
          onClose={() => setShowImportWizard(false)}
          onDone={(importedItems, importedFileName) => {
            importedItems.forEach((item) =>
              append({
                itemid: item.itemid,
                itemcode: item.itemcode ?? "",
                itemdescription: item.itemdescription,
                itemunit: item.itemunit,
                qtyordered: item.qtyordered,
                orderunitcost: item.orderunitcost,
                orddiscount: item.orddiscount,
                ordextendedprice: item.qtyordered * item.orderunitcost * (1 - (item.orddiscount ?? 0) / 100),
              })
            );
            setPendingImportMeta({ fileName: importedFileName, count: importedItems.length });
            setShowImportWizard(false);
          }}
        />
      )}
    </>
  );
};

export default PurchaseOrderForm;
