"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useSupplier from "@/hooks/useSupplier";
import { UseFormTrigger } from "react-hook-form";

interface SelectSupplierInvoiceProps {
  value: number | string | null;
  onChange: (value: any) => void;
  className?: string;
  trigger: UseFormTrigger<any>;
  storeId: number;
  supplierId: number | null;
  disableField?: boolean;
  // other Controller props
  [key: string]: any;
}

const SelectSupplierInvoice = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  supplierId,
  disableField,
  ...field
}: SelectSupplierInvoiceProps) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchSupplierInvoices, supplierInvoices, loading } = useSupplier();

  useEffect(() => {
    if (storeId && supplierId) {
      fetchSupplierInvoices(storeId, supplierId);
    }
  }, [fetchSupplierInvoices, storeId, supplierId]);

  const invoiceOptions: SelectOption[] = useMemo(
    () =>
      supplierInvoices.map((inv) => ({
        value: inv.veninvoiceno,
        label: inv.veninvoiceno,
      })),
    [supplierInvoices]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={invoiceOptions}
      placeholder="Select invoice"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                invoiceOptions.find((inv) => inv.value === value)?.label || "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value);
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

export default SelectSupplierInvoice;
