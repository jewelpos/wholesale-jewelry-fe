"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { useLazyQuery } from "@apollo/client";

import { SelectOption } from "@/types/form";
import { GET_INVENTORY_TRANSFER_LIST_BY_STATUS_QUERY } from "@/lib/graphql/query/products";
import { InventoryItemTransfer } from "@/types/product";
import { selectStyles } from "@/lib/styles/selectStyles";

type Props = {
  value?: number;
  onChange?: (value?: number) => void;
  onChangeAdditional?: (selected?: InventoryItemTransfer) => void;
  className?: string;
  trigger?: (name?: string) => void;
  storeId: number;
  transferstatusid: number;
  disableField?: boolean;
  name?: string;
};

const SelectTransferRequest = ({
  value,
  onChange,
  onChangeAdditional,
  className,
  trigger,
  storeId,
  transferstatusid,
  disableField,
  ...field
}: Props) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [transfers, setTransfers] = useState<InventoryItemTransfer[]>([]);

  const [getTransfers, { loading }] = useLazyQuery(
    GET_INVENTORY_TRANSFER_LIST_BY_STATUS_QUERY
  );

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  useEffect(() => {
    if (!storeId || !transferstatusid) return;

    const run = async () => {
      const { data } = await getTransfers({
        variables: {
          storeid: Number(storeId),
          transferstatusid: Number(transferstatusid),
        },
        fetchPolicy: "no-cache",
      });

      setTransfers((data?.getInventoryTransferListByStatus || []) as InventoryItemTransfer[]);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, transferstatusid]);

  const filteredTransfers = useMemo(() => {
    const q = String(input || "").trim().toLowerCase();
    if (!q) return transfers;

    return transfers.filter((t) => {
      const hay = [
        t.inventoryitemtransferid,
        t.transfersource,
        t.destination,
        t.transfertype,
        t.transferstatus,
        t.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [transfers, input]);

  const options: SelectOption[] = useMemo(() => {
    return filteredTransfers.map((t) => {
      const id = Number(t.inventoryitemtransferid);
      const label = `${id} - ${t.transfersource || ""} → ${t.destination || ""}`.trim();
      return { value: id, label };
    });
  }, [filteredTransfers]);

  const selectedOption: SelectOption | null = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const opt = options.find((o) => Number(o.value) === n);
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [options, value]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={options}
      placeholder="Select Transfer Request"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className || ""} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={selectStyles}
      value={selectedOption}
      onChange={(option) => {
        const v = option?.value ? Number(option.value) : undefined;
        const selected = filteredTransfers.find(
          (t) => Number(t.inventoryitemtransferid) === Number(v)
        );
        if (onChange) onChange(v);
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

export default SelectTransferRequest;
