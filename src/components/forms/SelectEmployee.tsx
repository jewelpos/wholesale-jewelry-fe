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
  outletId,
  isDisabled,
  placeholder = "Select employee",
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const { data, loading } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: storeId, outletid: outletId || undefined },
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

  // A value set from a different outlet's context (e.g. a customer's default sales rep,
  // when the invoice is being created from another outlet) won't be in the outlet-scoped
  // options above, so it renders as a bare numeric id. Resolve just its label from a
  // store-wide lookup — without widening the browsable dropdown itself, which is what the
  // outlet scoping above exists to prevent (duplicate same-named accounts per outlet).
  const valueMissingFromOptions =
    value != null && value !== "" && value !== 0 && !options.some((o) => String(o.value) === String(value));
  const { data: fallbackData } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId || !outletId || !valueMissingFromOptions,
  });
  const fallbackLabel = useMemo(() => {
    const match = fallbackData?.getUserListUnderStore?.find((u: any) => String(u.userid) === String(value));
    return match ? (match.userfullname || match.login) : undefined;
  }, [fallbackData, value]);

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
          ? { value, label: options.find((o) => String(o.value) === String(value))?.label || fallbackLabel || String(value) }
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
