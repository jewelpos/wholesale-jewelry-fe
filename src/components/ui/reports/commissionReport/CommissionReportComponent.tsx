"use client";

import React, { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import "ag-grid-enterprise";
import { DollarSign, TrendingUp, Users, CreditCard, AlertCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { formatCurrency } from "@/lib/utils/currencyFormat";
import {
  GET_EMPLOYEE_COMMISSION_REPORT_QUERY,
  GET_COMMISSION_PAYOUT_HISTORY_QUERY,
} from "@/lib/graphql/query/reports";
import { RECORD_COMMISSION_PAYOUT_MUTATION } from "@/lib/graphql/mutations/commission";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";

const { RangePicker } = DatePicker;

// ─── KPI Card ────────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) => (
  <div
    className="card mb-0"
    style={{ border: "1px solid #e2e8f0", borderTop: `3px solid ${accent}` }}
  >
    <div className="card-body py-3 px-3">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{value}</div>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={accent} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  </div>
);

// ─── Pay Out Modal ───────────────────────────────────────────
const PayoutModal = ({
  isOpen,
  line,
  fromdate,
  todate,
  storeid,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  line: any;
  fromdate: string;
  todate: string;
  storeid: number;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [recordPayout] = useMutation(RECORD_COMMISSION_PAYOUT_MUTATION);

  // Pre-fill amount from balance_due when line changes
  React.useEffect(() => {
    if (line) setAmount(String(Number(line.balance_due ?? 0).toFixed(2)));
  }, [line]);

  if (!isOpen || !line) return null;

  const handleSave = async () => {
    setSaving(true);
    const result = await handleTryCatch(async () => {
      await recordPayout({
        variables: {
          input: {
            storeid,
            userid: line.userid,
            period_start: fromdate,
            period_end: todate,
            commission_amount: Number(amount),
            notes: notes || null,
          },
        },
      });
      dispatch(showNotification({ message: "Payout recorded.", type: NOTIFICATION_TYPES.SUCCESS }));
      onSuccess();
      onClose();
      return true;
    });
    setSaving(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: 420,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Record Payout — {line.username}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Period: {fromdate} to {todate}
          </div>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Total Commission</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(Number(line.commission_amount ?? 0))}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Already Paid</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>{formatCurrency(Number(line.already_paid ?? 0))}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Balance Due</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{formatCurrency(Number(line.balance_due ?? 0))}</span>
          </div>
        </div>

        <div className="mb-3">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>
            Payout Amount ($)
          </label>
          <input
            type="number"
            className="form-control"
            value={amount}
            min={0}
            step={0.01}
            onChange={(e) => setAmount(e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>

        <div className="mb-4">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>
            Notes (optional)
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Paid via bank transfer"
            style={{ fontSize: 13, resize: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={handleSave}
            disabled={saving || !amount || Number(amount) <= 0}
          >
            {saving ? "Recording..." : "Record Payout"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CommissionReportComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const historyGridRef = useRef<AgGridReact>(null);

  const [activeTab, setActiveTab] = useState<"report" | "history">("report");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [reportLines, setReportLines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; line: any }>({
    open: false,
    line: null,
  });

  const { data: usersData } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const { data: historyData, refetch: refetchHistory } = useQuery(
    GET_COMMISSION_PAYOUT_HISTORY_QUERY,
    {
      variables: { storeid: parsedStoreId, userid: filterUserId ?? undefined },
      skip: !parsedStoreId,
    }
  );

  const [getReport, { loading }] = useLazyQuery(GET_EMPLOYEE_COMMISSION_REPORT_QUERY, {
    fetchPolicy: "network-only",
  });

  const userOptions = useMemo(() => {
    if (!usersData?.getUserListUnderStore) return [];
    const seen = new Set<number>();
    return usersData.getUserListUnderStore
      .filter((u: any) => u.isenabled)
      .reduce((acc: { value: number; label: string }[], u: any) => {
        if (!seen.has(u.userid)) {
          seen.add(u.userid);
          acc.push({ value: u.userid, label: u.userfullname || u.login });
        }
        return acc;
      }, []);
  }, [usersData]);

  const handleSearch = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      dispatch(showNotification({ message: "Select a date range", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const fromdate = dateRange[0].format("YYYY-MM-DD");
    const todate = dateRange[1].format("YYYY-MM-DD");
    const result = await handleTryCatch(async () => {
      const { data } = await getReport({
        variables: {
          storeid: parsedStoreId,
          fromdate,
          todate,
          userid: filterUserId ?? undefined,
        },
      });
      const report = data?.getEmployeeCommissionReport;
      setReportLines(report?.lines ?? []);
      setSummary(report ?? null);
      setHasLoaded(true);
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const fromdate = dateRange[0]?.format("YYYY-MM-DD") ?? "";
  const todate = dateRange[1]?.format("YYYY-MM-DD") ?? "";

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Employee",
        field: "username",
        minWidth: 140,
        flex: 1.5,
        cellStyle: { fontWeight: 600 },
      },
      {
        headerName: "Basis",
        field: "commission_basis",
        width: 80,
        cellRenderer: ({ value }: { value: string }) => (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 10,
              background: value === "profit" ? "#dcfce7" : "#eff6ff",
              color: value === "profit" ? "#166534" : "#1e40af",
              fontWeight: 600,
            }}
          >
            {value === "profit" ? "Profit" : "Net"}
          </span>
        ),
      },
      {
        headerName: "Rate %",
        field: "applied_rate",
        width: 80,
        type: "numericColumn",
        valueFormatter: ({ value }) => (value != null ? `${Number(value).toFixed(2)}%` : "—"),
      },
      {
        headerName: "Invoices",
        field: "invoice_count",
        width: 90,
        type: "numericColumn",
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "Net Sales",
        field: "total_net_sales",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        headerName: "Cost",
        field: "total_cost",
        minWidth: 100,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        headerName: "Gross Profit",
        field: "gross_profit",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        headerName: "Commission",
        field: "commission_amount",
        minWidth: 115,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { fontWeight: 700, color: "#8b5cf6" },
      },
      {
        headerName: "True Profit",
        field: "true_profit_after_commission",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: ({ value }: any) => ({ color: Number(value) >= 0 ? "#10b981" : "#ef4444" }),
        headerTooltip: "Gross Profit minus Commission",
      },
      {
        headerName: "Paid",
        field: "already_paid",
        minWidth: 100,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { color: "#10b981" },
      },
      {
        headerName: "Balance Due",
        field: "balance_due",
        minWidth: 115,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: ({ value }: any) => ({
          fontWeight: 700,
          color: Number(value) > 0 ? "#ef4444" : "#10b981",
        }),
      },
      {
        headerName: "Actions",
        width: 100,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return null;
          const canPay = Number(params.data.balance_due) > 0;
          return (
            <button
              type="button"
              className="btn btn-sm"
              disabled={!canPay}
              onClick={() => setPayoutModal({ open: true, line: params.data })}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                background: canPay ? "#10b98118" : "#f1f5f9",
                color: canPay ? "#10b981" : "#94a3b8",
                border: `1px solid ${canPay ? "#10b981" : "#e2e8f0"}`,
                borderRadius: 6,
              }}
            >
              Pay Out
            </button>
          );
        },
      },
    ] as ColDef[],
    []
  );

  const historyColumnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Employee", field: "username", flex: 1, minWidth: 130, cellStyle: { fontWeight: 600 } },
      { headerName: "Period Start", field: "period_start", width: 120 },
      { headerName: "Period End", field: "period_end", width: 120 },
      {
        headerName: "Amount Paid",
        field: "commission_amount",
        width: 130,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { fontWeight: 700, color: "#10b981" },
      },
      { headerName: "Paid By", field: "paid_by_username", width: 130 },
      { headerName: "Paid At", field: "paid_at", flex: 1, minWidth: 160, valueFormatter: ({ value }) => value ? dayjs(value).format("MMM D, YYYY h:mm A") : "" },
      { headerName: "Notes", field: "notes", flex: 2, minWidth: 160 },
    ] as ColDef[],
    []
  );

  const historyRows = useMemo(
    () => historyData?.getCommissionPayoutHistory ?? [],
    [historyData]
  );

  const pinnedBottomRow = useMemo(() => {
    if (!summary || !reportLines.length) return [];
    return [
      {
        username: "TOTAL",
        total_net_sales: summary.summary_net_sales,
        gross_profit: summary.summary_gross_profit,
        commission_amount: summary.summary_commission,
        true_profit_after_commission: summary.summary_true_profit,
        already_paid: summary.summary_paid,
        balance_due:
          Number(summary.summary_commission ?? 0) - Number(summary.summary_paid ?? 0),
      },
    ];
  }, [summary, reportLines]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Commission Report</h4>
          <h6>Sales rep commission earned per period with payout tracking</h6>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
        {(["report", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? "#8b5cf6" : "#64748b",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2.5px solid #8b5cf6" : "2.5px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab === "report" ? "Commission Report" : "Payout History"}
          </button>
        ))}
      </div>

      {activeTab === "report" ? (
        <>
          {/* Filter bar */}
          <div className="card mb-3" style={{ border: "1px solid #e2e8f0" }}>
            <div className="card-body py-3">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                    Date Range
                  </div>
                  <RangePicker
                    value={dateRange}
                    onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
                    format="YYYY-MM-DD"
                    size="middle"
                    style={{ fontSize: 13 }}
                    presets={[
                      { label: "This Month", value: [dayjs().startOf("month"), dayjs()] },
                      { label: "Last Month", value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
                      { label: "This Year", value: [dayjs().startOf("year"), dayjs()] },
                    ]}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                    Employee (optional)
                  </div>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: 180, fontSize: 13 }}
                    value={filterUserId ?? ""}
                    onChange={(e) =>
                      setFilterUserId(e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">All Employees</option>
                    {userOptions.map((u: any) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSearch}
                  disabled={loading}
                  style={{ alignSelf: "flex-end" }}
                >
                  {loading ? "Loading..." : "Run Report"}
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {hasLoaded && summary && (
            <div className="row g-3 mb-3">
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="Net Sales"
                  value={formatCurrency(Number(summary.summary_net_sales ?? 0))}
                  icon={DollarSign}
                  accent="#376fd0"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="Gross Profit"
                  value={formatCurrency(Number(summary.summary_gross_profit ?? 0))}
                  icon={TrendingUp}
                  accent="#10b981"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="Commission"
                  value={formatCurrency(Number(summary.summary_commission ?? 0))}
                  icon={Users}
                  accent="#8b5cf6"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="True Profit"
                  value={formatCurrency(Number(summary.summary_true_profit ?? 0))}
                  icon={TrendingUp}
                  accent="#f59e0b"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="Already Paid"
                  value={formatCurrency(Number(summary.summary_paid ?? 0))}
                  icon={CreditCard}
                  accent="#10b981"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-6">
                <KpiCard
                  label="Balance Due"
                  value={formatCurrency(
                    Number(summary.summary_commission ?? 0) - Number(summary.summary_paid ?? 0)
                  )}
                  icon={AlertCircle}
                  accent="#ef4444"
                />
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="card" style={{ border: "1px solid #e2e8f0" }}>
            <div className="card-body p-2">
              {!hasLoaded && !loading ? (
                <div
                  className="p-4 text-center"
                  style={{ color: "#94a3b8", fontSize: 13 }}
                >
                  Select a date range and click Run Report.
                </div>
              ) : (
                <div className="ag-theme-alpine" style={{ height: 400 }}>
                  <AgGridReact
                    ref={gridRef}
                    columnDefs={columnDefs}
                    rowData={reportLines}
                    pinnedBottomRowData={pinnedBottomRow}
                    rowHeight={28}
                    headerHeight={32}
                    defaultColDef={{ filter: true, sortable: true, resizable: true }}
                    suppressMovableColumns={false}
                    suppressCellFocus
                    domLayout="autoHeight"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Payout History Tab */
        <div className="card" style={{ border: "1px solid #e2e8f0" }}>
          <div
            className="card-header py-3"
            style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h6 className="mb-0" style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                Payout History
              </h6>
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 200, fontSize: 12 }}
                value={filterUserId ?? ""}
                onChange={(e) => {
                  setFilterUserId(e.target.value === "" ? null : Number(e.target.value));
                  setTimeout(() => refetchHistory(), 100);
                }}
              >
                <option value="">All Employees</option>
                {userOptions.map((u: any) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body p-2">
            <div className="ag-theme-alpine" style={{ height: 400 }}>
              <AgGridReact
                ref={historyGridRef}
                columnDefs={historyColumnDefs}
                rowData={historyRows}
                rowHeight={28}
                headerHeight={32}
                defaultColDef={{ filter: true, sortable: true, resizable: true }}
                suppressCellFocus
                domLayout="autoHeight"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pay Out Modal */}
      <PayoutModal
        isOpen={payoutModal.open}
        line={payoutModal.line}
        fromdate={fromdate}
        todate={todate}
        storeid={parsedStoreId}
        onClose={() => setPayoutModal({ open: false, line: null })}
        onSuccess={() => {
          handleSearch();
          refetchHistory();
        }}
      />
    </>
  );
};

export default CommissionReportComponent;
