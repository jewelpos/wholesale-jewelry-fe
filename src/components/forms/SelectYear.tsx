"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectYear = ({
  value,
  onChange,
  className,
  trigger,
  disableField,
  totalYears,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const yearOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: totalYears }, (_, i) => ({
        value: new Date().getFullYear() - i,
        label: String(new Date().getFullYear() - i),
      })),
    [totalYears]
  );

  return (
    <Select<SelectOption>
      options={yearOptions}
      placeholder="Select year"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                yearOptions.find((year) => year.value === value)?.label || "",
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
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectYear;
