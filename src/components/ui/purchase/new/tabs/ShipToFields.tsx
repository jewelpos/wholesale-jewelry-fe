"use client";

import React from "react";

const ShipToFields = ({
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
}) => {
  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Company</label>
        <input className="form-control" {...register("poshiptocompanyname")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Address 1</label>
        <input className="form-control" {...register("poshiptoadd1")} />
      </div>
      <div className="col-md-4">
        <label className="form-label">Address 2</label>
        <input className="form-control" {...register("poshiptoadd2")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">City</label>
        <input className="form-control" {...register("poshiptocity")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">State</label>
        <input className="form-control" {...register("poshiptostate")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Zip</label>
        <input className="form-control" {...register("poshiptozip")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Country</label>
        <input className="form-control" {...register("poshiptocountry")} />
      </div>
      <div className="col-md-3">
        <label className="form-label">Phone</label>
        <input className="form-control" {...register("poshiptophone")} />
      </div>
    </div>
  );
};

export default ShipToFields;
