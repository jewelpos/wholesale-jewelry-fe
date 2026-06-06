"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { UseFormTrigger } from "react-hook-form";
import { selectStyles } from "@/lib/styles/selectStyles";

interface SelectCustomerInvoiceProps {
  value: number | string | null;
  onChange: (value: any) => void;
  className?: string;
  trigger: UseFormTrigger<any>;
  disableField?: boolean;
  invoices?: Array<{ invoicenumber?: number | string }>;
  onChangeAdditional?: () => void;
  [key: string]: any;
}

const SelectCustomerInvoice = ({
  value,
  onChange,
  className,
  trigger,
  disableField,
  invoices,
  onChangeAdditional,
  ...field
}: SelectCustomerInvoiceProps) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const invoiceOptions: SelectOption[] = useMemo(() => {
    return (invoices ?? [])
      .filter((inv) => inv.invoicenumber !== undefined && inv.invoicenumber !== null)
      .map((inv) => ({
        value: inv.invoicenumber as string | number,
        label: String(inv.invoicenumber),
      }));
  }, [invoices]);

  return (
    <Select<SelectOption>
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
                invoiceOptions.find((inv) => inv.value === value)?.label ||
                "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value);
        trigger(field.name);
        onChangeAdditional?.();
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectCustomerInvoice;
