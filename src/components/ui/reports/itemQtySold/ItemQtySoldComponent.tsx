"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { filterVariables } from "@/lib/utils/gridFilters";
import { ItemQtySoldSummary } from "@/types/reports";
import { itemQtySoldColumnDefs } from "./ColumnDef";
import { GET_ITEM_QTY_SOLD_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { useParams } from "next/navigation";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import ReportMiniChart from "@/components/ui/reports/shared/ReportMiniChart";
import ReportLayout from "@/components/ui/reports/shared/ReportLayout";
import ReportHeader from "@/components/ui/reports/shared/ReportHeader";
import ReportSliderFilter from "@/components/ui/reports/shared/ReportSliderFilter";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

const YEAR_MIN = 2018;
const YEAR_MAX = new Date().getFullYear();
const YEAR_MARKS = Object.fromEntries(
  Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => [YEAR_MIN + i, String(YEAR_MIN + i)])
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_KEYS: (keyof ItemQtySoldSummary)[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const ItemQtySoldComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getMonthlyItemQtySoldPivot] = useLazyQuery(GET_ITEM_QTY_SOLD_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<ItemQtySoldSummary> | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MAX, YEAR_MAX]);

  const handleOnGridReady = (params: GridReadyEvent<ItemQtySoldSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "itemcode, itemdescription, supplier, categoryname, warehousename");
        if (yearRange[0] !== YEAR_MIN || yearRange[1] !== YEAR_MAX) {
          filters.filters = [...filters.filters, { key: "sales_year", value: { filterType: "number", type: "inRange", filter: String(yearRange[0]), filterTo: String(yearRange[1]) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyItemQtySoldPivot({
            variables: { storeid: parsedStoreId, outletid: selectedOutlet ?? parsedOutletId, warehouseid: selectedWarehouse, ...filters },
          });
          if (data.getMonthlyItemQtySoldPivot) {
            const { data: rows, total, totalsRow } = data.getMonthlyItemQtySoldPivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<ItemQtySoldSummary> = {
                  itemcode: "Page Total",
                  total_year_qty: totalsRow.total_year_qty,
                  jan: totalsRow.jan, feb: totalsRow.feb, mar: totalsRow.mar,
                  apr: totalsRow.apr, may: totalsRow.may, jun: totalsRow.jun,
                  jul: totalsRow.jul, aug: totalsRow.aug, sep: totalsRow.sep,
                  oct: totalsRow.oct, nov: totalsRow.nov, dec: totalsRow.dec,
                };
                gridRef.current?.api?.setGridOption("pinnedBottomRowData", [pinnedRow]);
              }
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [parsedStoreId, parsedOutletId, selectedOutlet, selectedWarehouse, dispatch, getMonthlyItemQtySoldPivot, debouncedSearch, yearRange]
  );

  useEffect(() => {
    if (gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady]);

  const chartValues = totals
    ? MONTH_KEYS.map((k) => Number(totals[k] ?? 0))
    : [];

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("item-qty-sold");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Qty Sold", value: totals?.total_year_qty, format: "number", accent: "#6366f1" },
  ];

  return (
    <ReportLayout>
      <ReportHeader
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
      />
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Report Summary">
          <ReportSummaryCards cards={summaryCards} loading={!totals && !!selectedOutlet} />
        </SummaryPanelWrapper>
      )}
      {totals && (
        <ReportMiniChart
          labels={MONTHS}
          values={chartValues}
          title="Item Quantity Sold by Month"
          subtitle="Total units sold across all items by month"
          color="#6366f1"
          type="area"
        />
      )}
      <div
        className="card table-list-card"
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}
      >
        <div
          className="card-body p-0"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
          />
          <ReportSliderFilter
            label="Year Range"
            range
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            marks={YEAR_MARKS}
            value={yearRange}
            onChange={(v) => setYearRange(v as [number, number])}
            color="#6366f1"
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={itemQtySoldColumnDefs}
              fillHeight
              onGridReady={handleOnGridReady}
                            getRowStyle={(params) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default ItemQtySoldComponent;
