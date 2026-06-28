"use client";

import React, { useEffect } from "react";
import Select, { MultiValue } from "react-select";
import { useParams } from "next/navigation";
import { OutletType } from "@/types/outlet";
import { selectStyles } from "@/lib/styles/selectStyles";

const filterSelectStyles = {
  ...selectStyles,
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
  }),
};

type SelectOption = { label: string; value: number };

type PropsType = {
  fetchOutletsList: (storeIds: number[]) => void;
  outlets: OutletType[];
  loading: boolean;
  selectedOutletIds: number[];
  onChange: (ids: number[]) => void;
};

const MultiOutletSelect = ({
  fetchOutletsList,
  outlets,
  loading,
  selectedOutletIds,
  onChange,
}: PropsType) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);

  useEffect(() => {
    if (parsedStoreId) {
      fetchOutletsList([parsedStoreId]);
    }
  }, [parsedStoreId, fetchOutletsList]);

  const outletOptions: SelectOption[] = outlets.map((o) => ({
    label: o.outletname,
    value: o.outletid,
  }));

  const selected = outletOptions.filter((o) =>
    selectedOutletIds.includes(o.value)
  );

  const handleChange = (options: MultiValue<SelectOption>) => {
    onChange(options ? options.map((o) => o.value) : []);
  };

  return (
    <div>
      <label
        className="form-label mb-1"
        style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
      >
        Outlets
      </label>
      <Select<SelectOption, true>
        isMulti
        className="w-100"
        classNamePrefix="react-select"
        placeholder="Select outlets to compare..."
        options={outletOptions}
        value={selected}
        onChange={handleChange}
        isLoading={loading}
        closeMenuOnSelect={false}
        styles={filterSelectStyles}
      />
    </div>
  );
};

export default MultiOutletSelect;
