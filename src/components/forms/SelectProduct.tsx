"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import useProducts, { ItemDetails } from "@/hooks/useProducts";
import { selectStyles } from "@/lib/styles/selectStyles";

type ProductOption = {
  value: number;
  label: string;
  data: ItemDetails;
};

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
  initialLabel,
  onNotFound,
  clearKey,
  scanValue,
  ...field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const { searchInventoryItems } = useProducts();
  const portalTarget = typeof window !== "undefined" ? document.body : undefined;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [inputText, setInputText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(null);

  // Clear selection, input text, and refocus for next scan whenever clearKey increments
  useEffect(() => {
    if (clearKey !== undefined) {
      setSelectedOption(null);
      setInputText("");
      setTimeout(() => selectRef.current?.focus(), 50);
    }
  }, [clearKey]);

  // Sync selection with controlled value prop (edit mode via initialLabel)
  useEffect(() => {
    if (value != null && initialLabel) {
      setSelectedOption({ value, label: initialLabel, data: {} as ItemDetails });
    } else if (value == null) {
      setSelectedOption(null);
    }
  }, [value, initialLabel]);

  // Notify parent that no bulk product list is loaded (API compat)
  useEffect(() => {
    if (onProductsLoaded) onProductsLoaded([]);
  }, [onProductsLoaded]);

  const getWarehouseFilter = useCallback(
    () =>
      hasWarehouseId && Number.isFinite(warehouseId) && warehouseId > 0
        ? warehouseId
        : null,
    [hasWarehouseId, warehouseId]
  );

  const applyExactMatch = useCallback(
    (options: ProductOption[], query: string) => {
      const numericInput = Number(query.trim());
      if (!Number.isFinite(numericInput) || numericInput <= 0) return false;
      const exactMatch = options.find(
        (opt) =>
          Number(opt.data.itembarcodeid) === numericInput ||
          Number(opt.data.itemid) === numericInput
      );
      if (!exactMatch) return false;
      setSelectedOption(exactMatch);
      if (onChange) onChange(exactMatch.value);
      if (onChangeItemCode && exactMatch.data) onChangeItemCode(exactMatch.data.itemcode);
      if (onChangeAdditional) onChangeAdditional(exactMatch.data);
      if (trigger) trigger(field.name);
      return true;
    },
    [onChange, onChangeItemCode, onChangeAdditional, trigger, field.name]
  );

  // Trigger search when a barcode value is injected externally (e.g. camera scan)
  const searchImmediateRef = useRef<(query: string) => Promise<void>>(async () => {});
  const prevScanValueRef = useRef<string | undefined>(undefined);

  // Immediate search triggered by Enter key on numeric input (barcode scan)
  const searchImmediate = useCallback(
    async (query: string) => {
      const items = await searchInventoryItems(storeId, getWarehouseFilter(), query);
      const options: ProductOption[] = items.map((item: ItemDetails) => ({
        value: item.itemid,
        label: `${item.itembarcodeid ? `${item.itembarcodeid} - ` : ""}${item.itemcode} - ${item.itemdescription}`,
        data: item,
      }));
      if (options.length === 0) {
        if (onNotFound) onNotFound();
        return;
      }
      applyExactMatch(options, query);
    },
    [searchInventoryItems, storeId, getWarehouseFilter, applyExactMatch, onNotFound]
  );

  // Keep ref current so the scanValue effect below never uses a stale closure
  useEffect(() => { searchImmediateRef.current = searchImmediate; }, [searchImmediate]);

  useEffect(() => {
    if (!scanValue) {
      prevScanValueRef.current = undefined;
      return;
    }
    if (scanValue === prevScanValueRef.current) return;
    prevScanValueRef.current = scanValue;
    searchImmediateRef.current(scanValue);
  }, [scanValue]);

  const loadOptions = useCallback(
    (inputValue: string): Promise<ProductOption[]> => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return new Promise((resolve) => {
        if (!inputValue || inputValue.trim().length < 2) {
          resolve([]);
          return;
        }
        debounceTimer.current = setTimeout(async () => {
          const items = await searchInventoryItems(storeId, getWarehouseFilter(), inputValue);
          const options: ProductOption[] = items.map((item: ItemDetails) => ({
            value: item.itemid,
            label: `${item.itembarcodeid ? `${item.itembarcodeid} - ` : ""}${item.itemcode} - ${item.itemdescription}`,
            data: item,
          }));

          if (options.length === 0) {
            if (onNotFound) onNotFound();
            resolve([]);
            return;
          }

          const matched = applyExactMatch(options, inputValue);
          if (matched) {
            resolve([]); // prevent dropdown from opening on exact match
            return;
          }

          resolve(options);
        }, 300);
      });
    },
    [searchInventoryItems, storeId, getWarehouseFilter, applyExactMatch, onNotFound]
  );

  return (
    <AsyncSelect<ProductOption>
      ref={selectRef}
      loadOptions={loadOptions}
      defaultOptions={false}
      placeholder="Type to search (min 2 chars)..."
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={selectStyles}
      value={selectedOption}
      inputValue={inputText}
      onInputChange={(val, { action }) => {
        if (action === "input-change") setInputText(val);
        if (action === "set-value" || action === "input-blur") setInputText("");
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          const query = inputText.trim();
          // Barcode scan: numeric input — clear immediately and search in background
          if (/^\d+$/.test(query) && query.length >= 2) {
            setInputText("");
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            searchImmediate(query);
          }
        }
      }}
      onChange={(option) => {
        if (option) {
          setSelectedOption(option);
          if (onChange) onChange(option.value);
          if (onChangeItemCode && option.data) onChangeItemCode(option.data.itemcode);
          if (onChangeAdditional) onChangeAdditional(option.data);
        } else {
          setSelectedOption(null);
          if (onChange) onChange(null);
          if (onChangeItemCode) onChangeItemCode(null);
          if (onChangeAdditional) onChangeAdditional(null);
        }
        if (trigger) trigger(field.name);
      }}
      {...field}
    />
  );
};

export default SelectProduct;
