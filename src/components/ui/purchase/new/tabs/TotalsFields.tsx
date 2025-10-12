"use client";

import React from "react";

const TotalsFields = ({
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) => {
  return (
    <div className="row g-3">
      <div className="col-md-3">
        <label className="form-label">Discount %</label>
        <input type="number" step="0.01" className="form-control" {...register("podiscount")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Discount Amt</label>
        <input type="number" step="0.01" className="form-control" {...register("podiscountamt")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Subtotal</label>
        <input type="number" step="0.01" className="form-control" {...register("posubtotal")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Freight</label>
        <input type="number" step="0.01" className="form-control" {...register("pofreight")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Sales Tax</label>
        <input type="number" step="0.01" className="form-control" {...register("posalestax")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Duty Paid</label>
        <input type="number" step="0.01" className="form-control" {...register("podutypaid")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Tax</label>
        <input type="number" step="0.01" className="form-control" {...register("potax")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Total</label>
        <input type="number" step="0.01" className="form-control" {...register("pototal")} />
      </div>
    </div>
  );
};

export default TotalsFields;
