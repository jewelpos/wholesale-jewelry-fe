"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import usePaymentMode from "@/hooks/usePaymentMode";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectPaymentMode = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  setPaymentMode,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchPaymentModes, paymentModes, loading } = usePaymentMode();

  useEffect(() => {
    if (storeId) {
      fetchPaymentModes(storeId);
    }
  }, [fetchPaymentModes, storeId]);

  const paymentModeOptions: SelectOption[] = useMemo(
    () =>
      paymentModes.map((mode) => ({
        value: mode.paymentmodeid,
        label: mode.paymodedescription || mode.paymode,
      })),
    [paymentModes]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={paymentModeOptions}
      placeholder="Select payment mode"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                paymentModeOptions.find((mode) => mode.value === value)
                  ?.label || "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value);
        trigger(field.name);
        if (setPaymentMode) {
          setPaymentMode(option?.label);
        }
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

export default SelectPaymentMode;
