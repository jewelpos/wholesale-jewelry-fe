
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { useLazyQuery } from "@apollo/client";

import { SelectOption } from "@/types/form";
import { GET_TRANSFER_STATUS_LIST_QUERY } from "@/lib/graphql/query/products";
import { TransferStatus } from "@/types/product";
import { selectStyles } from "@/lib/styles/selectStyles";

type Props = {
  value?: number;
  onChange?: (value?: number) => void;
  className?: string;
  trigger?: (name?: string) => void;
  storeId: number;
  disableField?: boolean;
  excludeIds?: number[];
  name?: string;
};

const SelectInventoryStatus = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  excludeIds,
  ...field
}: Props) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [statuses, setStatuses] = useState<TransferStatus[]>([]);

  const [getTransferStatusList, { loading }] = useLazyQuery(
    GET_TRANSFER_STATUS_LIST_QUERY
  );

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  useEffect(() => {
    if (!storeId) return;

    const run = async () => {
      const { data } = await getTransferStatusList({
        variables: {
          storeid: Number(storeId),
        },
        fetchPolicy: "no-cache",
      });

      setStatuses((data?.getTransferStatusList || []) as TransferStatus[]);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const statusOptions: SelectOption[] = useMemo(() => {
    const excluded = new Set((excludeIds || []).map((n) => Number(n)));
    return statuses
      .filter((s) => !excluded.has(Number(s.transferstatusid)))
      .map((s) => ({
        value: Number(s.transferstatusid),
        label: s.statusname || String(s.transferstatusid),
      }));
  }, [statuses, excludeIds]);

  const selectedOption: SelectOption | null = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const opt = statusOptions.find((o) => Number(o.value) === n);
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [statusOptions, value]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={statusOptions}
      placeholder="Select status"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className || ""} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={selectStyles}
      value={selectedOption}
      onChange={(option) => {
        const v = option?.value ? Number(option.value) : undefined;
        if (onChange) onChange(v);
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

export default SelectInventoryStatus;
