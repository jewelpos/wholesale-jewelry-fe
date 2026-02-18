"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";

import { GET_SINGLE_PURCHASE_ORDER_QUERY, GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { RECEIVE_PURCHASE_ORDER_MUTATION } from "@/lib/graphql/mutations/purchase";
import { PurchaseOrderItem, ReceivePurchaseOrderInput } from "@/types/purchase";
import SelectPurchaseOrder from "@/components/forms/SelectPurchaseOrder";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";

type ReceivePurchaseOrderFormType = {
  ponumber: number;
  postingdate: dayjs.Dayjs;
};

const ReceivePurchaseOrderForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [poHeader, setPoHeader] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [receiveQtyByItemId, setReceiveQtyByItemId] = useState<Record<number, number>>({});

  const [getSinglePurchaseOrder, { loading: poLoading }] = useLazyQuery(
    GET_SINGLE_PURCHASE_ORDER_QUERY
  );
  const [getPurchaseOrderItems] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY
  );

  const [receivePurchaseOrder, { loading: saving }] = useMutation(
    RECEIVE_PURCHASE_ORDER_MUTATION
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm<ReceivePurchaseOrderFormType>({
    defaultValues: {
      ponumber: 0,
      postingdate: dayjs(),
    },
    mode: "all",
  });

  const totalItems = useMemo(() => items.length, [items.length]);
  const totalOrderedQty = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.qtyordered || 0), 0),
    [items]
  );
  const totalBackOrderQty = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.itemqtybackorder || 0), 0),
    [items]
  );
  const totalReceiveQty = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(receiveQtyByItemId[it.poitemid] || 0),
        0
      ),
    [items, receiveQtyByItemId]
  );

  const fetchPo = async (poNumber: number) => {
    const result = await handleTryCatch(async () => {
      const { data } = await getSinglePurchaseOrder({
        variables: {
          storeid: parsedStoreId,
          ponumber: poNumber,
        },
        fetchPolicy: "no-cache",
      });

      const purchaseOrder = data?.getSinglePurchaseOrder?.purchaseorder;
      setPoHeader(purchaseOrder ?? null);

      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      setPoHeader(null);
      setItems([]);
      setReceiveQtyByItemId({});
    }
  };

  const fetchItems = async (poNumber: number) => {
    const result = await handleTryCatch(async () => {
      const { data } = await getPurchaseOrderItems({
        variables: {
          storeid: parsedStoreId,
          ponumber: poNumber,
          page: 1,
          perpage: 1000,
          filters: [],
          sortModel: [],
          rowGroupCols: [],
          groupKeys: [],
        },
        fetchPolicy: "no-cache",
      });

      const list = data?.getSupplierPurchaseOrderItemsList?.data || [];
      setItems(list);

      const initial: Record<number, number> = {};
      for (const it of list) {
        if (typeof it?.poitemid === "number") initial[it.poitemid] = 0;
      }
      setReceiveQtyByItemId(initial);

      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      setItems([]);
      setReceiveQtyByItemId({});
    }
  };

  const onSubmit = async (formData: ReceivePurchaseOrderFormType) => {
    const poNumber = Number(formData.ponumber);
    if (!parsedStoreId || !Number.isFinite(poNumber) || poNumber <= 0) {
      dispatch(
        showNotification({
          message: "PO Number is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const itemsToReceive = items
      .map((it) => ({
        poitemid: it.poitemid,
        qtyToReceive: Number(receiveQtyByItemId[it.poitemid] || 0),
        itemqtybackorder: Number(it.itemqtybackorder || 0),
      }))
      .filter((it) => it.qtyToReceive > 0);

    if (!itemsToReceive.length) {
      dispatch(
        showNotification({
          message: "Enter receive quantity for at least one item",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const hasInvalidQty = itemsToReceive.some(
      (it) =>
        !Number.isFinite(it.qtyToReceive) ||
        it.qtyToReceive < 0 ||
        it.qtyToReceive > it.itemqtybackorder
    );

    if (hasInvalidQty) {
      dispatch(
        showNotification({
          message: "Receive qty must be between 0 and Back Order Qty",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload: ReceivePurchaseOrderInput = {
      storeid: parsedStoreId,
      ponumber: poNumber,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      items: itemsToReceive.map((it) => ({
        poitemid: it.poitemid,
        qtyToReceive: it.qtyToReceive,
      })),
    };

    const result = await handleTryCatch(async () => {
      const response = await receivePurchaseOrder({
        variables: {
          input: payload,
        },
      });

      const successData = response.data?.receivePurchaseOrder;
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

  const header = poHeader || {};

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">PO Number</label>
                <div className="col-md-8">
                  <Controller
                    control={control}
                    name="ponumber"
                    rules={{ required: true, min: 1 }}
                    render={({ field }) => (
                      <SelectPurchaseOrder
                        {...field}
                        value={field.value}
                        onChange={(v: number) => {
                          const n = Number(v);
                          field.onChange(Number.isFinite(n) ? n : 0);

                          if (!parsedStoreId || !Number.isFinite(n) || n <= 0) {
                            setPoHeader(null);
                            setItems([]);
                            setReceiveQtyByItemId({});
                            return;
                          }

                          fetchPo(n);
                          fetchItems(n);
                        }}
                        trigger={trigger}
                        storeId={parsedStoreId}
                        postatus={2}
                        className=""
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Posting Date</label>
                <div className="col-md-8">
                  <div className="input-groupicon calender-input">
                    <Calendar className="info-img" />
                    <Controller
                      control={control}
                      name="postingdate"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <DatePicker
                          suffixIcon={<Calendar size={14} />}
                          format="YYYY-MM-DD"
                          className="form-control"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">PO Date</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.podate
                        ? dayjs(Number(header.podate)).format(TIME_FORMAT)
                        : ""
                    }
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Created By</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.pocreatebyid ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Status</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.statusname ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">PO Request Date</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.porequestdate
                        ? dayjs(Number(header.porequestdate)).format(TIME_FORMAT)
                        : ""
                    }
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">PO Confirmed To</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.poconfirmedto ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Order Discount</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.podiscount ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Payment Terms</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.termsid ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">Shipping Mode</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.poshippingmethod ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks mb-0 row align-items-center">
                <label className="col-form-label col-md-4">To Outlet (Warehouse)</label>
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    value={String(header.warehouseid ?? "")}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <h5 className="mb-3">Order To</h5>
                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Supplier (ID)</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.supplierid ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Supplier Name</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poordtocompanyname ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Address</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poordtoadd1 ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Address 2</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poordtoadd2 ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">City/State/Zip/Country</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={
                        [
                          String(header.poordtocity ?? ""),
                          String(header.poordtostate ?? ""),
                          String(header.poordtozip ?? ""),
                          String(header.poordtocountry ?? ""),
                        ]
                          .filter(Boolean)
                          .join(", ")
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Phone</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poordtophone ?? "")}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="border rounded p-3 h-100">
                <h5 className="mb-3">To Outlet</h5>

                <div className="input-blocks mb-0 row align-items-center">
                  <label className="col-form-label col-md-4">Outlet Name</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poshiptocompanyname ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Address</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poshiptoadd1 ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Address 2</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poshiptoadd2 ?? "")}
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">City/State/Zip/Country</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={
                        [
                          String(header.poshiptocity ?? ""),
                          String(header.poshiptostate ?? ""),
                          String(header.poshiptozip ?? ""),
                          String(header.poshiptocountry ?? ""),
                        ]
                          .filter(Boolean)
                          .join(", ")
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="input-blocks mb-0 mt-2 row align-items-center">
                  <label className="col-form-label col-md-4">Phone</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={String(header.poshiptophone ?? "")}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="mb-2">Items</h5>
            <div className="table-responsive">
              <table className="table datanew">
                <thead>
                  <tr>
                    <th>Sr#</th>
                    <th>Item #</th>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th>Order Qty</th>
                    <th>Back Order Qty</th>
                    <th>Receive Qty</th>
                    <th>Remaining Qty</th>
                    <th>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {!poLoading && items.map((it, idx) => {
                    const bo = Number(it.itemqtybackorder || 0);
                    const receiveQty = Number(receiveQtyByItemId[it.poitemid] || 0);
                    const remaining = Math.max(0, bo - receiveQty);

                    return (
                      <tr key={it.poitemid}>
                        <td>{idx + 1}</td>
                        <td>{it.poitemid}</td>
                        <td>{it.itemcode}</td>
                        <td>{it.itemdescription ?? ""}</td>
                        <td>{Number(it.qtyordered || 0).toFixed(2)}</td>
                        <td>{bo.toFixed(2)}</td>
                        <td style={{ minWidth: 140 }}>
                          <input
                            type="number"
                            className="form-control"
                            value={receiveQtyByItemId[it.poitemid] ?? 0}
                            min={0}
                            max={bo}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const n = raw === "" ? 0 : Number(raw);
                              const safe = Number.isFinite(n) ? n : 0;
                              const bounded = Math.min(Math.max(0, safe), bo);
                              setReceiveQtyByItemId((prev) => ({
                                ...prev,
                                [it.poitemid]: bounded,
                              }));
                            }}
                          />
                        </td>
                        <td>{remaining.toFixed(2)}</td>
                        <td>${Number(it.orderunitcost || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="row mt-3">
              <div className="col-lg-3 col-md-6 col-sm-12">
                <div className="input-blocks">
                  <label>Total Items</label>
                  <input
                    type="text"
                    className="form-control"
                    value={totalItems}
                    disabled
                  />
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-12">
                <div className="input-blocks">
                  <label>Total Qty</label>
                  <input
                    type="text"
                    className="form-control"
                    value={totalOrderedQty.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-12">
                <div className="input-blocks">
                  <label>Total BO Qty</label>
                  <input
                    type="text"
                    className="form-control"
                    value={totalBackOrderQty.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-12">
                <div className="input-blocks">
                  <label>Rec Qty</label>
                  <input
                    type="text"
                    className="form-control"
                    value={totalReceiveQty.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          <ActionFooter handleCancel={() => router.back()}>
            <ButtonLoader
              loading={saving}
              btnText="Receive"
              loadingText="Receiving ..."
              disabled={!isValid || saving}
            />
          </ActionFooter>
        </div>
      </div>
    </form>
  );
};

export default ReceivePurchaseOrderForm;
