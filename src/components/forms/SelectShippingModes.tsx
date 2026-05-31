"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { useQuery } from "@apollo/client";
import { GET_SHIPPING_MODES_QUERY } from "@/lib/graphql/query/shipping";

const SelectShippingModes = ({
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
  const { loading, data } = useQuery(GET_SHIPPING_MODES_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const options: SelectOption[] = useMemo(
    () =>
      (data?.getShippingModes ?? []).map(
        (list: { shippingid: number; shippingname: string }) => ({
          value: list.shippingid,
          label: list.shippingname,
        })
      ),
    [data]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={options}
      placeholder="Select mode"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label: options.find((list) => list.value === value)?.label || "",
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

export default SelectShippingModes;
