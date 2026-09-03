"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { selectStyles } from "@/lib/styles/selectStyles";
import { useQuery } from "@apollo/client";
import { GET_USERS_LIST_QUERY, GET_USER_NAME_BY_ID_QUERY } from "@/lib/graphql/query/user";

const SelectEmployee = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  outletId,
  // Bypasses outlet-access scoping to list every user in the store — for pickers where
  // that's the correct default (e.g. an invoice's Sales Rep field: commission is
  // legitimately split with a rep from another outlet, so the whole store's staff needs
  // to be selectable regardless of which outlet the current user themselves belongs to).
  // Leave false for staff-assignment pickers, where showing another outlet's employees
  // would be a real access leak, not a convenience.
  includeAll,
  isDisabled,
  placeholder = "Select employee",
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const { data, loading } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: storeId, outletid: includeAll ? undefined : (outletId || undefined), includeAll: !!includeAll },
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

  // Resolves the CURRENT value's label from the full roster this query already returned,
  // including disabled accounts — a rep assigned earlier while active but since disabled
  // must still show their real name here, even though they're correctly excluded from the
  // browsable `options` list above (which should only offer enabled staff for new picks).
  const currentValueLabel = useMemo(() => {
    const match = data?.getUserListUnderStore?.find((u: any) => String(u.userid) === String(value));
    return match ? (match.userfullname || match.login) : undefined;
  }, [data, value]);

  // A value set from a different outlet's context (e.g. a customer's default sales rep,
  // when the invoice is being created from another outlet) won't be in the outlet-scoped
  // options above, so it needs its own lookup to render as a name instead of a bare id.
  // This deliberately does NOT reuse GET_USERS_LIST_QUERY — that query intentionally
  // restricts results to outlets the current user can access (so they can't browse
  // another outlet's staff list), but resolving the label for an id that's already been
  // set elsewhere isn't browsing — it's just display, same as how an invoice always shows
  // its assigned sales rep's real name regardless of who's viewing it.
  const valueMissingFromOptions =
    value != null && value !== "" && value !== 0 && !currentValueLabel;
  const { data: fallbackData } = useQuery(GET_USER_NAME_BY_ID_QUERY, {
    variables: { storeid: storeId, userid: Number(value) },
    skip: !storeId || !valueMissingFromOptions,
  });
  const fallbackLabel = fallbackData?.getUserNameById?.userfullname || fallbackData?.getUserNameById?.login || undefined;

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
          ? { value, label: currentValueLabel || fallbackLabel || String(value) }
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
