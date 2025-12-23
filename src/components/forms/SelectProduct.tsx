"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useProducts from "@/hooks/useProducts";

const SelectProduct = ({
  value,
  onChange,
  onChangeAdditional,
  onProductsLoaded,
  valueItemCode,
  onChangeItemCode,
  className,
  trigger,
  storeId,
  hasWarehouseId,
  warehouseId,
  disableField,
  ...field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const {
    fetchProductsByStoreId,
    fetchProductsWithStockByStoreAndWarehouseId,
    products,
    loading,
  } = useProducts();
  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  useEffect(() => {
    if (onProductsLoaded) onProductsLoaded(products);
  }, [onProductsLoaded, products]);

  useEffect(() => {
    if (storeId) {
      if (hasWarehouseId) {
        if (Number.isFinite(warehouseId) && warehouseId > 0) {
          fetchProductsWithStockByStoreAndWarehouseId(storeId, warehouseId);
        }
        return;
      }

      fetchProductsByStoreId(storeId);
    }
  }, [
    fetchProductsByStoreId,
    fetchProductsWithStockByStoreAndWarehouseId,
    storeId,
    hasWarehouseId,
    warehouseId,
  ]);

  const productOptions: SelectOption[] = useMemo(
    () =>
      products.map((p) => ({
        value: p.itemid,
        label: `${p.itemcode} - ${p.itemdescription}`,
      })),
    [products]
  );

  // Resolve current selected option by either itemid (value) or itemcode (valueItemCode)
  const selectedOption: SelectOption | null = useMemo(() => {
    if (value != null) {
      const opt = productOptions.find((opt) => opt.value === value);
      return opt ? { value: opt.value, label: opt.label } : null;
    }
    if (valueItemCode) {
      const product = products.find((p) => p.itemcode === valueItemCode);
      if (product) return { value: product.itemid, label: `${product.itemcode} - ${product.itemdescription}` };
    }
    return null;
  }, [value, valueItemCode, productOptions, products]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={productOptions}
      placeholder="Select product"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
      }}
      value={selectedOption}
      onChange={(option) => {
        const selected = products.find((p) => p.itemid === option?.value);
        if (onChange) onChange(option?.value);
        if (onChangeItemCode && selected) onChangeItemCode(selected.itemcode);
        if (onChangeAdditional) onChangeAdditional(selected);
        trigger(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      {...field}
    />
  );
};

export default SelectProduct;
