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
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/reports";
import { InvoiceSummary } from "@/types/reports";
import { invoiceProfitColumnDefs } from "./ColumnDef";
import InvoiceProfitItemsComponent from "./InvoiceProfitItemsComponent";
import ReportHeader from "@/components/ui/reports/shared/ReportHeader";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import ReportLayout from "@/components/ui/reports/shared/ReportLayout";
import ReportSliderFilter from "@/components/ui/reports/shared/ReportSliderFilter";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

interface InvoiceTotals {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  invoiceCount: number;
}

const InvoiceProfitReportComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getInvoiceProfitSummaryList] = useLazyQuery(GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<InvoiceTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [marginRange, setMarginRange] = useState<[number, number]>([0, 100]);

  const handleOnGridReady = (params: GridReadyEvent<InvoiceSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "invoicenumber, custcompanyname, salemodename, warehousename"
        );
        if (marginRange[0] !== 0 || marginRange[1] !== 100) {
          filters.filters = [...filters.filters, { key: "profit_margin_percent", value: { filterType: "number", type: "inRange", filter: String(marginRange[0]), filterTo: String(marginRange[1]) } }];
        }
        setLoading(true);
        const result = await handleTryCatch(async () => {
          const { data } = await getInvoiceProfitSummaryList({
            variables: { storeid: parsedStoreId, outletid: parsedOutletId, ...filters },
          });
          if (data.getInvoiceProfitSummaryList) {
            const rows: InvoiceSummary[] = data.getInvoiceProfitSummaryList.data;
            params.success({
              rowData: rows,
              rowCount: data.getInvoiceProfitSummaryList.total,
            });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
            // derive totals from the totalsRow if available, otherwise from the first page
            const tr = data.getInvoiceProfitSummaryList.totalsRow;
            if (tr) {
              setTotals({
                totalRevenue: Number(tr.totalamount ?? 0),
                totalCost: Number(tr.totalcost ?? 0),
                grossProfit: Number(tr.profit ?? 0),
                invoiceCount: data.getInvoiceProfitSummaryList.total,
              });
            } else if (rows.length) {
              setTotals({
                totalRevenue: rows.reduce((s, r) => s + Number(r.totalamount ?? 0), 0),
                totalCost: rows.reduce((s, r) => s + Number(r.totalcost ?? 0), 0),
                grossProfit: rows.reduce((s, r) => s + Number(r.profit ?? 0), 0),
                invoiceCount: data.getInvoiceProfitSummaryList.total,
              });
            }
          }
          return true;
        });
        setLoading(false);
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [parsedStoreId, parsedOutletId, dispatch, getInvoiceProfitSummaryList, debouncedSearch, marginRange]
  );

  useEffect(() => {
    if (parsedStoreId && parsedOutletId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, parsedStoreId, parsedOutletId]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  const avgMargin =
    totals && totals.totalRevenue > 0
      ? (totals.grossProfit / totals.totalRevenue) * 100
      : 0;

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("invoice-profit");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Revenue", value: totals?.totalRevenue, format: "currency", accent: "#6366f1" },
    { label: "Total Cost", value: totals?.totalCost, format: "currency", accent: "#f59e0b" },
    { label: "Gross Profit", value: totals?.grossProfit, format: "currency", accent: "#10b981" },
    { label: "Avg Margin", value: avgMargin || null, format: "percent", accent: "#8b5cf6" },
  ];

  return (
    <ReportLayout>
      <ReportHeader />
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Report Summary">
          <ReportSummaryCards cards={summaryCards} loading={loading && !totals} />
        </SummaryPanelWrapper>
      )}
      <div
        className="card table-list-card"
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}
      >
        <div
          className="card-body p-0"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <CustomFilterSections gridRef={gridRef} search={search} setSearch={setSearch} />
          <ReportSliderFilter
            label="Profit Margin %"
            range
            min={0}
            max={100}
            step={5}
            marks={{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }}
            value={marginRange}
            onChange={(v) => setMarginRange(v as [number, number])}
            formatter={(v) => `${v}%`}
            color="#10b981"
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={invoiceProfitColumnDefs}
              fillHeight
              onGridReady={handleOnGridReady}
              defaultColDef={{ filter: !debouncedSearch }}
              masterDetail
              detailCellRenderer={InvoiceProfitItemsComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default InvoiceProfitReportComponent;
