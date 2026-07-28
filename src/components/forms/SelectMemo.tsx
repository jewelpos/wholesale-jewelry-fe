"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import dayjs from "dayjs";
import { useLazyQuery } from "@apollo/client";

import { SelectOption } from "@/types/form";
import { GET_MEMO_LIST_QUERY } from "@/lib/graphql/query/sales";
import { MemoSummary } from "@/types/sales";
import { useDebounce } from "@/hooks/useDebounce";
import { TIME_FORMAT } from "@/lib/config/constants";
import { selectStyles } from "@/lib/styles/selectStyles";

const formatMemoDate = (raw: unknown) => {
  if (!raw) return "";
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return dayjs(asNumber).format(TIME_FORMAT);
  }
  const d = dayjs(String(raw));
  return d.isValid() ? d.format(TIME_FORMAT) : String(raw);
};

// Only plain memos (not credit memos) that aren't cancelled/shipped, and still have
// remaining balance (hasremaining), are offered — no point picking one that's already
// fully invoiced/credited out.
const SelectMemo = ({
  value,
  onChange,
  onChangeAdditional,
  className,
  trigger,
  storeId,
  outletId,
  customerId,
  disableField,
  ...field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 400);
  const [memos, setMemos] = useState<MemoSummary[]>([]);

  const [getMemos, { loading }] = useLazyQuery(GET_MEMO_LIST_QUERY);

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  const fetchMemos = async (searchText?: string) => {
    if (!storeId || !outletId || !customerId) {
      setMemos([]);
      return;
    }

    const filters: { key: string; value: object }[] = [
      { key: "customerid", value: { filterType: "text", type: "equals", filter: String(customerId) } },
      { key: "salemodename", value: { filterType: "text", type: "equals", filter: "Memo" } },
    ];
    const trimmed = String(searchText || "").trim();
    if (trimmed) {
      filters.push({ key: "memonumber", value: { filterType: "text", type: "contains", filter: trimmed } });
    }

    const { data } = await getMemos({
      variables: {
        storeid: Number(storeId),
        outletid: Number(outletId),
        page: 1,
        perpage: 50,
        filters,
        sortModel: [{ colId: "memonumber", sort: "desc" }],
        rowGroupCols: [],
        groupKeys: [],
      },
      fetchPolicy: "no-cache",
    });

    const all: MemoSummary[] = data?.getMemoList?.data || [];
    setMemos(
      all.filter(
        (m) => m.statusname !== "Cancelled" && m.statusname !== "Shipped" && m.hasremaining
      )
    );
  };

  useEffect(() => {
    if (storeId && outletId && customerId) {
      fetchMemos(debouncedInput);
    } else {
      setMemos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, outletId, customerId, debouncedInput]);

  const memoOptions: SelectOption[] = useMemo(
    () =>
      memos.map((m) => ({
        value: Number(m.memonumber),
        label: `#${m.memonumber} - ${formatMemoDate(m.saledate)} - Balance ${m.balancedue ?? 0}`,
      })),
    [memos]
  );

  const selectedOption: SelectOption | null = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const opt = memoOptions.find((opt) => Number(opt.value) === n);
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [memoOptions, value]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={memoOptions}
      placeholder={customerId ? "Select Memo" : "Select customer first"}
      isClearable
      isDisabled={disableField || !customerId}
      className={`form-control p-0 ${className} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={selectStyles}
      value={selectedOption}
      onChange={(option) => {
        const selected = memos.find((m) => Number(m.memonumber) === Number(option?.value));
        if (onChange) onChange(option?.value ? Number(option.value) : 0);
        if (onChangeAdditional) onChangeAdditional(selected);
        if (trigger && field?.name) trigger(field.name);
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

export default SelectMemo;
