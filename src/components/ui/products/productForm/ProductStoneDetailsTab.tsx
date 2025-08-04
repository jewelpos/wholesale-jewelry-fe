"use client";

import React from "react";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { ProductFormType } from "@/types/product";

interface ProductStoneDetailsTabProps {
  register: UseFormRegister<ProductFormType>;
  errors: FieldErrors<ProductFormType>;
  control: Control<ProductFormType>;
  trigger: UseFormTrigger<ProductFormType>;
  setValue: UseFormSetValue<ProductFormType>;
  disableField?: boolean;
}

const ProductStoneDetailsTab: React.FC<ProductStoneDetailsTabProps> = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  disableField = false,
}) => {
  return (
    <div className="new-employee-field">
      {/* Stone Details Section */}
      <div className="mb-4">
        <h5 className="mb-3">Stone Details</h5>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Shape</label>
              <input
                type="text"
                className={`${errors.dshape && "is-invalid"} form-control`}
                {...register("dshape")}
                disabled={disableField}
              />
              {errors.dshape && (
                <div className="invalid-feedback">{errors.dshape.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Laboratory</label>
              <input
                type="text"
                className={`${errors.dlab && "is-invalid"} form-control`}
                {...register("dlab")}
                disabled={disableField}
              />
              {errors.dlab && (
                <div className="invalid-feedback">{errors.dlab.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Certificate #</label>
              <input
                type="text"
                className={`${errors.dcerno && "is-invalid"} form-control`}
                {...register("dcerno")}
                disabled={disableField}
              />
              {errors.dcerno && (
                <div className="invalid-feedback">{errors.dcerno.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Carat Weight</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.dcarat && "is-invalid"} form-control`}
                {...register("dcarat", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dcarat && (
                <div className="invalid-feedback">{errors.dcarat.message}</div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Diameter</label>
              <input
                type="text"
                className={`${errors.ddiameter && "is-invalid"} form-control`}
                {...register("ddiameter")}
                disabled={disableField}
              />
              {errors.ddiameter && (
                <div className="invalid-feedback">
                  {errors.ddiameter.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Color</label>
              <input
                type="text"
                className={`${errors.dcolor && "is-invalid"} form-control`}
                {...register("dcolor")}
                disabled={disableField}
              />
              {errors.dcolor && (
                <div className="invalid-feedback">{errors.dcolor.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Clarity</label>
              <input
                type="text"
                className={`${errors.dclarity && "is-invalid"} form-control`}
                {...register("dclarity")}
                disabled={disableField}
              />
              {errors.dclarity && (
                <div className="invalid-feedback">
                  {errors.dclarity.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Fluorescence</label>
              <input
                type="text"
                className={`${errors.dflorence && "is-invalid"} form-control`}
                {...register("dflorence")}
                disabled={disableField}
              />
              {errors.dflorence && (
                <div className="invalid-feedback">
                  {errors.dflorence.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Polarity</label>
              <input
                type="text"
                className={`${errors.dpolarity && "is-invalid"} form-control`}
                {...register("dpolarity")}
                disabled={disableField}
              />
              {errors.dpolarity && (
                <div className="invalid-feedback">
                  {errors.dpolarity.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Depth %</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.ddepth && "is-invalid"} form-control`}
                {...register("ddepth", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.ddepth && (
                <div className="invalid-feedback">{errors.ddepth.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Table %</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.dtable && "is-invalid"} form-control`}
                {...register("dtable", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dtable && (
                <div className="invalid-feedback">{errors.dtable.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Girdle</label>
              <input
                type="text"
                className={`${errors.dgirdle && "is-invalid"} form-control`}
                {...register("dgirdle")}
                disabled={disableField}
              />
              {errors.dgirdle && (
                <div className="invalid-feedback">{errors.dgirdle.message}</div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Culet</label>
              <input
                type="text"
                className={`${errors.dculut && "is-invalid"} form-control`}
                {...register("dculut")}
                disabled={disableField}
              />
              {errors.dculut && (
                <div className="invalid-feedback">{errors.dculut.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Polish</label>
              <input
                type="text"
                className={`${errors.dpolish && "is-invalid"} form-control`}
                {...register("dpolish")}
                disabled={disableField}
              />
              {errors.dpolish && (
                <div className="invalid-feedback">{errors.dpolish.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Symmetry</label>
              <input
                type="text"
                className={`${errors.dsymmetry && "is-invalid"} form-control`}
                {...register("dsymmetry")}
                disabled={disableField}
              />
              {errors.dsymmetry && (
                <div className="invalid-feedback">
                  {errors.dsymmetry.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Crown Height</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.dcrownheight && "is-invalid"
                } form-control`}
                {...register("dcrownheight", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dcrownheight && (
                <div className="invalid-feedback">
                  {errors.dcrownheight.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Crown Angle</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.dcrownangle && "is-invalid"} form-control`}
                {...register("dcrownangle", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dcrownangle && (
                <div className="invalid-feedback">
                  {errors.dcrownangle.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Pavillion Height</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.dpavillionheight && "is-invalid"
                } form-control`}
                {...register("dpavillionheight", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dpavillionheight && (
                <div className="invalid-feedback">
                  {errors.dpavillionheight.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Pavillion Depth</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.dpavillionangle && "is-invalid"
                } form-control`}
                {...register("dpavillionangle", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dpavillionangle && (
                <div className="invalid-feedback">
                  {errors.dpavillionangle.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Measurement LxWxD</label>
              <input
                type="text"
                className={`${errors.dmesurement && "is-invalid"} form-control`}
                {...register("dmesurement")}
                disabled={disableField}
              />
              {errors.dmesurement && (
                <div className="invalid-feedback">
                  {errors.dmesurement.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Size Ref</label>
              <input
                type="text"
                className={`${errors.dsize && "is-invalid"} form-control`}
                {...register("dsize")}
                disabled={disableField}
              />
              {errors.dsize && (
                <div className="invalid-feedback">{errors.dsize.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Quality</label>
              <input
                type="text"
                className={`${errors.dquality && "is-invalid"} form-control`}
                {...register("dquality")}
                disabled={disableField}
              />
              {errors.dquality && (
                <div className="invalid-feedback">
                  {errors.dquality.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Stock Number</label>
              <input
                type="text"
                className={`${errors.dstockno && "is-invalid"} form-control`}
                {...register("dstockno")}
                disabled={disableField}
              />
              {errors.dstockno && (
                <div className="invalid-feedback">
                  {errors.dstockno.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Rapaport Price</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.drapprice && "is-invalid"} form-control`}
                {...register("drapprice", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.drapprice && (
                <div className="invalid-feedback">
                  {errors.drapprice.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Cost Per Carat</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.dcost && "is-invalid"} form-control`}
                {...register("dcost", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dcost && (
                <div className="invalid-feedback">{errors.dcost.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Sell Price Per Carat</label>
              <input
                type="number"
                step="0.01"
                className={`${errors.dsaleprice && "is-invalid"} form-control`}
                {...register("dsaleprice", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.dsaleprice && (
                <div className="invalid-feedback">
                  {errors.dsaleprice.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Price Code</label>
              <input
                type="text"
                className={`${errors.dpricecode && "is-invalid"} form-control`}
                {...register("dpricecode")}
                disabled={disableField}
              />
              {errors.dpricecode && (
                <div className="invalid-feedback">
                  {errors.dpricecode.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductStoneDetailsTab;
