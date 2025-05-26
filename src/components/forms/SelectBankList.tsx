"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { useQuery } from "@apollo/client";
import { GET_BANK_LIST_QUERY } from "@/lib/graphql/query/payment";

const SelectBankList = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { loading, data } = useQuery(GET_BANK_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const options: SelectOption[] = useMemo(
    () =>
      data?.getBanksList.map((list: { bankid: number; bankname: string }) => ({
        value: list.bankid,
        label: list.bankname,
      })),
    [data]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={options}
      placeholder="Select bank"
      isClearable
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label: options.find((term) => term.value === value)?.label || "",
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

export default SelectBankList;
