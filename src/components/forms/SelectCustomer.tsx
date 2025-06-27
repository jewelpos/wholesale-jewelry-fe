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

  useEffect(() => {
    if (storeId) {
      fetchCustomersByStoreId(storeId);
    }
  }, [fetchCustomersByStoreId, storeId]);

  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers.map(
        (customer: { customerid: number; custcompanyname: string }) => ({
          value: customer.customerid,
          label: customer.custcompanyname,
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
      value={
        value
          ? {
              value: value,
              label:
                customerOptions.find((customer) => customer.value === value)
                  ?.label || "",
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

export default SelectCustomer;
