"use client";

import React, { useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { getState } from "@/lib/utils/countryData";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectState = ({
  value,
  onChange,
  className,
  selectedCountry,
  trigger,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const stateList = getState(selectedCountry).map((state) => ({
    value: state.name,
    label: state.name,
  }));

  return (
    <Select<SelectOption>
      isDisabled={!stateList.length}
      options={stateList}
      placeholder="Select state"
      isClearable
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                stateList.find((state) => state.value === value)?.label || "",
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

export default SelectState;
