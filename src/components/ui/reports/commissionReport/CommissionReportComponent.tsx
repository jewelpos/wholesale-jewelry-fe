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
import { useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { formatCurrency } from "@/lib/utils/currencyFormat";
import {
  GET_EMPLOYEE_COMMISSION_REPORT_QUERY,
  GET_EMPLOYEE_COMMISSION_ESTIMATE_REPORT_QUERY,
  GET_COMMISSION_PAYOUT_HISTORY_QUERY,
} from "@/lib/graphql/query/reports";
import { RECORD_COMMISSION_PAYOUT_MUTATION } from "@/lib/graphql/mutations/commission";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import CommissionReportHeader from "./CommissionReportHeader";
import CommissionTransactionReportModal from "./CommissionTransactionReportModal";
import CommissionMonthlySummaryModal from "./CommissionMonthlySummaryModal";

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
// Always scoped to one specific invoice's own remaining commission — recorded with
// that invoicenumber, so it correctly reduces just that invoice's due amount. (A
// rep-level lump sum used to be an option here too, but it wasn't tied to any
// invoice, so it never updated per-invoice figures — removed.)
const PayoutModal = ({
  isOpen,
  line,
  userid,
  fromdate,
  todate,
  storeid,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  line: any;
  userid: number | null;
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

  const dueAmount = line ? Number(line.invoice_balance_due) : 0;
  const paidAmount = line ? Number(line.invoice_paid) : 0;
  const totalAmount = line ? Number(line.commission_amount ?? 0) : 0;

  // Pre-fill amount from the due figure when the line changes
  React.useEffect(() => {
    if (line) setAmount(String(dueAmount.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  if (!isOpen || !line || !userid) return null;

  const handleSave = async () => {
    if (dueAmount <= 0.01) {
      dispatch(showNotification({ message: "No commission is due for this invoice.", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    if (Number(amount) > dueAmount + 0.01) {
      dispatch(showNotification({ message: `Payout amount exceeds balance due (${formatCurrency(dueAmount)}).`, type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setSaving(true);
    const result = await handleTryCatch(async () => {
      await recordPayout({
        variables: {
          input: {
            storeid,
            userid,
            period_start: fromdate,
            period_end: todate,
            commission_amount: Number(amount),
            notes: notes || null,
            invoicenumber: line.invoicenumber,
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
            Invoice #{line.invoicenumber} · Period: {fromdate} to {todate}
          </div>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Invoice Commission</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(totalAmount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Already Paid</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>{formatCurrency(paidAmount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Balance Due</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{formatCurrency(dueAmount)}</span>
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
            max={dueAmount}
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

  const [activeTab, setActiveTab] = useState<"report" | "estimate" | "history">("report");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [reportLines, setReportLines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [estimateLines, setEstimateLines] = useState<any[]>([]);
  const [estimateSummary, setEstimateSummary] = useState<any>(null);
  const [estimateHasLoaded, setEstimateHasLoaded] = useState(false);
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; line: any; userid: number | null }>({
    open: false,
    line: null,
    userid: null,
  });
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [bulkPaying, setBulkPaying] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"remaining" | "paid" | "all">("remaining");
  const [recordPayoutBulk] = useMutation(RECORD_COMMISSION_PAYOUT_MUTATION);

  const { data: usersData } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  // Only the store owner may browse other reps' commission data — everyone else is
  // locked to their own report. The backend enforces this independently (it ignores
  // any userid a non-owner sends and substitutes their own), so this is UX only, not
  // the real security boundary.
  const isOwner = !!useAppSelector((state) => state.user.data?.issysgenmasteraccount);
  const currentUsername = useAppSelector((state) => state.user.data?.username);
  const currentUserId = useMemo(() => {
    const rows = usersData?.getUserListUnderStore;
    if (!rows || !currentUsername) return null;
    const match = rows.find((u: any) => u.login === currentUsername);
    return match ? Number(match.userid) : null;
  }, [usersData, currentUsername]);

  React.useEffect(() => {
    if (!isOwner && currentUserId != null) {
      setFilterUserId(currentUserId);
    }
  }, [isOwner, currentUserId]);

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

  const [getEstimateReport, { loading: estimateLoading }] = useLazyQuery(
    GET_EMPLOYEE_COMMISSION_ESTIMATE_REPORT_QUERY,
    { fetchPolicy: "network-only" }
  );

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

  const handleEstimateSearch = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      dispatch(showNotification({ message: "Select a date range", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const fromdate = dateRange[0].format("YYYY-MM-DD");
    const todate = dateRange[1].format("YYYY-MM-DD");
    const result = await handleTryCatch(async () => {
      const { data } = await getEstimateReport({
        variables: {
          storeid: parsedStoreId,
          fromdate,
          todate,
          userid: filterUserId ?? undefined,
        },
      });
      const report = data?.getEmployeeCommissionEstimateReport;
      setEstimateLines(report?.lines ?? []);
      setEstimateSummary(report ?? null);
      setEstimateHasLoaded(true);
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const fromdate = dateRange[0]?.format("YYYY-MM-DD") ?? "";
  const todate = dateRange[1]?.format("YYYY-MM-DD") ?? "";

  const selectedTotalDue = useMemo(
    () => selectedLines.reduce((s, l) => s + Math.max(0, Number(l.invoice_balance_due ?? 0)), 0),
    [selectedLines]
  );

  const filteredReportLines = useMemo(() => {
    // Fully paid: the invoice itself has no balance left (customer paid in full) AND
    // every dollar of commission earned on it has been paid out. A payment-trigger
    // invoice can have its earned-so-far commission fully paid while the invoice is
    // still owed money — more commission accrues as the rest gets collected, so that
    // invoice is NOT done yet even though its commission payout is caught up for now.
    const isFullyPaid = (l: any) =>
      Number(l.invoice_total_balance_due ?? 0) <= 0.01 &&
      Number(l.invoice_balance_due ?? 0) <= 0.01 &&
      Number(l.commission_amount ?? 0) > 0.01;

    if (paymentStatusFilter === "all") return reportLines;
    if (paymentStatusFilter === "paid") return reportLines.filter(isFullyPaid);
    return reportLines.filter((l) => !isFullyPaid(l));
  }, [reportLines, paymentStatusFilter]);

  // Pays each checked invoice its own due amount, as separate payout records (one per
  // invoicenumber) — reuses the exact same per-invoice validation as the row-level Pay
  // Out button, just triggered once for a batch instead of clicking each row.
  const handlePaySelected = async () => {
    const payable = selectedLines.filter((l) => Number(l.invoice_balance_due) > 0.01);
    if (payable.length === 0) return;
    const confirmResult = await showConfirmationDialog({
      title: `Pay ${payable.length} invoice${payable.length > 1 ? "s" : ""}?`,
      text: `Total payout: ${formatCurrency(selectedTotalDue)}`,
      confirmButtonText: "Yes, pay out",
      icon: "question",
    });
    if (!confirmResult.isConfirmed) return;

    setBulkPaying(true);
    const failed: string[] = [];
    for (const l of payable) {
      const res = await handleTryCatch(async () => {
        await recordPayoutBulk({
          variables: {
            input: {
              storeid: parsedStoreId,
              userid: l.userid,
              period_start: fromdate,
              period_end: todate,
              commission_amount: Number(l.invoice_balance_due),
              invoicenumber: l.invoicenumber,
            },
          },
        });
        return true;
      });
      if (res.error) failed.push(`#${l.invoicenumber} (${res.error})`);
    }
    setBulkPaying(false);

    if (failed.length) {
      dispatch(showNotification({
        message: `${payable.length - failed.length}/${payable.length} paid. Failed: ${failed.join(", ")}`,
        type: NOTIFICATION_TYPES.ERROR,
      }));
    } else {
      dispatch(showNotification({ message: `${payable.length} payout(s) recorded.`, type: NOTIFICATION_TYPES.SUCCESS }));
    }
    gridRef.current?.api?.deselectAll();
    setSelectedLines([]);
    handleSearch();
    refetchHistory();
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Customer",
        field: "customername",
        minWidth: 160,
        flex: 1.5,
        checkboxSelection: (params: any) => !!params.data && Number(params.data.invoice_balance_due) > 0.01,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      {
        headerName: "Invoice #",
        field: "invoicenumber",
        width: 110,
      },
      {
        headerName: "Date",
        field: "saledate",
        width: 110,
        valueFormatter: ({ value }) => (value ? dayjs(value).format("MMM D, YYYY") : ""),
      },
      {
        headerName: "Employee",
        field: "username",
        minWidth: 140,
        flex: 1.2,
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
        headerName: "Net Sales",
        field: "total_net_sales",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        headerName: "Amount Paid",
        field: "amount_paid",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { color: "#10b981" },
        headerTooltip: "Actually collected on this invoice within the period",
      },
      {
        headerName: "Balance Due",
        field: "invoice_total_balance_due",
        minWidth: 115,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: ({ value }: any) => ({
          fontWeight: 600,
          color: Number(value) > 0.01 ? "#ef4444" : "#10b981",
        }),
        headerTooltip: "This invoice's own outstanding balance owed by the customer",
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
        headerName: "Commission Paid",
        field: "invoice_paid",
        minWidth: 120,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { color: "#10b981" },
        headerTooltip: "Commission paid out to the rep specifically against this invoice",
      },
      {
        headerName: "Commission Due",
        field: "invoice_balance_due",
        minWidth: 125,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: ({ value }: any) => ({
          fontWeight: 700,
          color: Number(value) > 0 ? "#ef4444" : "#10b981",
        }),
        headerTooltip: "This invoice's own remaining commission — not the rep's total balance",
      },
      {
        headerName: "Actions",
        width: 100,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        headerClass: "no-print",
        cellClass: "no-print",
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return null;
          const canPay = Number(params.data.invoice_balance_due) > 0.01;
          return (
            <button
              type="button"
              className="btn btn-sm"
              disabled={!canPay}
              onClick={() => setPayoutModal({ open: true, line: params.data, userid: Number(params.data.userid) })}
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
      {
        headerName: "Type",
        field: "invoicenumber",
        width: 130,
        valueFormatter: ({ value }) => (value ? `Invoice #${value}` : "Lump Sum"),
      },
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

  const estimateColumnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Customer",
        field: "customername",
        minWidth: 160,
        flex: 1.5,
      },
      {
        headerName: "Invoice #",
        field: "invoicenumber",
        width: 110,
      },
      {
        headerName: "Date",
        field: "saledate",
        width: 110,
        valueFormatter: ({ value }) => (value ? dayjs(value).format("MMM D, YYYY") : ""),
      },
      {
        headerName: "Employee",
        field: "username",
        minWidth: 140,
        flex: 1.2,
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
        headerName: "Net Sales",
        field: "net_sales",
        minWidth: 110,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        headerName: "Expected Commission",
        field: "expected_commission",
        minWidth: 140,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { fontWeight: 700, color: "#8b5cf6" },
        headerTooltip: "Full commission on this invoice, regardless of payment or trigger setting",
      },
      {
        headerName: "Realized Commission",
        field: "realized_commission",
        minWidth: 140,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: { color: "#10b981" },
        headerTooltip: "What's already recognized under this invoice's warehouse's Invoice/Payment trigger",
      },
      {
        headerName: "Pending Commission",
        field: "pending_commission",
        minWidth: 140,
        type: "numericColumn",
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
        cellStyle: ({ value }: any) => ({
          fontWeight: 700,
          color: Number(value) > 0 ? "#f59e0b" : "#94a3b8",
        }),
        headerTooltip: "Still waiting on payment for a payment-trigger warehouse's invoice",
      },
    ] as ColDef[],
    []
  );

  const estimatePinnedBottomRow = useMemo(() => {
    if (!estimateSummary || !estimateLines.length) return [];
    return [
      {
        customername: "TOTAL",
        net_sales: estimateSummary.summary_expected_net_sales,
        expected_commission: estimateSummary.summary_expected_commission,
        realized_commission: estimateSummary.summary_realized_commission,
        pending_commission: estimateSummary.summary_pending_commission,
      },
    ];
  }, [estimateSummary, estimateLines]);

  const pinnedBottomRow = useMemo(() => {
    if (!summary || !filteredReportLines.length) return [];
    return [
      {
        customername: "TOTAL",
        total_net_sales: filteredReportLines.reduce((s, l) => s + Number(l.total_net_sales ?? 0), 0),
        amount_paid: filteredReportLines.reduce((s, l) => s + Number(l.amount_paid ?? 0), 0),
        invoice_total_balance_due: filteredReportLines.reduce((s, l) => s + Number(l.invoice_total_balance_due ?? 0), 0),
        total_cost: filteredReportLines.reduce((s, l) => s + Number(l.total_cost ?? 0), 0),
        gross_profit: filteredReportLines.reduce((s, l) => s + Number(l.gross_profit ?? 0), 0),
        commission_amount: filteredReportLines.reduce((s, l) => s + Number(l.commission_amount ?? 0), 0),
        true_profit_after_commission: filteredReportLines.reduce((s, l) => s + Number(l.true_profit_after_commission ?? 0), 0),
        invoice_paid: filteredReportLines.reduce((s, l) => s + Number(l.invoice_paid ?? 0), 0),
        invoice_balance_due: filteredReportLines.reduce((s, l) => s + Number(l.invoice_balance_due ?? 0), 0),
      },
    ];
  }, [summary, filteredReportLines]);

  const [showTransactionReport, setShowTransactionReport] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  return (
    <>
      <CommissionReportHeader
        onPrint={() => setShowTransactionReport(true)}
        onSummary={() => setShowMonthlySummary(true)}
      />
      {showTransactionReport && (
        <CommissionTransactionReportModal
          storeId={parsedStoreId}
          onClose={() => setShowTransactionReport(false)}
        />
      )}
      {showMonthlySummary && (
        <CommissionMonthlySummaryModal
          storeId={parsedStoreId}
          onClose={() => setShowMonthlySummary(false)}
        />
      )}

      {/* Tabs */}
      <div className="no-print" style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
        {(["report", "estimate", "history"] as const).map((tab) => (
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
            {tab === "report" ? "Commission Report" : tab === "estimate" ? "Commission Estimate" : "Payout History"}
          </button>
        ))}
      </div>

      {activeTab === "report" ? (
        <>
          {/* Filter bar */}
          <div className="card mb-3 no-print" style={{ border: "1px solid #e2e8f0" }}>
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
                    Employee {isOwner && "(optional)"}
                  </div>
                  {isOwner ? (
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
                  ) : (
                    <div
                      style={{
                        minWidth: 180,
                        fontSize: 13,
                        padding: "6px 10px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        color: "#475569",
                      }}
                    >
                      {userOptions.find((u: any) => u.value === currentUserId)?.label ?? "My Report Only"}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                    Payment Status
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(
                      [
                        { key: "remaining", label: "Remaining" },
                        { key: "paid", label: "Fully Paid" },
                        { key: "all", label: "All" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPaymentStatusFilter(opt.key)}
                        style={{
                          fontSize: 12,
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: paymentStatusFilter === opt.key ? "#8b5cf618" : "#fff",
                          color: paymentStatusFilter === opt.key ? "#8b5cf6" : "#64748b",
                          border: `1px solid ${paymentStatusFilter === opt.key ? "#8b5cf6" : "#e2e8f0"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
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

          {/* Pay Selected — records one payout per checked invoice, each for that
              invoice's own due amount. */}
          {hasLoaded && selectedLines.length > 0 && (() => {
            const payableSelected = selectedLines.filter((l) => Number(l.invoice_balance_due) > 0.01);
            return (
              <div className="mb-3 no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={payableSelected.length === 0 || bulkPaying}
                  onClick={handlePaySelected}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    background: payableSelected.length > 0 ? "#0d6efd18" : "#f1f5f9",
                    color: payableSelected.length > 0 ? "#0d6efd" : "#94a3b8",
                    border: `1px solid ${payableSelected.length > 0 ? "#0d6efd" : "#e2e8f0"}`,
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {bulkPaying
                    ? "Paying..."
                    : payableSelected.length > 0
                      ? `Pay ${payableSelected.length} Selected (${formatCurrency(selectedTotalDue)})`
                      : "Selected invoices have no balance due"}
                </button>
              </div>
            );
          })()}

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
                <div className="ag-theme-quartz" style={{ height: 400 }}>
                  <AgGridReact
                    ref={gridRef}
                    columnDefs={columnDefs}
                    rowData={filteredReportLines}
                    pinnedBottomRowData={pinnedBottomRow}
                    rowHeight={28}
                    headerHeight={32}
                    defaultColDef={{ filter: true, sortable: true, resizable: true }}
                    suppressMovableColumns={false}
                    suppressCellFocus
                    domLayout="autoHeight"
                    rowSelection="multiple"
                    suppressRowClickSelection
                    isRowSelectable={(node: any) => !!node.data && Number(node.data.invoice_balance_due) > 0.01}
                    onSelectionChanged={(e: any) => setSelectedLines(e.api.getSelectedRows())}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === "estimate" ? (
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
                    Employee {isOwner && "(optional)"}
                  </div>
                  {isOwner ? (
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
                  ) : (
                    <div
                      style={{
                        minWidth: 180,
                        fontSize: 13,
                        padding: "6px 10px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        color: "#475569",
                      }}
                    >
                      {userOptions.find((u: any) => u.value === currentUserId)?.label ?? "My Report Only"}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleEstimateSearch}
                  disabled={estimateLoading}
                  style={{ alignSelf: "flex-end" }}
                >
                  {estimateLoading ? "Loading..." : "Run Report"}
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {estimateHasLoaded && estimateSummary && (
            <div className="row g-3 mb-3">
              <div className="col-xl-3 col-md-6 col-6">
                <KpiCard
                  label="Expected Sales"
                  value={formatCurrency(Number(estimateSummary.summary_expected_net_sales ?? 0))}
                  icon={DollarSign}
                  accent="#376fd0"
                />
              </div>
              <div className="col-xl-3 col-md-6 col-6">
                <KpiCard
                  label="Expected Commission"
                  value={formatCurrency(Number(estimateSummary.summary_expected_commission ?? 0))}
                  icon={Users}
                  accent="#8b5cf6"
                />
              </div>
              <div className="col-xl-3 col-md-6 col-6">
                <KpiCard
                  label="Realized Commission"
                  value={formatCurrency(Number(estimateSummary.summary_realized_commission ?? 0))}
                  icon={TrendingUp}
                  accent="#10b981"
                />
              </div>
              <div className="col-xl-3 col-md-6 col-6">
                <KpiCard
                  label="Pending Commission"
                  value={formatCurrency(Number(estimateSummary.summary_pending_commission ?? 0))}
                  icon={AlertCircle}
                  accent="#f59e0b"
                />
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="card" style={{ border: "1px solid #e2e8f0" }}>
            <div className="card-body p-2">
              {!estimateHasLoaded && !estimateLoading ? (
                <div
                  className="p-4 text-center"
                  style={{ color: "#94a3b8", fontSize: 13 }}
                >
                  Select a date range and click Run Report.
                </div>
              ) : (
                <div className="ag-theme-quartz" style={{ height: 400 }}>
                  <AgGridReact
                    columnDefs={estimateColumnDefs}
                    rowData={estimateLines}
                    pinnedBottomRowData={estimatePinnedBottomRow}
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
            <div className="ag-theme-quartz" style={{ height: 400 }}>
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
        userid={payoutModal.userid}
        fromdate={fromdate}
        todate={todate}
        storeid={parsedStoreId}
        onClose={() => setPayoutModal({ open: false, line: null, userid: null })}
        onSuccess={() => {
          handleSearch();
          refetchHistory();
        }}
      />
    </>
  );
};

export default CommissionReportComponent;
