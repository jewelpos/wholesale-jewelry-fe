"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_BALANCE_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerBalanceReportType } from "@/types/customer";
import "ag-grid-enterprise";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "../../grid/POSGrid";
import { filterVariables } from "@/lib/utils/gridFilters";
import { balanceReportColumnDefs } from "./ColumnDef";
import BalanceHeader from "./BalanceHeader";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ReportSummaryCards, { SummaryCardDef } from "../../reports/shared/ReportSummaryCards";
import ReportMiniChart from "../../reports/shared/ReportMiniChart";
import { useParams } from "next/navigation";

const NO_FILTER: never[] = [];

type BalancePill = "all" | "with_balance" | "no_balance";

const BALANCE_PILLS: { key: BalancePill; label: string }[] = [
  { key: "all", label: "All" },
  { key: "with_balance", label: "With Balance" },
  { key: "no_balance", label: "No Balance" },
];

const BalanceComponent = () => {
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [getCustomerBalanceReport] = useLazyQuery(GET_CUSTOMER_BALANCE_REPORT_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [balancePill, setBalancePill] = useState<BalancePill>("all");

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("customer-balance");

  const outletFilter = selectedOutlet
    ? [{ key: "outletid", value: { filterType: "number", type: "equals", filter: selectedOutlet } }]
    : NO_FILTER;

  const { data: statsData, loading: statsLoading } = useQuery(GET_CUSTOMER_BALANCE_REPORT_QUERY, {
    variables: {
      outletid: selectedOutlet ?? 0,
      page: 1,
      perpage: 2000,
      filters: outletFilter,
      sortModel: NO_FILTER,
      rowGroupCols: NO_FILTER,
      groupKeys: NO_FILTER,
    },
    skip: !selectedOutlet,
    fetchPolicy: "cache-and-network",
  });

  const balanceStats = useMemo(() => {
    const rows: CustomerBalanceReportType[] = statsData?.getCustomerBalanceReport?.data ?? [];
    let totalAR = 0, totalSales = 0, withBalance = 0;
    for (const r of rows) {
      const due = Number(r.total_due) || 0;
      totalAR += due;
      totalSales += Number(r.total_sale) || 0;
      if (due > 0) withBalance++;
    }
    const avgBalance = withBalance > 0 ? totalAR / withBalance : 0;
    return { totalAR, totalSales, withBalance, avgBalance, total: rows.length };
  }, [statsData]);

  const summaryCards: SummaryCardDef[] = [
    { label: "Total AR", value: balanceStats.totalAR, format: "currency" },
    { label: "Customers w/ Balance", value: balanceStats.withBalance, format: "number" },
    { label: "Total Sales", value: balanceStats.totalSales, format: "currency" },
    { label: "Avg Balance (owed)", value: balanceStats.avgBalance, format: "currency" },
  ];

  // Refs so getRows always reads the latest values without needing datasource recreation
  const selectedOutletRef = useRef(selectedOutlet);
  const balancePillRef = useRef(balancePill);
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { balancePillRef.current = balancePill; }, [balancePill]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerBalanceReportType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // Stable datasource — never recreated; reads from refs inside getRows
  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    const outlet = selectedOutletRef.current;
    if (!outlet) { params.fail(); return; }

    const filtersMain = filterVariables(params, debouncedSearchRef.current, "customerid, companyname, customername");
    const pill = balancePillRef.current;
    const pillExtra =
      pill === "with_balance"
        ? [{ key: "total_due", value: { filterType: "number", type: "greaterThan", filter: 0 } }]
        : pill === "no_balance"
        ? [{ key: "total_due", value: { filterType: "number", type: "equals", filter: 0 } }]
        : [];

    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerBalanceReport({
        variables: {
          outletid: outlet,
          ...filtersMain,
          filters: [
            ...filtersMain.filters,
            ...pillExtra,
            { key: "outletid", value: { filterType: "number", type: "equals", filter: outlet } },
          ],
        },
      });
      if (data.getCustomerBalanceReport) {
        params.success({ rowData: data.getCustomerBalanceReport.data, rowCount: data.getCustomerBalanceReport.total });
        if (!data.getCustomerBalanceReport.data.length) gridRef.current?.api?.showNoRowsOverlay();
        else gridRef.current?.api?.hideOverlay();
      }
      return true;
    });
    if (result.error) {
      gridRef.current?.api?.showNoRowsOverlay();
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      params.fail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datasource = useRef({ getRows }).current;

  // Set datasource once when grid becomes ready
  useEffect(() => {
    if (gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource]);

  // Force reload whenever outlet, pill, or search changes (not on initial mount)
  useEffect(() => {
    if (!gridReady) return;
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, balancePill, debouncedSearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <BalanceHeader />

      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Balance Summary">
          <ReportSummaryCards cards={summaryCards} loading={statsLoading && !statsData} />
          <ReportMiniChart
            labels={["Total AR", "Total Sales"]}
            values={[balanceStats.totalAR, balanceStats.totalSales]}
            title="AR vs Sales"
            type="bar"
            color="#6366f1"
            height={120}
            loading={statsLoading && !statsData}
            defaultCollapsed
          />
        </SummaryPanelWrapper>
      )}

      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={isAdmin ? setSelectedOutlet : undefined}
          />

          <div className="d-flex gap-1 flex-wrap mb-2">
            {BALANCE_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setBalancePill(p.key)}
                style={{
                  fontSize: 11,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontWeight: balancePill === p.key ? 600 : 400,
                  backgroundColor: balancePill === p.key ? "#6366f1" : "var(--surface-muted)",
                  color: balancePill === p.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${balancePill === p.key ? "#6366f1" : "var(--border-subtle)"}`,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={balanceReportColumnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
              defaultColDef={{ filter: !debouncedSearch }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceComponent;
