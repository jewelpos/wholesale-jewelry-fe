"use client";

import React, { useState } from "react";
import { Control, Controller, UseFormSetValue, useFieldArray } from "react-hook-form";
import { PurchaseOrderFormType } from "@/types/purchase";
import SelectProduct from "@/components/forms/SelectProduct";

const PurchaseOrderItemsEditor = ({
  control,
  setValue,
  trigger,
  storeId,
}: {
  control: Control<PurchaseOrderFormType>;
  setValue: UseFormSetValue<PurchaseOrderFormType>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: any;
  storeId: number;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const [rowMeta, setRowMeta] = useState<Record<number, { unit?: string }>>({});

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Items</h6>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() =>
            append({ itemid: 0, itemcode: "", itemunit: "", qtyordered: 1, orderunitcost: 0, orddiscount: 0 })
          }
        >
          Add Item
        </button>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th style={{ width: 260 }}>Product</th>
                <th style={{ width: 160 }}>Item Code</th>
                <th style={{ width: 140 }}>Qty</th>
                <th style={{ width: 160 }}>Unit Cost</th>
                <th style={{ width: 140 }}>Discount</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id}>
                  <td>
                    <Controller
                      control={control}
                      name={`items.${index}.itemcode` as const}
                      render={({ field }) => (
                        <SelectProduct
                          valueItemCode={field.value as string}
                          onChangeItemCode={(code: string) => field.onChange(code)}
                          onChangeAdditional={(product: any) => {
                            if (!product) return;
                            setValue(`items.${index}.itemid`, Number(product.itemid) || 0);
                            setValue(`items.${index}.itemunit`, product.itemunit || "");
                            setValue(`items.${index}.orderunitcost`, Number(product.itemsellprice) || 0);
                            setValue(`items.${index}.orddiscount`, Number(product.itemdiscount) || 0);
                            setRowMeta((prev) => ({ ...prev, [index]: { unit: product.itemunit } }));
                            trigger(`items.${index}.itemid`);
                            trigger(`items.${index}.itemcode`);
                            trigger(`items.${index}.itemunit`);
                            trigger(`items.${index}.orderunitcost`);
                            trigger(`items.${index}.orddiscount`);
                          }}
                          trigger={trigger}
                          storeId={storeId}
                          disableField={false}
                          className="w-100"
                        />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      control={control}
                      name={`items.${index}.itemcode` as const}
                      render={({ field }) => (
                        <input type="text" className="form-control" {...field} disabled />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      control={control}
                      name={`items.${index}.qtyordered` as const}
                      render={({ field }) => (
                        <div className="d-flex align-items-center gap-2">
                          <input type="number" min={0} className="form-control" {...field} />
                          {rowMeta[index]?.unit && (
                            <span className="text-muted small">{rowMeta[index]?.unit}</span>
                          )}
                        </div>
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      control={control}
                      name={`items.${index}.orderunitcost` as const}
                      render={({ field }) => (
                        <input type="number" step="0.01" className="form-control" {...field} />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      control={control}
                      name={`items.${index}.orddiscount` as const}
                      render={({ field }) => (
                        <input type="number" step="0.01" className="form-control" {...field} />
                      )}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No items added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderItemsEditor;
