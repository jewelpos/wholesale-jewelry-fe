"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectMetalType = ({
  value,
  onChange,
  className,
  trigger,
  disableField,
  onChangeAdditional,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const metalTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: "10Kt", label: "10Kt" },
      { value: "14Kt", label: "14Kt" },
      { value: "18Kt", label: "18Kt" },
      { value: "21Kt", label: "21Kt" },
      { value: "22Kt", label: "22Kt" },
      { value: "24Kt", label: "24Kt" },
    ],
    []
  );

  return (
    <Select<SelectOption>
      options={metalTypeOptions}
      placeholder="Select metal type"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                metalTypeOptions.find((metal) => metal.value === value)
                  ?.label || "",
            }
          : null
      }
      onChange={(option) => {
        if (onChangeAdditional) onChangeAdditional(option?.value);
        else {
          onChange(option?.value);
          trigger(field.name);
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

export default SelectMetalType;
