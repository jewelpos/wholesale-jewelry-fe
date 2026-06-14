"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_INVOICE_AGING_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerBalanceAgingType } from "@/types/customer";
import "ag-grid-enterprise";
import { balanceAgingColumnDefs } from "./ColumnDef";
import POSGrid from "../../grid/POSGrid";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import BalanceAgingHeader from "./BalanceAgingHeader";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ReportSummaryCards, { SummaryCardDef } from "../../reports/shared/ReportSummaryCards";
import ReportMiniChart from "../../reports/shared/ReportMiniChart";
import { useParams } from "next/navigation";

const NO_FILTER: never[] = [];

type BucketPill = "all" | "current" | "31_60" | "61_90" | "91plus";

const BUCKET_PILLS: { key: BucketPill; label: string }[] = [
  { key: "all", label: "All" },
  { key: "current", label: "0-30d" },
  { key: "31_60", label: "31-60d" },
  { key: "61_90", label: "61-90d" },
  { key: "91plus", label: "91d+" },
];

const BUCKET_FILTER_FIELD: Record<string, string> = {
  current: "due_0_30",
  "31_60": "due_31_60",
  "61_90": "due_61_90",
  "91plus": "due_91_120",
};

const BalanceAgingComponent = () => {
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [getInvoiceAgingReport] = useLazyQuery(GET_INVOICE_AGING_REPORT_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [bucketPill, setBucketPill] = useState<BucketPill>("all");

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("balance-aging");

  const outletFilter = selectedOutlet
    ? [{ key: "outletid", value: { filterType: "number", type: "equals", filter: selectedOutlet } }]
    : NO_FILTER;

  const { data: statsData, loading: statsLoading } = useQuery(GET_INVOICE_AGING_REPORT_QUERY, {
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

  const agingStats = useMemo(() => {
    const rows: CustomerBalanceAgingType[] = statsData?.getInvoiceAgingReport?.data ?? [];
    let totalDue = 0, curr = 0, d31 = 0, d61 = 0, d91 = 0;
    for (const r of rows) {
      totalDue += Number(r.total_due) || 0;
      curr     += Number(r.due_0_30) || 0;
      d31      += Number(r.due_31_60) || 0;
      d61      += Number(r.due_61_90) || 0;
      d91      += (Number(r.due_91_120) || 0) + (Number(r.due_120_plus) || 0);
    }
    return { totalDue, curr, d31, d61, d91 };
  }, [statsData]);

  const summaryCards: SummaryCardDef[] = [
    { label: "Total AR", value: agingStats.totalDue, format: "currency" },
    { label: "Current (0-30d)", value: agingStats.curr, format: "currency" },
    { label: "31-60 Days", value: agingStats.d31, format: "currency" },
    { label: "61-90 Days", value: agingStats.d61, format: "currency" },
    { label: "91+ Days", value: agingStats.d91, format: "currency" },
  ];

  const selectedOutletRef = useRef(selectedOutlet);
  const bucketPillRef = useRef(bucketPill);
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { bucketPillRef.current = bucketPill; }, [bucketPill]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerBalanceAgingType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    const outlet = selectedOutletRef.current;
    if (!outlet) { params.fail(); return; }

    const filtersMain = filterVariables(params, debouncedSearchRef.current, "customerid, companyname, customername");
    const bucket = bucketPillRef.current;
    const bucketExtra =
      bucket !== "all"
        ? [{ key: BUCKET_FILTER_FIELD[bucket], value: { filterType: "number", type: "greaterThan", filter: 0 } }]
        : [];

    const result = await handleTryCatch(async () => {
      const { data } = await getInvoiceAgingReport({
        variables: {
          outletid: outlet,
          ...filtersMain,
          filters: [
            ...filtersMain.filters,
            ...bucketExtra,
            { key: "outletid", value: { filterType: "number", type: "equals", filter: outlet } },
          ],
        },
      });
      if (data.getInvoiceAgingReport) {
        params.success({ rowData: data.getInvoiceAgingReport.data, rowCount: data.getInvoiceAgingReport.total });
        if (!data.getInvoiceAgingReport.data.length) gridRef.current?.api?.showNoRowsOverlay();
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

  useEffect(() => {
    if (gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, bucketPill, debouncedSearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <BalanceAgingHeader />

      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Aging Summary">
          <ReportSummaryCards cards={summaryCards} loading={statsLoading && !statsData} singleRow />
          <ReportMiniChart
            labels={["0-30d", "31-60d", "61-90d", "91d+"]}
            values={[agingStats.curr, agingStats.d31, agingStats.d61, agingStats.d91]}
            title="AR Aging Distribution"
            type="bar"
            color="#f59e0b"
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
            {BUCKET_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setBucketPill(p.key)}
                style={{
                  fontSize: 11,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontWeight: bucketPill === p.key ? 600 : 400,
                  backgroundColor: bucketPill === p.key ? "#f59e0b" : "var(--surface-muted)",
                  color: bucketPill === p.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${bucketPill === p.key ? "#f59e0b" : "var(--border-subtle)"}`,
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
              columnDefs={balanceAgingColumnDefs}
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

export default BalanceAgingComponent;
