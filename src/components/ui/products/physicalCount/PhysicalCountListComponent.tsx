"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { useParams } from "next/navigation";
import "ag-grid-enterprise";
import POSGrid from "@/components/ui/grid/POSGrid";
import { GET_PHYSICAL_COUNT_BATCH_LIST_QUERY } from "@/lib/graphql/query/physicalcount";
import { physicalCountColumnDefs } from "./ColumnDef";
import PhysicalCountListHeader from "./PhysicalCountListHeader";
import PhysicalCountActions from "./PhysicalCountActions";

const STATUS_OPTIONS = ["", "OPEN", "REVIEW", "APPROVED", "POSTED", "CANCELLED"];

const PhysicalCountListComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = Number(outletIdParam);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [getBatchList] = useLazyQuery(GET_PHYSICAL_COUNT_BATCH_LIST_QUERY);

  const refreshGrid = useCallback(() => {
    gridRef.current?.api?.refreshServerSide({ purge: true });
  }, []);

  const colDefs = useMemo(() => [
    ...physicalCountColumnDefs.filter(c => c.field !== "actions"),
    {
      headerName: "Actions",
      field: "actions",
      width: 110,
      pinned: "right" as const,
      filter: false,
      sortable: false,
      cellRenderer: (params: { data: { batchid: number; batchnumber: string; countstatus: string } }) => (
        <PhysicalCountActions data={params.data} onRefresh={refreshGrid} />
      ),
    },
  ], [refreshGrid]);

  const datasource = useMemo(() => ({
    getRows: async (params: IServerSideGetRowsParams) => {
      const { startRow = 0, endRow = 50 } = params.request;
      const page = Math.floor(startRow / (endRow - startRow)) + 1;
      const perpage = endRow - startRow;

      const filters: { key: string; value: unknown }[] = [];
      if (search) filters.push({ key: "batchnumber", value: { filterType: "text", type: "contains", filter: search } });
      if (statusFilter) filters.push({ key: "countstatus", value: { filterType: "text", type: "equals", filter: statusFilter } });

      const res = await getBatchList({
        variables: {
          storeid: parsedStoreId,
          outletid: parsedOutletId,
          page,
          perpage,
          filters,
          sortModel: params.request.sortModel ?? [],
          rowGroupCols: [],
          groupKeys: [],
        },
      });
      const result = res.data?.getPhysicalCountBatchList;
      params.success({ rowData: result?.data ?? [], rowCount: result?.total ?? 0 });
    },
  }), [getBatchList, parsedStoreId, parsedOutletId, search, statusFilter]);

  const handleGridReady = useCallback((e: GridReadyEvent) => {
    e.api.setGridOption("serverSideDatasource", datasource);
    setGridReady(true);
  }, [datasource]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)" }}>
      <PhysicalCountListHeader />

      {/* Filter bar */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          style={{ width: 220 }}
          placeholder="Search batch #…"
          value={search}
          onChange={e => { setSearch(e.target.value); refreshGrid(); }}
        />
        <select
          className="form-select form-select-sm"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); refreshGrid(); }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {gridReady && null}
        <POSGrid
          ref={gridRef}
          columnDefs={colDefs}
          onGridReady={handleGridReady}
          rowModelType="serverSide"
          cacheBlockSize={50}
          rowHeight={28}
          headerHeight={32}
        />
      </div>
    </div>
  );
};

export default PhysicalCountListComponent;
