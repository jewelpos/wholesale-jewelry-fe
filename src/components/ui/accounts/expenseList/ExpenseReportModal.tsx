"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { Printer, X, RefreshCw } from "react-feather";
import { useParams } from "next/navigation";
import { GET_EXPENSE_LIST_QUERY, GET_EXPENSE_CODE_QUERY, GET_EXPENSE_SUMMARY_BY_CODE_QUERY } from "@/lib/graphql/query/accounts";
import { AccountsExpenseListType } from "@/types/accounts";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

interface Props {
  outletId: number;
  onClose: () => void;
}

type ReportMode = "detail" | "summary";

interface ExpenseSummaryRow {
  expensecodeid: number;
  accountdescription: string;
  transactioncount: number;
  amountpaid: number;
  amountapproved: number;
  amountrejected: number;
  amountpending: number;
}

const ControlLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
    {children}
  </div>
);

const ExpenseReportModal: React.FC<Props> = ({ outletId, onClose }) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<ReportMode>("detail");
  const [expensecodeid, setExpensecodeid] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const { data: expenseCodesData } = useQuery(GET_EXPENSE_CODE_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const expenseCodes = expenseCodesData?.getExpenseCode ?? [];

  const [fetchExpenses, { data: expenseData, loading: loadingDetail }] = useLazyQuery(GET_EXPENSE_LIST_QUERY, {
    fetchPolicy: "network-only",
  });
  const [fetchSummary, { data: summaryData, loading: loadingSummary }] = useLazyQuery(GET_EXPENSE_SUMMARY_BY_CODE_QUERY, {
    fetchPolicy: "network-only",
  });
  const loading = mode === "detail" ? loadingDetail : loadingSummary;

  const buildFilters = () => {
    const filters: { key: string; value: Record<string, unknown> }[] = [];
    if (expensecodeid) {
      filters.push({ key: "expensecodeid", value: { filterType: "number", type: "equals", filter: Number(expensecodeid) } });
    }
    if (fromDate && toDate) {
      filters.push({ key: "expensedate", value: { filterType: "date", type: "inRange", dateFrom: fromDate, dateTo: toDate } });
    }
    return filters;
  };

  const runSearch = () => {
    if (!outletId) return;
    if (mode === "detail") {
      fetchExpenses({
        variables: { outletid: outletId, page: 1, perpage: 10000, filters: buildFilters(), sortModel: [] },
      });
    } else {
      fetchSummary({
        variables: { storeid: parsedStoreId, outletid: outletId, startdate: fromDate || undefined, enddate: toDate || undefined },
      });
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, mode]);

  const rows: AccountsExpenseListType[] = expenseData?.getExpenseList?.data ?? [];
  const total = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.expenseamount) || 0), 0), [rows]);

  const summaryRows: ExpenseSummaryRow[] = summaryData?.getExpenseSummaryByCode ?? [];
  const summaryTotals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, r) => ({
          transactioncount: acc.transactioncount + (Number(r.transactioncount) || 0),
          amountpaid: acc.amountpaid + (Number(r.amountpaid) || 0),
          amountapproved: acc.amountapproved + (Number(r.amountapproved) || 0),
          amountrejected: acc.amountrejected + (Number(r.amountrejected) || 0),
          amountpending: acc.amountpending + (Number(r.amountpending) || 0),
        }),
        { transactioncount: 0, amountpaid: 0, amountapproved: 0, amountrejected: 0, amountpending: 0 }
      ),
    [summaryRows]
  );

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const endpoint = mode === "detail" ? "/store/expense/report/print" : "/store/expense/report/summary/print";
      const response = await api.post(
        endpoint,
        {
          storeid: parsedStoreId,
          outletid: outletId,
          expensecodeid: mode === "detail" && expensecodeid ? Number(expensecodeid) : undefined,
          startdate: fromDate || undefined,
          enddate: toDate || undefined,
        },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch (err: unknown) {
      let msg = "Failed to generate expense report PDF";
      try {
        const errResponse = (err as { response?: { data?: Blob } })?.response;
        if (errResponse?.data instanceof Blob) {
          const text = await errResponse.data.text();
          const parsed = JSON.parse(text);
          msg = parsed?.message || msg;
        }
      } catch { /* ignore */ }
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setPrinting(false);
    }
  };

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050 }} onClick={onClose} />

      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(1100px, 96vw)", height: "min(90vh, 800px)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Expense Report</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left — Controls */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ marginBottom: 18 }}>
                <ControlLabel>Report Type</ControlLabel>
                <div style={{ display: "flex", gap: 4 }}>
                  {([
                    { value: "detail", label: "Detail" },
                    { value: "summary", label: "Summary by Code" },
                  ] as { value: ReportMode; label: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMode(opt.value)}
                      style={{
                        flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 11.5, cursor: "pointer",
                        border: mode === opt.value ? "none" : "1px solid #cbd5e1",
                        background: mode === opt.value ? "#0f172a" : "#fff",
                        color: mode === opt.value ? "#fff" : "#374151",
                        fontWeight: mode === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "detail" && (
                <div style={{ marginBottom: 18 }}>
                  <ControlLabel>Expense Code</ControlLabel>
                  <select
                    className="form-select"
                    value={expensecodeid}
                    onChange={(e) => setExpensecodeid(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12 }}
                  >
                    <option value="">All</option>
                    {expenseCodes.map((ec: { expensecode: number; accountdescription: string }) => (
                      <option key={ec.expensecode} value={ec.expensecode}>
                        {ec.accountdescription}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <ControlLabel>From Date</ControlLabel>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <ControlLabel>To Date</ControlLabel>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={runSearch}
                style={{
                  width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 7,
                  background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Apply Filters
              </button>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={handlePrint}
                disabled={loading || printing}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                  padding: "9px 12px", border: "none", borderRadius: 7,
                  background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: loading || printing ? "not-allowed" : "pointer", opacity: loading || printing ? 0.6 : 1,
                }}
              >
                <Printer size={14} />
                {printing ? "Generating PDF..." : "Print Report"}
              </button>
            </div>
          </div>

          {/* Right — Preview table */}
          <div style={{ flex: 1, overflowY: "auto", background: "#e8edf3", padding: 20, position: "relative" }}>
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(232,237,243,0.8)", zIndex: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} style={{ color: "#64748b", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Loading expenses...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", minHeight: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {mode === "detail" ? "Expense Report" : "Expense Summary by Code"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                {fromDate && toDate ? `${fromDate} to ${toDate}` : "All time"}
                {mode === "detail"
                  ? ` · ${rows.length} expense${rows.length === 1 ? "" : "s"}`
                  : ` · ${summaryRows.length} expense code${summaryRows.length === 1 ? "" : "s"}`}
              </div>

              {mode === "detail" ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
                      <th style={{ padding: "6px 8px" }}>Date</th>
                      <th style={{ padding: "6px 8px" }}>Expense Code</th>
                      <th style={{ padding: "6px 8px" }}>Detail</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "6px 8px" }}>Paymode</th>
                      <th style={{ padding: "6px 8px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.expenseid} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 1 ? "#f8fafc" : "#fff" }}>
                        <td style={{ padding: "6px 8px" }}>{r.expensedate ? dayjs(r.expensedate).format("MM/DD/YYYY") : ""}</td>
                        <td style={{ padding: "6px 8px" }}>{r.accountdescription}</td>
                        <td style={{ padding: "6px 8px" }}>{r.expensedetail}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(r.expenseamount || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 8px" }}>{r.expensemode}</td>
                        <td style={{ padding: "6px 8px" }}>{r.approvalstatus}</td>
                      </tr>
                    ))}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "20px 8px", textAlign: "center", color: "#94a3b8" }}>
                          No expenses found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 700 }}>
                        <td colSpan={3} style={{ padding: "8px" }}>Total</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{total.toFixed(2)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
                      <th style={{ padding: "6px 8px" }}>Expense Code</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Transactions</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount Paid</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount Approved</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount Rejected</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((r, i) => (
                      <tr key={r.expensecodeid} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 1 ? "#f8fafc" : "#fff" }}>
                        <td style={{ padding: "6px 8px" }}>{r.accountdescription}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{r.transactioncount}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(r.amountpaid || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(r.amountapproved || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(r.amountrejected || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{Number(r.amountpending || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {!loading && summaryRows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "20px 8px", textAlign: "center", color: "#94a3b8" }}>
                          No expenses found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {summaryRows.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 700 }}>
                        <td style={{ padding: "8px" }}>Total</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{summaryTotals.transactioncount}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{summaryTotals.amountpaid.toFixed(2)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{summaryTotals.amountapproved.toFixed(2)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{summaryTotals.amountrejected.toFixed(2)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{summaryTotals.amountpending.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename={mode === "detail" ? "expense-report.pdf" : "expense-summary-report.pdf"}
          onClose={() => setPdfUrl(null)}
        />
      )}
    </>,
    document.body
  );
};

export default ExpenseReportModal;
