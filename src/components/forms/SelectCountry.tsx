"use client";

import React, { useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { countries } from "@/lib/utils/countryData";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectCountry = ({
  value,
  onChange,
  className,
  trigger,
  disableField,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const countryList = countries.map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  const handleInputChange = (newValue: string) => {
    setInput(newValue);
    if (
      newValue &&
      !countryList.some((country) =>
        country.label.toLowerCase().includes(newValue.toLowerCase())
      )
    ) {
      onChange(newValue);
      trigger(field.name);
    }
  };

  return (
    <Select<SelectOption>
      options={countryList}
      placeholder="Select country"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                countryList.find((country) => country.value === value)?.label ||
                value,
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
      onInputChange={handleInputChange}
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectCountry;
