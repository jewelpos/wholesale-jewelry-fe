"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";
import { useQuery } from "@apollo/client";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";

const SelectMetalType = ({
  value,
  onChange,
  className,
  trigger,
  disableField,
  storeId,
  onChangeAdditional,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const { data } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const metalTypeOptions: SelectOption[] = useMemo(() => {
    const list = data?.getMetalTypeList ?? [];
    const active = list.filter((m: any) => m.metalstatus === "Active");
    if (active.length > 0) {
      return active.map((m: any) => ({ value: m.metalname, label: m.metalname }));
    }
    // Fallback to static options when DB has no data yet
    return [
      { value: "10Kt", label: "10Kt" },
      { value: "14Kt", label: "14Kt" },
      { value: "18Kt", label: "18Kt" },
      { value: "21Kt", label: "21Kt" },
      { value: "22Kt", label: "22Kt" },
      { value: "24Kt", label: "24Kt" },
    ];
  }, [data]);

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
                  ?.label || value,
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
