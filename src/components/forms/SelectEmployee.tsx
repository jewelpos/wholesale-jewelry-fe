"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";
import { useQuery } from "@apollo/client";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";

const SelectEmployee = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  isDisabled,
  placeholder = "Select employee",
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const { data, loading } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const options: SelectOption[] = useMemo(() => {
    if (!data?.getUserListUnderStore) return [];
    const seen = new Set<number>();
    return data.getUserListUnderStore
      .filter((u: any) => u.isenabled)
      .reduce((acc: SelectOption[], u: any) => {
        if (!seen.has(u.userid)) {
          seen.add(u.userid);
          acc.push({ value: u.userid, label: u.userfullname || u.login });
        }
        return acc;
      }, []);
  }, [data]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={options}
      placeholder={placeholder}
      isClearable
      isDisabled={isDisabled}
      className={`form-control p-0 ${className ?? ""} select-form-custom`}
      value={
        value != null && value !== "" && value !== 0
          ? { value, label: options.find((o) => String(o.value) === String(value))?.label || String(value) }
          : null
      }
      onChange={(option) => {
        onChange(option?.value ?? null);
        trigger?.(field.name);
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

export default SelectEmployee;
