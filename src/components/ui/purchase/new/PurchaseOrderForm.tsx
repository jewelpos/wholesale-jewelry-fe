"use client";

import React, { useState } from "react";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { useParams } from "next/navigation";
import { PurchaseOrderFormType } from "@/types/purchase";
import { CREATE_PURCHASE_ORDER_MUTATION, EDIT_PURCHASE_ORDER_MUTATION } from "@/lib/graphql/mutations/purchase";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import PurchaseOrderItemsEditor from "./PurchaseOrderItemsEditor";
import dayjs from "dayjs";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import useWarehouse from "@/hooks/useWarehouse";
import GeneralFields from "./tabs/GeneralFields";
import OrderToFields from "./tabs/OrderToFields";
import ShipToFields from "./tabs/ShipToFields";
import TotalsFields from "./tabs/TotalsFields";

const PurchaseOrderForm = ({
  ponumber,
  setShowPurchaseOrderFormModal,
  handleRefresh,
}: {
  ponumber?: number;
  setShowPurchaseOrderFormModal: (value: boolean) => void;
  handleRefresh?: () => void;
}) => {
  const dispatch = useDispatch();
  const { storeId: storeIdParam, outletId } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [createPO, { loading: createLoading }] = useMutation(CREATE_PURCHASE_ORDER_MUTATION);
  const [editPO, { loading: editLoading }] = useMutation(EDIT_PURCHASE_ORDER_MUTATION);

  const [activeTab, setActiveTab] = useState<string>("general");
  const [showSaveConfirm, setShowSaveConfirm] = useState<boolean>(false);
  const PURCHASE_ORDER_SAVE_MODE = {
    BACKORDER: "SAVE_AS_BACKORDER",
    RECEIVE: "SAVE_AND_RECEIVE",
  } as const;

  const { register, handleSubmit, control, formState: { isDirty, errors }, reset, getValues, trigger, setValue } = useForm<PurchaseOrderFormType>({
    defaultValues: {
      storeid: parsedStoreId,
      supplierid: "",
      warehouseid: "",
      saveMode: "",
      podate: undefined,
      porequestdate: undefined,
      poconfirmedto: "",
      poremarks: "",
      poshippingmethod: "",
      podiscount: "",
      podiscountamt: "",
      posubtotal: "",
      pofreight: "",
      posalestax: "",
      podutypaid: "",
      potax: "",
      pototal: "",
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
      items: [
        {
          itemid: 0,
          itemcode: "",
          itemunit: "",
          qtyordered: 1,
          orderunitcost: 0,
          orddiscount: 0,
        },
      ],
    },
    mode: "all",
  });

  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const systemWarehouse = warehouses.find((w: { issystem: boolean }) => w.issystem);

  React.useEffect(() => {
    if (outletId) {
      fetchWarehouseByOutletId(Number(outletId));
    }
  }, [fetchWarehouseByOutletId, outletId]);

  React.useEffect(() => {
    if (systemWarehouse) {
      setValue("warehouseid", systemWarehouse.warehouseid.toString());
    }
  }, [systemWarehouse, setValue]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      setShowPurchaseOrderFormModal(false);
    },
  });

  const onSubmit: SubmitHandler<PurchaseOrderFormType> = async (formData) => {
    const payload: any = {
      ...formData,
      storeid: parsedStoreId,
      supplierid: Number(formData.supplierid),
      warehouseid: Number(formData.warehouseid),
      podate: formData.podate ? dayjs(formData.podate).toISOString() : undefined,
      porequestdate: formData.porequestdate ? dayjs(formData.porequestdate).toISOString() : undefined,
      podiscount: formData.podiscount !== "" && formData.podiscount != null ? Number(formData.podiscount) : undefined,
      podiscountamt: formData.podiscountamt !== "" && formData.podiscountamt != null ? Number(formData.podiscountamt) : undefined,
      posubtotal: formData.posubtotal !== "" && formData.posubtotal != null ? Number(formData.posubtotal) : undefined,
      pofreight: formData.pofreight !== "" && formData.pofreight != null ? Number(formData.pofreight) : undefined,
      posalestax: formData.posalestax !== "" && formData.posalestax != null ? Number(formData.posalestax) : undefined,
      podutypaid: formData.podutypaid !== "" && formData.podutypaid != null ? Number(formData.podutypaid) : undefined,
      potax: formData.potax !== "" && formData.potax != null ? Number(formData.potax) : undefined,
      pototal: formData.pototal !== "" && formData.pototal != null ? Number(formData.pototal) : undefined,
      termsid: formData.termsid != null ? Number(formData.termsid) : undefined,
      pomode: formData.pomode != null ? Number(formData.pomode) : undefined,
      poshippingmethod:
        formData.poshippingmethod !== "" && formData.poshippingmethod != null
          ? Number(formData.poshippingmethod)
          : undefined,
      items: formData.items?.map((it) => ({
        itemid: Number(it.itemid),
        itemcode: it.itemcode,
        itemunit: it.itemunit,
        qtyordered: Number(it.qtyordered),
        orderunitcost: Number(it.orderunitcost),
        orddiscount: Number(it.orddiscount ?? 0),
      })),
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (ponumber) {
        response = await editPO({ variables: { input: { ...payload, ponumber } } });
      } else {
        response = await createPO({ variables: { input: payload } });
      }
      const { data } = response;
      const res = data?.createPurchaseOrder || data?.editPurchaseOrder;
      if (res) {
        dispatch(showNotification({ message: res.message, type: NOTIFICATION_TYPES.SUCCESS }));
        handleRefresh?.();
        setShowPurchaseOrderFormModal(false);
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Supplier</label>
          <Controller
            control={control}
            name="supplierid"
            rules={{ required: true }}
            render={({ field }) => (
              <SelectSupplier
                value={field.value ? Number(field.value) : undefined}
                onChange={(val: number | undefined) => field.onChange(val ?? "")}
                trigger={trigger}
                storeId={parsedStoreId}
                disableField={false}
                className="w-100"
              />
            )}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Warehouse</label>
          <input
            type="text"
            className={`${errors.warehouseid && "is-invalid"} form-control`}
            {...register("warehouseid", { required: "Warehouse is required" })}
            disabled
            hidden
          />
          <input
            type="text"
            className={`${errors.warehouseid && "is-invalid"} form-control`}
            value={systemWarehouse?.warehousename || ""}
            disabled
          />
          {errors.warehouseid && (
            <div className="invalid-feedback">{String(errors.warehouseid.message)}</div>
          )}
        </div>
        <div className="col-md-4">
          <label className="form-label">PO Date</label>
          <input type="date" className="form-control" {...register("podate")} />
        </div>
      </div>

      <div className="mt-3">
        <PurchaseOrderItemsEditor control={control} setValue={setValue} trigger={trigger} storeId={parsedStoreId} />
      </div>

      <ul className="nav nav-tabs mt-3">
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>
            General
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === "orderTo" ? "active" : ""}`} onClick={() => setActiveTab("orderTo")}>
            Order To
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === "shipTo" ? "active" : ""}`} onClick={() => setActiveTab("shipTo")}>
            Ship To
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === "totals" ? "active" : ""}`} onClick={() => setActiveTab("totals")}>
            Totals
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === "other" ? "active" : ""}`} onClick={() => setActiveTab("other")}>
            Other
          </button>
        </li>
      </ul>

      <div className="tab-content border border-top-0 p-3">
        {activeTab === "general" && (
          <GeneralFields register={register} control={control} trigger={trigger} storeId={parsedStoreId} />
        )}
        {activeTab === "orderTo" && <OrderToFields register={register} />}
        {activeTab === "shipTo" && <ShipToFields register={register} />}
        {activeTab === "totals" && <TotalsFields register={register} />}

        {activeTab === "other" && (
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Confirmed To</label>
              <input className="form-control" {...register("poconfirmedto")} />
            </div>
            <div className="col-md-4">
              <label className="form-label">PO Mode</label>
              <input type="number" className="form-control" {...register("pomode")} />
            </div>
            <div className="col-12">
              <label className="form-label">Remarks</label>
              <input className="form-control" {...register("poremarks")} />
            </div>
            <div className="col-md-4">
              <label className="form-label">RMA No</label>
              <input className="form-control" {...register("rmano")} />
            </div>
          </div>
        )}

      </div>

      <ActionFooter handleCancel={handleCancel}>
        <ButtonLoader
          loading={createLoading || editLoading}
          btnText="Save"
          loadingText="Saving ..."
          type="button"
          className="btn btn-primary"
          disabled={createLoading || editLoading}
          onClick={() => setShowSaveConfirm(true) as unknown as void}
        />
      </ActionFooter>

      {showSaveConfirm && (
        <>
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Choose Save Mode</h5>
                  <button type="button" className="btn-close" onClick={() => setShowSaveConfirm(false)} />
                </div>
                <div className="modal-body">
                  <p>Select how you want to save this purchase order.</p>
                </div>
                <div className="modal-footer d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    disabled={createLoading || editLoading}
                    onClick={async () => {
                      setValue("saveMode", PURCHASE_ORDER_SAVE_MODE.BACKORDER as unknown as string);
                      setShowSaveConfirm(false);
                      await handleSubmit(onSubmit)();
                    }}
                  >
                    Save - Back Order
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    disabled={createLoading || editLoading}
                    onClick={async () => {
                      setValue("saveMode", PURCHASE_ORDER_SAVE_MODE.RECEIVE as unknown as string);
                      setShowSaveConfirm(false);
                      await handleSubmit(onSubmit)();
                    }}
                  >
                    Save & Received All Merchandise
                  </button>
                  <button type="button" className="btn btn-secondary w-100" onClick={() => setShowSaveConfirm(false)}>
                    Cancel Save
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </form>
  );
};

export default PurchaseOrderForm;
