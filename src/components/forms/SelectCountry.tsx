"use client";

import React, { useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { countries } from "@/lib/utils/countryData";

const SelectCountry = ({
  value,
  onChange,
  className,
  trigger,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const countryList = countries.map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  return (
    <Select<SelectOption>
      options={countryList}
      placeholder="Select store category"
      isClearable
      className={`form-control p-0 ${className}`}
      value={
        value
          ? {
              value: value,
              label:
                countryList.find((country) => country.value === value)?.label ||
                "",
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

export default SelectCountry;
