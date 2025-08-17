"use client";

import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { ProductFormType } from "@/types/product";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectItemCategory from "@/components/forms/SelectItemCategory";
import SelectSubCategory from "@/components/forms/SelectSubCategory";
import SelectMetalType from "@/components/forms/SelectMetalType";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import ProductImageUpload from "@/components/ui/products/ProductImageUpload";

interface ProductInformationTabProps {
  register: UseFormRegister<ProductFormType>;
  errors: any;
  control: Control<ProductFormType>;
  trigger: UseFormTrigger<ProductFormType>;
  setValue: UseFormSetValue<ProductFormType>;
  disableField?: boolean;
  storeId: number;
  productImages: File[];
  onImagesChange: (images: File[]) => void;
  isEdit?: boolean;
}

const ProductInformationTab: React.FC<ProductInformationTabProps> = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  disableField = false,
  storeId,
  productImages,
  onImagesChange,
  isEdit,
}) => {
  return (
    <div className="new-employee-field">
      {/* Item Code/SKU Section */}
      <div className="mb-4">
        <h5 className="mb-3">Item Code/SKU</h5>
        <div className="row">
          <div className="col-lg-4 col-md-12">
            <div className="mb-3">
              <label className="form-label">Warehouse</label>
              <Controller
                name="itemwarehouseid"
                control={control}
                rules={{ required: "Warehouse is required" }}
                render={({ field }) => (
                  <SelectWarehouse
                    {...field}
                    value={field.value}
                    onChange={(value: number) => {
                      field.onChange(value);
                      setValue("itemwarehouseid", value);
                    }}
                    trigger={trigger}
                    storeId={storeId}
                    disableField={disableField}
                    className={errors.itemwarehouseid ? "is-invalid" : ""}
                  />
                )}
              />
              {errors.itemwarehouseid && (
                <div className="invalid-feedback">
                  {errors.itemwarehouseid.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Item Code</label>
              <input
                type="text"
                className={`${errors.itemcode && "is-invalid"} form-control`}
                {...register("itemcode", {
                  required: "Item code is required",
                })}
                disabled={isEdit}
              />
              {errors.itemcode && (
                <div className="invalid-feedback">
                  {errors.itemcode.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Item Description</label>
              <input
                type="text"
                className={`${
                  errors.itemdescription && "is-invalid"
                } form-control`}
                {...register("itemdescription", {
                  required: "Item description is required",
                })}
                disabled={disableField}
              />
              {errors.itemdescription && (
                <div className="invalid-feedback">
                  {errors.itemdescription.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Detail Section */}
      <div className="mb-4">
        <h5 className="mb-3">Supplier Detail</h5>
        <div className="row">
          <div className="col-lg-4 col-md-12">
            <div className="mb-3">
              <label className="form-label">Supplier</label>
              <Controller
                name="supplierid"
                control={control}
                rules={{ required: "Supplier is required" }}
                render={({ field }) => (
                  <SelectSupplier
                    className={`${errors.supplierid && "is-invalid"} `}
                    trigger={trigger}
                    storeId={storeId}
                    disableField={disableField}
                    {...field}
                  />
                )}
              />
              {errors.supplierid && (
                <div className="invalid-feedback">
                  {errors.supplierid.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Settings Section */}
      <div className="mb-4">
        <h5 className="mb-3">Product Settings</h5>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Department</label>
              <Controller
                name="itemcategoryid"
                control={control}
                rules={{ required: "Department is required" }}
                render={({ field }) => (
                  <SelectItemCategory
                    className={`${errors.itemcategoryid && "is-invalid"} `}
                    trigger={trigger}
                    storeId={storeId}
                    disableField={disableField}
                    {...field}
                  />
                )}
              />
              {errors.itemcategoryid && (
                <div className="invalid-feedback">
                  {errors.itemcategoryid.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Product Line</label>
              <Controller
                name="subcategoryid"
                control={control}
                rules={{ required: "Product line is required" }}
                render={({ field }) => (
                  <SelectSubCategory
                    className={`${errors.subcategoryid && "is-invalid"} `}
                    trigger={trigger}
                    storeId={storeId}
                    disableField={disableField}
                    {...field}
                  />
                )}
              />
              {errors.subcategoryid && (
                <div className="invalid-feedback">
                  {errors.subcategoryid.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className={`${errors.itemstatus && "is-invalid"} form-select`}
                {...register("itemstatus", {
                  required: "Status is required",
                })}
                disabled={disableField}
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.itemstatus && (
                <div className="invalid-feedback">
                  {errors.itemstatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Image Upload Section */}
      <div className="mb-4">
        <h5 className="mb-3">Product Image Upload</h5>
        <div className="row">
          <div className="col-12">
            <ProductImageUpload
              images={productImages}
              onChange={onImagesChange}
              maxImages={1}
              disabled={disableField}
            />
          </div>
        </div>
      </div>

      {/* Sales Setting Section */}
      <div className="mb-4">
        <h5 className="mb-3">Sales Setting</h5>
        <div className="row">
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Unit Cost</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.itempurchaseprice && "is-invalid"
                } form-control`}
                {...register("itempurchaseprice", {
                  required: "Unit cost is required",
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.itempurchaseprice && (
                <div className="invalid-feedback">
                  {errors.itempurchaseprice.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Profit Percent</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.profitpercent && "is-invalid"
                } form-control`}
                {...register("profitpercent", {
                  required: "Profit percent is required",
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.profitpercent && (
                <div className="invalid-feedback">
                  {errors.profitpercent.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="mb-3">
              <label className="form-label">Tag Price</label>
              <input
                type="number"
                step="0.01"
                className={`${
                  errors.itemtagprice && "is-invalid"
                } form-control`}
                {...register("itemtagprice", {
                  valueAsNumber: true,
                })}
                disabled={disableField}
              />
              {errors.itemtagprice && (
                <div className="invalid-feedback">
                  {errors.itemtagprice.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Setting Section */}
      <div className="mb-4">
        <h5 className="mb-3">General Setting</h5>
        <div className="row">
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className={`${errors.itemremarks && "is-invalid"} form-control`}
                rows={3}
                {...register("itemremarks")}
                disabled={disableField}
              />
              {errors.itemremarks && (
                <div className="invalid-feedback">
                  {errors.itemremarks.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInformationTab;
