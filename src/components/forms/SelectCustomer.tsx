"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useCustomers from "@/hooks/useCustomers";

const SelectCustomer = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchCustomersByStoreId, customers, loading } = useCustomers();

  const parsedValue = value ? Number(value) : undefined;

  useEffect(() => {
    if (storeId) {
      fetchCustomersByStoreId(storeId);
    }
  }, [fetchCustomersByStoreId, storeId]);

  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers.map(
        (customer: { customerid: number; custcompanyname: string }) => ({
          value: Number(customer.customerid),
          label: `${customer.customerid} - ${customer.custcompanyname}`,
        })
      ),
    [customers]
  );
  return (
    <Select<SelectOption>
      isLoading={loading}
      options={customerOptions}
      placeholder="Select customer"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      filterOption={(candidate, rawInput) => {
        const q = String(rawInput || "").trim().toLowerCase();
        if (!q) return true;
        const label = String(candidate.label || "").toLowerCase();
        const value = String(candidate.value || "").toLowerCase();
        return label.includes(q) || value.includes(q);
      }}
      value={
        parsedValue
          ? {
              value: parsedValue,
              label:
                customerOptions.find(
                  (customer) => customer.value === parsedValue
                )?.label || "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value ? Number(option.value) : undefined);
        trigger(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      {...field}
    />
  );
};

export default SelectCustomer;
