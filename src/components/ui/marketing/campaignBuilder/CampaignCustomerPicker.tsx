"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { ColDef, SelectionChangedEvent } from "ag-grid-community";
import POSGridClient from "@/components/ui/grid/POSGridClient";
import { GET_CUSTOMER_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomersListType } from "@/types/customer";

export type CampaignCustomer = {
  customerid: number;
  companyname: string;
  email: string | null;
  marketingoptin: boolean;
};

interface Props {
  storeid: number;
  selectedCustomerIds: number[];
  onChange: (customers: CampaignCustomer[]) => void;
}

const isNew = (custregistrationdate?: string) => {
  if (!custregistrationdate) return false;
  const days = (Date.now() - new Date(custregistrationdate).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
};

const CampaignCustomerPicker = ({ storeid, selectedCustomerIds, onChange }: Props) => {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [lapsedOnly, setLapsedOnly] = useState(false);
  const [mostActiveFirst, setMostActiveFirst] = useState(false);

  const [getCustomerList, { data, loading }] = useLazyQuery(GET_CUSTOMER_LIST_QUERY, { fetchPolicy: "network-only" });

  useEffect(() => {
    if (!storeid) return;
    getCustomerList({ variables: { storeid, page: 1, perpage: 1000, filters: [], sortModel: [], rowGroupCols: [], groupKeys: [] } });
  }, [storeid, getCustomerList]);

  const rawRows: CustomersListType[] = data?.getCustomerList?.data ?? [];

  const regions = useMemo(() => Array.from(new Set(rawRows.map((r) => r.custcity).filter(Boolean))).sort(), [rawRows]);

  const rows = useMemo(() => {
    let filtered = rawRows.filter((r) => {
      if (search && !`${r.custcompanyname ?? ""} ${r.fullname ?? ""} ${r.custemailadd ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (region && r.custcity !== region) return false;
      if (newOnly && !isNew(r.custregistrationdate)) return false;
      if (lapsedOnly && Number(r.days_since_last_sale ?? 0) < 90) return false;
      return true;
    });
    if (mostActiveFirst) {
      filtered = [...filtered].sort((a, b) => Number(b.numberofsales ?? 0) - Number(a.numberofsales ?? 0));
    }
    return filtered;
  }, [rawRows, search, region, newOnly, lapsedOnly, mostActiveFirst]);

  const columnDefs: ColDef<CustomersListType>[] = useMemo(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: (p) => Number(p.data?.marketingoptin) === 1,
      width: 44,
      pinned: "left",
      sortable: false,
      filter: false,
    },
    { field: "custcompanyname", headerName: "Company", flex: 1, filter: "agTextColumnFilter" },
    { field: "custemailadd", headerName: "Email", flex: 1, filter: "agTextColumnFilter" },
    { field: "custcity", headerName: "Region", width: 130, filter: "agTextColumnFilter" },
    { field: "numberofsales", headerName: "# Sales", width: 90, filter: "agNumberColumnFilter" },
    { field: "days_since_last_sale", headerName: "Days Since Sale", width: 130, filter: "agNumberColumnFilter" },
    {
      headerName: "Subscribed",
      width: 120,
      filter: false,
      cellRenderer: (p: { data?: CustomersListType }) =>
        Number(p.data?.marketingoptin) === 1
          ? <span className="badge bg-success-subtle text-success">Subscribed</span>
          : <span className="badge bg-secondary-subtle text-secondary">Not subscribed</span>,
    },
  ], []);

  const handleSelectionChanged = (e: SelectionChangedEvent<CustomersListType>) => {
    const selected = e.api.getSelectedRows();
    onChange(
      selected.map((r) => ({
        customerid: Number(r.customerid),
        companyname: r.custcompanyname,
        email: r.custemailadd ?? null,
        marketingoptin: Number(r.marketingoptin) === 1,
      })),
    );
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <input className="form-control form-control-sm" style={{ maxWidth: 220 }} placeholder="Search name/email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="form-check form-check-inline mb-0">
          <input className="form-check-input" type="checkbox" id="custNewOnly" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
          <label className="form-check-label small" htmlFor="custNewOnly">New (last 30 days)</label>
        </div>
        <div className="form-check form-check-inline mb-0">
          <input className="form-check-input" type="checkbox" id="lapsedOnly" checked={lapsedOnly} onChange={(e) => setLapsedOnly(e.target.checked)} />
          <label className="form-check-label small" htmlFor="lapsedOnly">Not buying frequently (90+ days)</label>
        </div>
        <div className="form-check form-check-inline mb-0">
          <input className="form-check-input" type="checkbox" id="mostActiveFirst" checked={mostActiveFirst} onChange={(e) => setMostActiveFirst(e.target.checked)} />
          <label className="form-check-label small" htmlFor="mostActiveFirst">Most active first</label>
        </div>
        <span className="text-muted small ms-auto">{selectedCustomerIds.length} selected</span>
      </div>
      <div style={{ height: 320, width: "100%" }}>
        <POSGridClient gridKey="campaign-customer-picker"
          fillHeight
          rowData={rows}
          columnDefs={columnDefs}
          rowSelection="multiple"
          suppressRowClickSelection
          onSelectionChanged={handleSelectionChanged}
          onGridReady={() => {}}
          loading={loading}
          getRowId={(p: { data: CustomersListType }) => p.data.customerid}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default CampaignCustomerPicker;
