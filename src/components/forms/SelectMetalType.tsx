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

  const metalTypeOptions: (SelectOption & { metalcode?: string; ratescolumn?: string })[] = useMemo(() => {
    const list = data?.getMetalTypeList ?? [];
    const active = list.filter((m: any) => m.metalstatus === "Active");
    if (active.length > 0) {
      return active.map((m: any) => ({
        value: m.metalname,
        label: m.metalname,
        metalcode: m.metalcode ?? undefined,
        ratescolumn: m.ratescolumn ?? undefined,
      }));
    }
    // Fallback to static options when DB has no data yet
    return [
      { value: "10Kt", label: "10Kt", ratescolumn: "gold10kt_gram" },
      { value: "14Kt", label: "14Kt", ratescolumn: "gold14kt_gram" },
      { value: "18Kt", label: "18Kt", ratescolumn: "gold18kt_gram" },
      { value: "21Kt", label: "21Kt" },
      { value: "22Kt", label: "22Kt", ratescolumn: "gold22kt_gram" },
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
        if (onChangeAdditional) onChangeAdditional(option);
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
