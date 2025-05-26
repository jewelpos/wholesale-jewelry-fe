"use client";

import React, { useEffect, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";

const SelectStatus = ({
  value,
  onChange,
  className,
  trigger,
  status,
  setValue,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const statusOptions: SelectOption[] = [
    {
      value: 0,
      label: "Inactive",
    },
    {
      value: 1,
      label: "Active",
    },
  ];

  useEffect(() => {
    if (!status) {
      setValue("status", 0, {
        shouldDirty: false,
        shouldTouch: false,
      });
      trigger();
    }
  }, [setValue, status, trigger]);

  return (
    <Select<SelectOption>
      options={statusOptions}
      placeholder="Select status"
      isClearable
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                statusOptions.find((status) => status.value === value)?.label ||
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

export default SelectStatus;
