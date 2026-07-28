"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { ColDef, SelectionChangedEvent } from "ag-grid-community";
import POSGridClient from "@/components/ui/grid/POSGridClient";
import { GET_PRODUCT_LIST_QUERY, GET_PRODUCT_AGING_LIST_QUERY } from "@/lib/graphql/query/products";

export type CampaignItem = {
  itemcode: string;
  itemdescription: string;
  itemsellprice: number;
  itemimagepath: string | null;
};

type ProductRow = {
  itemcode: string;
  itemdescription: string;
  itemsellprice?: number;
  sale_price?: number;
  itemimagepath?: string | null;
  itemquantityinhand?: number;
  createddate?: string;
  sales_aging_bucket?: string;
  inbound_aging_bucket?: string;
};

interface Props {
  outletid: number;
  storeid: number;
  selectedItems: CampaignItem[];
  onChange: (items: CampaignItem[]) => void;
}

const isNew = (createddate?: string) => {
  if (!createddate) return false;
  const days = (Date.now() - new Date(createddate).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
};

const CampaignProductPicker = ({ outletid, storeid, selectedItems, onChange }: Props) => {
  const [mode, setMode] = useState<"all" | "aging">("all");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [overstockOnly, setOverstockOnly] = useState(false);
  const [slowSellingOnly, setSlowSellingOnly] = useState(false);

  const [getProductList, { data: productData, loading: productLoading }] = useLazyQuery(GET_PRODUCT_LIST_QUERY, { fetchPolicy: "network-only" });
  const [getAgingList, { data: agingData, loading: agingLoading }] = useLazyQuery(GET_PRODUCT_AGING_LIST_QUERY, { fetchPolicy: "network-only" });

  useEffect(() => {
    if (!outletid) return;
    if (mode === "all") {
      getProductList({ variables: { outletid, page: 1, perpage: 500, filters: [], sortModel: [], rowGroupCols: [], groupKeys: [] } });
    } else {
      getAgingList({ variables: { storeid, outletid, page: 1, perpage: 500, filters: [], sortModel: [], rowGroupCols: [], groupKeys: [] } });
    }
  }, [mode, outletid, storeid, getProductList, getAgingList]);

  const rawRows: ProductRow[] = mode === "all"
    ? (productData?.getProductListNew?.data ?? [])
    : (agingData?.getProductAgingList?.data ?? []);

  const rows = useMemo(() => {
    return rawRows.filter((r) => {
      const price = Number(r.itemsellprice ?? r.sale_price ?? 0);
      if (search && !`${r.itemcode} ${r.itemdescription}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      if (mode === "all" && newOnly && !isNew(r.createddate)) return false;
      if (mode === "aging" && overstockOnly && !(Number(r.itemquantityinhand ?? 0) > 0)) return false;
      if (mode === "aging" && slowSellingOnly && !r.sales_aging_bucket) return false;
      return true;
    });
  }, [rawRows, search, minPrice, maxPrice, newOnly, overstockOnly, slowSellingOnly, mode]);

  const columnDefs: ColDef<ProductRow>[] = useMemo(() => {
    const base: ColDef<ProductRow>[] = [
      { headerCheckboxSelection: true, checkboxSelection: true, width: 44, pinned: "left", sortable: false, filter: false },
      { field: "itemcode", headerName: "Item Code", width: 130, filter: "agTextColumnFilter" },
      { field: "itemdescription", headerName: "Description", flex: 1, filter: "agTextColumnFilter" },
      {
        headerName: "Price",
        width: 110,
        filter: "agNumberColumnFilter",
        valueGetter: (p) => Number(p.data?.itemsellprice ?? p.data?.sale_price ?? 0),
        valueFormatter: (p) => `$${Number(p.value ?? 0).toFixed(2)}`,
      },
    ];
    if (mode === "all") {
      base.push({ field: "itemquantityinhand", headerName: "Qty", width: 90, filter: "agNumberColumnFilter" });
    } else {
      base.push({ field: "itemquantityinhand", headerName: "Qty in Hand", width: 110, filter: "agNumberColumnFilter" });
      base.push({ field: "sales_aging_bucket", headerName: "Last Sale Aging", width: 140, filter: "agTextColumnFilter" });
      base.push({ field: "inbound_aging_bucket", headerName: "In-Stock Aging", width: 140, filter: "agTextColumnFilter" });
    }
    return base;
  }, [mode]);

  const handleSelectionChanged = (e: SelectionChangedEvent<ProductRow>) => {
    const selected = e.api.getSelectedRows();
    onChange(
      selected.map((r) => ({
        itemcode: r.itemcode,
        itemdescription: r.itemdescription,
        itemsellprice: Number(r.itemsellprice ?? r.sale_price ?? 0),
        itemimagepath: r.itemimagepath ?? null,
      })),
    );
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <div className="btn-group btn-group-sm">
          <button type="button" className={`btn ${mode === "all" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setMode("all")}>All Products</button>
          <button type="button" className={`btn ${mode === "aging" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setMode("aging")}>Aging Report</button>
        </div>
        <input className="form-control form-control-sm" style={{ maxWidth: 200 }} placeholder="Search item code/description" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="form-control form-control-sm" style={{ maxWidth: 100 }} placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input className="form-control form-control-sm" style={{ maxWidth: 100 }} placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        {mode === "all" ? (
          <div className="form-check form-check-inline mb-0">
            <input className="form-check-input" type="checkbox" id="newOnly" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
            <label className="form-check-label small" htmlFor="newOnly">New (last 30 days)</label>
          </div>
        ) : (
          <>
            <div className="form-check form-check-inline mb-0">
              <input className="form-check-input" type="checkbox" id="overstockOnly" checked={overstockOnly} onChange={(e) => setOverstockOnly(e.target.checked)} />
              <label className="form-check-label small" htmlFor="overstockOnly">In stock</label>
            </div>
            <div className="form-check form-check-inline mb-0">
              <input className="form-check-input" type="checkbox" id="slowSellingOnly" checked={slowSellingOnly} onChange={(e) => setSlowSellingOnly(e.target.checked)} />
              <label className="form-check-label small" htmlFor="slowSellingOnly">Slow-selling</label>
            </div>
          </>
        )}
        <span className="text-muted small ms-auto">{selectedItems.length} selected</span>
      </div>
      <div style={{ height: 320, width: "100%" }}>
        <POSGridClient
          fillHeight
          rowData={rows}
          columnDefs={columnDefs}
          rowSelection="multiple"
          suppressRowClickSelection
          onSelectionChanged={handleSelectionChanged}
          onGridReady={() => {}}
          loading={mode === "all" ? productLoading : agingLoading}
          getRowId={(p: { data: ProductRow }) => p.data.itemcode}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default CampaignProductPicker;
