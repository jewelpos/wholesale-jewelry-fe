"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_PAYMENT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerPaymentListType } from "@/types/customer";
import "ag-grid-enterprise";
import { appliedPaymentsColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import AppliedPaymentHeader from "./AppliedPaymentHeader";
import PaymentModal from "./PaymentModal";
import CustomerAppliedPaymentComponent from "./CustomerAppliedPaymentComponent";
import CustomerPaymentActions from "./CustomerPaymentActions";
import { paymentModalTypes } from "@/lib/config/constants";
import SelectCustomer from "@/components/forms/SelectCustomer";
import PaymentPrintModal from "./PaymentPrintModal";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ReportSummaryCards, { SummaryCardDef } from "../../reports/shared/ReportSummaryCards";
import ReportMiniChart from "../../reports/shared/ReportMiniChart";
import dayjs from "dayjs";

const NO_FILTER: never[] = [];

// ── Date period pills ──────────────────────────────────────────────────────────
type DatePill = "today" | "week" | "month" | "year";

const DATE_PILLS: { key: DatePill; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

const DATE_PILL_LABEL: Record<DatePill, string> = {
  today: "Today",
  week:  "This Week",
  month: "This Month",
  year:  "This Year",
};

function getDateRange(pill: DatePill): { startDate: string; endDate: string } {
  const today = dayjs();
  if (pill === "today")
    return { startDate: today.format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
  if (pill === "week")
    return { startDate: today.startOf("week").format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
  if (pill === "month")
    return { startDate: today.startOf("month").format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
  return { startDate: today.startOf("year").format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
}

// ── Payment mode pills ─────────────────────────────────────────────────────────
type ModePill = "all" | "Check" | "Cash" | "Charge" | "CashChk" | "MnyOrd" | "CrdInv" | "WireTrn" | "ReDep" | "NSF" | "Void" | "WriteOff";

const MODE_PILLS: { key: ModePill; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Check", label: "Check" },
  { key: "Cash", label: "Cash" },
  { key: "Charge", label: "Charge" },
  { key: "CashChk", label: "CashChk" },
  { key: "MnyOrd", label: "MnyOrd" },
  { key: "CrdInv", label: "CrdInv" },
  { key: "WireTrn", label: "WireTrn" },
  { key: "ReDep", label: "ReDep" },
  { key: "NSF", label: "NSF" },
  { key: "Void", label: "Void" },
  { key: "WriteOff", label: "WriteOff" },
];

const AppliedPaymentsComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [getCustomerPaymentList] = useLazyQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const [paymentModal, setPaymentModal] = useState<string>("");
  const [showPrint, setShowPrint] = useState(false);
  const [printPayments, setPrintPayments] = useState<CustomerPaymentListType[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [printCustomerId, setPrintCustomerId] = useState<number | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [voidRow, setVoidRow] = useState<CustomerPaymentListType | null>(null);
  const [modePill, setModePill] = useState<ModePill>("all");
  const [datePill, setDatePill] = useState<DatePill>("week");

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("applied-payments");

  // Compute current date range from selected pill
  const dateRange = useMemo(() => getDateRange(datePill), [datePill]);

  const dateFilter = useMemo(() => ([
    {
      key: "paymentdate",
      value: {
        filterType: "date",
        type: "inRange",
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
      },
    },
  ]), [dateRange]);

  const outletFilter = useMemo(() => selectedOutlet
    ? [
        { key: "outletid", value: { filterType: "number", type: "equals", filter: selectedOutlet } },
        ...dateFilter,
      ]
    : NO_FILTER,
  [selectedOutlet, dateFilter]);

  const { data: statsData, loading: statsLoading } = useQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY, {
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

  const paymentStats = useMemo(() => {
    const rows: CustomerPaymentListType[] = statsData?.getCustomerPaymentList?.data ?? [];
    let totalCollected = 0, voidCount = 0, voidValue = 0, validCount = 0;
    // Group by day for today/week/month, by month for year
    const useMonthly = datePill === "year";
    const bucketMap: Record<string, number> = {};

    for (const r of rows) {
      const amt = Number(r.amountpaid) || 0;
      if (r.voidpayment) {
        voidCount++;
        voidValue += amt;
      } else {
        totalCollected += amt;
        validCount++;
        const bucket = r.paymentdate
          ? useMonthly
            ? dayjs(r.paymentdate).format("MMM YYYY")
            : dayjs(r.paymentdate).format("DD MMM")
          : "Unknown";
        bucketMap[bucket] = (bucketMap[bucket] || 0) + amt;
      }
    }

    const sortedKeys = Object.keys(bucketMap).sort((a, b) => {
      const fmt = useMonthly ? "MMM YYYY" : "DD MMM";
      return dayjs(a, fmt).valueOf() - dayjs(b, fmt).valueOf();
    });
    const chartLabels = sortedKeys.slice(-31);
    const chartValues = chartLabels.map((k) => bucketMap[k] || 0);

    return {
      totalCollected,
      voidCount,
      voidValue,
      avgPayment: validCount > 0 ? totalCollected / validCount : 0,
      chartLabels,
      chartValues,
    };
  }, [statsData, datePill]);

  const summaryCards: SummaryCardDef[] = [
    { label: `Collected (${DATE_PILL_LABEL[datePill]})`, value: paymentStats.totalCollected, format: "currency" },
    { label: "# Void Payments", value: paymentStats.voidCount, format: "number" },
    { label: "Void Value", value: paymentStats.voidValue, format: "currency" },
    { label: "Avg Payment", value: paymentStats.avgPayment, format: "currency" },
  ];

  const handleVoidClick = (row: CustomerPaymentListType) => {
    setVoidRow(row);
    setPaymentModalAndSyncUrl(paymentModalTypes.add_void_payment);
  };

  const setPaymentModalAndSyncUrl = (value: string) => {
    if (!value) {
      setPaymentModal("");
      router.replace(pathname);
      if (voidRow) {
        setVoidRow(null);
        gridRef.current?.api?.refreshServerSide({ purge: true });
      }
      return;
    }
    setPaymentModal(value);
    router.replace(`${pathname}?modal=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    const modal = searchParams.get("modal");
    if (modal) setPaymentModal(modal);
  }, [searchParams]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerPaymentListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const selectedOutletRef = useRef(selectedOutlet);
  const modePillRef = useRef(modePill);
  const datePillRef = useRef(datePill);
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { modePillRef.current = modePill; }, [modePill]);
  useEffect(() => { datePillRef.current = datePill; }, [datePill]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    const outlet = selectedOutletRef.current;
    if (!outlet) { params.fail(); return; }

    const filtersMain = filterVariables(params, debouncedSearchRef.current, "transactionno, custcompanyname");
    const mode = modePillRef.current;
    const modeExtra =
      mode !== "all"
        ? [{ key: "paymode", value: { filterType: "text", type: "equals", filter: mode } }]
        : [];

    const { startDate, endDate } = getDateRange(datePillRef.current);
    const dateExtra = [
      { key: "paymentdate", value: { filterType: "date", type: "inRange", dateFrom: startDate, dateTo: endDate } },
    ];

    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerPaymentList({
        variables: {
          outletid: outlet,
          ...filtersMain,
          filters: [
            ...filtersMain.filters,
            ...modeExtra,
            ...dateExtra,
            { key: "outletid", value: { filterType: "number", type: "equals", filter: outlet } },
          ],
        },
      });
      if (data.getCustomerPaymentList) {
        params.success({ rowData: data.getCustomerPaymentList.data, rowCount: data.getCustomerPaymentList.total });
        if (!data.getCustomerPaymentList.data.length) gridRef.current?.api?.showNoRowsOverlay();
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

  const columnDefs = useMemo(() => {
    return [
      ...appliedPaymentsColumnDefs,
      {
        headerName: "Actions",
        field: "transactionno",
        cellRenderer: (params: ICellRendererParams<CustomerPaymentListType>) =>
          params.data ? <CustomerPaymentActions data={params.data} onVoid={handleVoidClick} /> : null,
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 80,
        minWidth: 52,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      } as ColDef<CustomerPaymentListType>,
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleVoidClick]);

  useEffect(() => {
    if (gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, modePill, datePill, debouncedSearch]);

  const fetchAndPrint = async (customerid: number) => {
    setPrintLoading(true);
    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerPaymentList({
        variables: {
          outletid: selectedOutlet ?? parsedOutletId,
          page: 1,
          perpage: 10000,
          filters: [{ key: "customerid", value: { filterType: "number", type: "equals", filter: customerid } }],
          sortModel: [],
          rowGroupCols: [],
          groupKeys: [],
        },
      });
      setPrintPayments(data?.getCustomerPaymentList?.data ?? []);
      return true;
    });
    setPrintLoading(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setShowCustomerPicker(false);
    setShowPrint(true);
  };

  const handlePrint = () => {
    setPrintCustomerId(null);
    setShowCustomerPicker(true);
  };

  const handleEmail = () => {
    dispatch(showNotification({ message: "Email payment statement — coming soon.", type: NOTIFICATION_TYPES.INFO }));
  };

  const handleExport = () => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `payments-${Date.now()}.csv` });
  };

  const pillStyle = (active: boolean, color = "#10b981") => ({
    fontSize: 11,
    padding: "3px 12px",
    borderRadius: 20,
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? color : "var(--surface-muted)",
    color: active ? "#fff" : "var(--text-secondary)",
    border: `1px solid ${active ? color : "var(--border-subtle)"}`,
    cursor: "pointer",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <AppliedPaymentHeader
        setPaymentModal={setPaymentModalAndSyncUrl}
        onPrint={handlePrint}
        onEmail={handleEmail}
        onExport={handleExport}
      />

      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Payment Summary">
          <ReportSummaryCards cards={summaryCards} loading={statsLoading && !statsData} />
          <ReportMiniChart
            labels={paymentStats.chartLabels}
            values={paymentStats.chartValues}
            title={`Collections — ${DATE_PILL_LABEL[datePill]}`}
            type="area"
            color="#10b981"
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

          {/* Date period pills */}
          <div className="d-flex gap-1 flex-wrap mb-1">
            {DATE_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDatePill(p.key)}
                style={pillStyle(datePill === p.key, "#3b82f6")}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Payment mode pills */}
          <div className="d-flex gap-1 flex-wrap mb-2">
            {MODE_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setModePill(p.key)}
                style={pillStyle(modePill === p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
              masterDetail
              detailCellRenderer={CustomerAppliedPaymentComponent}
              detailRowAutoHeight
              getRowStyle={(params) =>
                params.data?.voidpayment
                  ? { background: "#fef2f2", color: "#9ca3af" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {paymentModal && (
        <PaymentModal
          paymentModal={paymentModal}
          setPaymentModal={setPaymentModalAndSyncUrl}
          voidRow={voidRow}
        />
      )}

      {showCustomerPicker && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Select Customer to Print</h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowCustomerPicker(false)}
                />
              </div>
              <div className="modal-body pt-2 pb-3 px-3">
                <label className="form-label mb-1" style={{ fontSize: 13, fontWeight: 600 }}>
                  Customer
                </label>
                <SelectCustomer
                  className=""
                  storeId={parsedStoreId}
                  trigger={() => {}}
                  value={printCustomerId}
                  onChange={(val: number) => setPrintCustomerId(val || null)}
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCustomerPicker(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!printCustomerId || printLoading}
                  onClick={() => printCustomerId && fetchAndPrint(printCustomerId)}
                >
                  {printLoading ? "Loading…" : "Print"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrint && printCustomerId && (
        <PaymentPrintModal
          customerid={printCustomerId}
          payments={printPayments}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
};

export default AppliedPaymentsComponent;
