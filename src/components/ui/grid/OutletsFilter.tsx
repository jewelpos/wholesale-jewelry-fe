"use client";

import React, { Dispatch, SetStateAction, useEffect } from "react";
import { SelectOption } from "@/types/form";
import Select from "react-select";
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

type PropsType = {
  fetchOutletsList: (parsedStoreId: number[]) => void;
  outlets: OutletType[];
  loading: boolean;
  setSelectedOutlet: Dispatch<SetStateAction<number | undefined>>;
  selectedOutlet: number | undefined;
  stacked?: boolean;
};

const OutletsFilter = ({
  fetchOutletsList,
  outlets,
  loading,
  setSelectedOutlet,
  selectedOutlet,
  stacked,
}: PropsType) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = Number(outletId);

  useEffect(() => {
    if (parsedStoreId) {
      fetchOutletsList([parsedStoreId]);
    }
  }, [parsedStoreId, fetchOutletsList]);

  const outletList = outlets.map((outlet) => ({
    label: outlet.outletname,
    value: outlet.outletid,
  }));

  useEffect(() => {
    if (outlets.length && parsedOutletId) {
      const outlet = outlets.find(
        (outlet) => outlet.outletid === parsedOutletId
      );
      if (outlet) {
        setSelectedOutlet(outlet.outletid);
      }
    }
  }, [outlets, setSelectedOutlet, parsedOutletId]);

  if (stacked) {
    return (
      <div>
        <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Outlet</label>
        <div className="filter-select-wrap">
          <Select<SelectOption>
            className="w-100"
            classNamePrefix="react-select"
            options={outletList}
            value={selectedOutlet ? { value: selectedOutlet, label: outletList.find((o) => o.value === selectedOutlet)?.label || "" } : null}
            onChange={(option) => setSelectedOutlet(parseInt(option?.value as string, 10))}
            isLoading={loading}
            isClearable
            styles={filterSelectStyles}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="filter-select-wrap w-100">
      <Select<SelectOption>
        className="w-100"
        classNamePrefix="react-select"
        placeholder="Select Outlet"
        options={outletList}
        value={selectedOutlet ? { value: selectedOutlet, label: outletList.find((o) => o.value === selectedOutlet)?.label || "" } : null}
        onChange={(option) => setSelectedOutlet(parseInt(option?.value as string, 10))}
        isLoading={loading}
        isClearable
        styles={filterSelectStyles}
      />
    </div>
  );
};

export default OutletsFilter;
