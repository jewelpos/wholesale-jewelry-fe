"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";
import { useLazyQuery } from "@apollo/client";
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

  const [fetchUsers, { data, loading }] = useLazyQuery(GET_USERS_LIST_QUERY);

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

  const handleMenuOpen = () => {
    if (!data && storeId) fetchUsers({ variables: { storeid: storeId } });
    setMenuIsOpen(true);
  };

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
      onMenuOpen={handleMenuOpen}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectEmployee;
