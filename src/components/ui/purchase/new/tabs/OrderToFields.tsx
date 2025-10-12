"use client";

import React from "react";

const OrderToFields = ({
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) => {
  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Company</label>
        <input className="form-control" {...register("poordtocompanyname")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Address 1</label>
        <input className="form-control" {...register("poordtoadd1")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Address 2</label>
        <input className="form-control" {...register("poordtoadd2")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">City</label>
        <input className="form-control" {...register("poordtocity")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">State</label>
        <input className="form-control" {...register("poordtostate")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Zip</label>
        <input className="form-control" {...register("poordtozip")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Country</label>
        <input className="form-control" {...register("poordtocountry")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Phone</label>
        <input className="form-control" {...register("poordtophone")} />
      </div>
    </div>
  );
};

export default OrderToFields;
