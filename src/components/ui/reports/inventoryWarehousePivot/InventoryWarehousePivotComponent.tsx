"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { ColDef, GridReadyEvent, ICellRendererParams, IServerSideGetRowsParams } from "ag-grid-community";
import "ag-grid-enterprise";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useParams } from "next/navigation";
import POSGrid from "@/components/ui/grid/POSGrid";
import ReportLayout from "@/components/ui/reports/shared/ReportLayout";
import ReportHeader from "@/components/ui/reports/shared/ReportHeader";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import ReportMiniChart from "@/components/ui/reports/shared/ReportMiniChart";
import { GET_INVENTORY_WAREHOUSE_PIVOT_QUERY } from "@/lib/graphql/query/products";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

// These are the fixed fields the function always returns alongside one column
// per warehouse — everything else in `columns` is a warehouse name and gets a
// dynamically generated quantity column.
const FIXED_COLUMNS = new Set(["categoryname", "itemmetal", "itemunit", "total_onhandquantity", "totalcostvalue"]);

const numberRenderer = (params: ICellRendererParams) =>
  params.value != null ? Number(params.value).toLocaleString("en-US") : "";

const InventoryWarehousePivotComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getInventoryWarehousePivot] = useLazyQuery(GET_INVENTORY_WAREHOUSE_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("inventory-warehouse-pivot");

  const handleOnGridReady = (params: GridReadyEvent) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // No pagination/filters — the function returns one full pivoted result set per
  // store. Wrapped in a server-side datasource anyway since POSGrid requires it.
  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const result = await handleTryCatch(async () => {
          const { data } = await getInventoryWarehousePivot({ variables: { storeid: parsedStoreId } });
          if (data?.getInventoryWarehousePivot) {
            const { columns: cols, rows: fetchedRows } = data.getInventoryWarehousePivot;
            setColumns(cols ?? []);
            setRows(fetchedRows ?? []);
            setLoaded(true);
            params.success({ rowData: fetchedRows ?? [], rowCount: (fetchedRows ?? []).length });
            if (!fetchedRows?.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [parsedStoreId, getInventoryWarehousePivot, dispatch]
  );

  useEffect(() => {
    if (gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady]);

  const columnDefs: ColDef[] = useMemo(() => {
    if (!columns.length) return [];
    const warehouseCols = columns.filter((c) => !FIXED_COLUMNS.has(c));
    return [
      { headerName: "Category", field: "categoryname", filter: "agTextColumnFilter", minWidth: 170, pinned: "left" },
      { headerName: "Metal", field: "itemmetal", filter: "agTextColumnFilter", minWidth: 110 },
      { headerName: "Unit", field: "itemunit", filter: "agTextColumnFilter", minWidth: 90 },
      // valueGetter (not field) — warehouse names can contain dots/spaces/parens,
      // and AG-Grid's `field` treats dots as a nested-path separator.
      ...warehouseCols.map((wh): ColDef => ({
        headerName: wh,
        colId: wh,
        valueGetter: (params) => params.data?.[wh],
        cellRenderer: numberRenderer,
        cellStyle: { textAlign: "right" },
        filter: "agNumberColumnFilter",
        minWidth: 140,
      })),
      {
        headerName: "Total Qty",
        field: "total_onhandquantity",
        cellRenderer: numberRenderer,
        cellStyle: { textAlign: "right", fontWeight: 700 },
        filter: "agNumberColumnFilter",
        minWidth: 130,
        pinned: "right",
      },
      {
        headerName: "Total Cost",
        field: "totalcostvalue",
        cellRenderer: currencyFormattedCellRenderer,
        filter: "agNumberColumnFilter",
        minWidth: 140,
        pinned: "right",
      },
    ];
  }, [columns]);

  const warehouseCount = Math.max(columns.length - FIXED_COLUMNS.size, 0);

  const summaryCards: SummaryCardDef[] = useMemo(() => {
    // Pc and Wt items are tracked in fundamentally different units (piece count
    // vs. grams) — summing them together into one "total qty" is meaningless, so
    // split by itemunit instead, same convention used on the invoice/SO forms
    // ((itemunit ?? "").toLowerCase() === "wt").
    let pcQty = 0;
    let wtQty = 0;
    rows.forEach((r) => {
      const qty = Number(r.total_onhandquantity ?? 0);
      if ((String(r.itemunit ?? "")).toLowerCase() === "wt") wtQty += qty;
      else pcQty += qty;
    });
    const totalValue = rows.reduce((s, r) => s + Number(r.totalcostvalue ?? 0), 0);
    const categoryCount = new Set(rows.map((r) => r.categoryname)).size;
    return [
      { label: "Total Qty (Pc)", value: pcQty, format: "number", accent: "#0ea5e9" },
      { label: "Total Qty (Wt)", value: wtQty, format: "number", accent: "#0ea5e9", subtext: "grams" },
      { label: "Total Inventory Value", value: totalValue, format: "currency", accent: "#10b981" },
      { label: "Categories", value: categoryCount, format: "number", accent: "#8b5cf6" },
      { label: "Warehouses", value: warehouseCount, format: "number", accent: "#f59e0b" },
    ];
  }, [rows, warehouseCount]);

  // One pinned row per itemunit (Pc, Wt) at the grid's bottom — summed per warehouse
  // column plus Total Qty/Total Cost, restricted to that unit's rows. Mirrors the
  // summary cards' Pc/Wt split: mixing pieces and grams into one row would be
  // meaningless, so each unit gets its own totals line instead of one combined row.
  const pinnedBottomRowData = useMemo(() => {
    if (!rows.length) return [];
    const warehouseCols = columns.filter((c) => !FIXED_COLUMNS.has(c));
    const units = Array.from(new Set(rows.map((r) => String(r.itemunit ?? "Pc")))).sort();
    return units.map((unit) => {
      const unitRows = rows.filter((r) => String(r.itemunit ?? "Pc") === unit);
      const pinnedRow: Record<string, unknown> = {
        categoryname: "TOTAL",
        itemmetal: "",
        itemunit: unit,
        total_onhandquantity: unitRows.reduce((s, r) => s + Number(r.total_onhandquantity ?? 0), 0),
        totalcostvalue: unitRows.reduce((s, r) => s + Number(r.totalcostvalue ?? 0), 0),
      };
      warehouseCols.forEach((wh) => {
        pinnedRow[wh] = unitRows.reduce((s, r) => s + Number(r[wh] ?? 0), 0);
      });
      return pinnedRow;
    });
  }, [rows, columns]);

  // One bar per category — sums totalcostvalue across that category's metal/unit
  // breakdown rows, since the grid shows one row per (category, metal, unit).
  const { chartLabels, chartValues } = useMemo(() => {
    const byCategory = new Map<string, number>();
    rows.forEach((r) => {
      const cat = String(r.categoryname ?? "Uncategorized");
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(r.totalcostvalue ?? 0));
    });
    const sorted = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
    return { chartLabels: sorted.map(([label]) => label), chartValues: sorted.map(([, value]) => value) };
  }, [rows]);

  return (
    <ReportLayout>
      <ReportHeader />
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Report Summary">
          <ReportSummaryCards cards={summaryCards} loading={!loaded} singleRow />
        </SummaryPanelWrapper>
      )}
      {loaded && (
        <ReportMiniChart
          labels={chartLabels}
          values={chartValues}
          title="Inventory Value by Category"
          subtitle="Total on-hand cost value per category, across all warehouses"
          format="currency"
          color="#10b981"
          type="bar"
        />
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              gridKey="report-inventory-warehouse-pivot"
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              pinnedBottomRowData={pinnedBottomRowData}
              getRowStyle={(params) =>
                params.node.rowPinned ? { fontWeight: 700, background: "var(--surface-hover, #f8fafc)" } : undefined
              }
              fillHeight
            />
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default InventoryWarehousePivotComponent;
