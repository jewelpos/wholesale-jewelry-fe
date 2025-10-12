"use client";

import React from "react";
import { Control, Controller } from "react-hook-form";
import { PurchaseOrderFormType } from "@/types/purchase";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";

const GeneralFields = ({
  register,
  control,
  trigger,
  storeId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  control: Control<PurchaseOrderFormType>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: any;
  storeId: number;
}) => {
  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Request Date</label>
        <input type="date" className="form-control" {...register("porequestdate")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Confirmed To</label>
        <input className="form-control" {...register("poconfirmedto")} />
      </div>
      <div className="col-md-8">
        <label className="form-label">Remarks</label>
        <input className="form-control" {...register("poremarks")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Shipping Method</label>
        <Controller
          control={control}
          name="poshippingmethod"
          render={({ field }) => (
            <SelectShippingModes
              value={field.value ? Number(field.value) : undefined}
              onChange={(val: number | undefined) => field.onChange(val ?? "")}
              trigger={trigger}
              storeId={storeId}
              disableField={false}
              className="w-100"
            />
          )}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Terms ID</label>
        <Controller
          control={control}
          name="termsid"
          render={({ field }) => (
            <SelectPaymentTerms
              value={field.value ? Number(field.value) : undefined}
              onChange={(val: number | undefined) => field.onChange(val)}
              trigger={trigger}
              storeId={storeId}
              disableField={false}
              className="w-100"
            />
          )}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">PO Mode</label>
        <input type="number" className="form-control" {...register("pomode")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">RMA No</label>
        <input className="form-control" {...register("rmano")} />
      </div>
    </div>
  );
};

export default GeneralFields;
