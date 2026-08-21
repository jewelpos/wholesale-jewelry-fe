"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Printer, X, RefreshCw } from "react-feather";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/store/hook";
import {
  GET_EMPLOYEE_COMMISSION_REPORT_QUERY,
  GET_EMPLOYEE_COMMISSION_ESTIMATE_REPORT_QUERY,
  GET_COMMISSION_PAYOUT_HISTORY_QUERY,
  GET_COMMISSION_MONTHLY_SUMMARY_QUERY,
} from "@/lib/graphql/query/reports";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { formatCurrency } from "@/lib/utils/currencyFormat";
import useOutlets from "@/hooks/useOutlets";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

const { RangePicker } = DatePicker;

interface Props {
  storeId: number;
  onClose: () => void;
}

const SectionLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
    {children}
  </div>
);

const th: React.CSSProperties = { padding: "5px 6px", fontWeight: 700, fontSize: 10, color: "#475569", textAlign: "left", borderBottom: "2px solid #0f172a", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "5px 6px", fontSize: 11, borderBottom: "1px solid #e2e8f0" };

const CommissionTransactionReportModal: React.FC<Props> = ({ storeId, onClose }) => {
  const { outletId: outletIdParam } = useParams();
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [userId, setUserId] = useState<string>("");
  const [outletId, setOutletId] = useState<number>(Number(outletIdParam) || 0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const { outlets, fetchOutletsList } = useOutlets();
  useEffect(() => {
    if (storeId) fetchOutletsList([storeId]);
  }, [storeId, fetchOutletsList]);

  const { data: usersData } = useQuery(GET_USERS_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
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

  // Only the store owner may browse other reps' data here — everyone else is locked
  // to their own report (the backend enforces this independently regardless of what
  // this form sends, so this is UX only, not the real security boundary).
  const isOwner = !!useAppSelector((state) => state.user.data?.issysgenmasteraccount);
  const currentUsername = useAppSelector((state) => state.user.data?.username);
  const currentUserId = useMemo(() => {
    const rows = usersData?.getUserListUnderStore;
    if (!rows || !currentUsername) return null;
    const match = rows.find((u: any) => u.login === currentUsername);
    return match ? Number(match.userid) : null;
  }, [usersData, currentUsername]);

  useEffect(() => {
    if (!isOwner && currentUserId != null) {
      setUserId(String(currentUserId));
    }
  }, [isOwner, currentUserId]);

  const fromdate = dateRange[0]?.format("YYYY-MM-DD") ?? "";
  const todate = dateRange[1]?.format("YYYY-MM-DD") ?? "";
  const parsedUserId = userId ? Number(userId) : undefined;

  const [getReport, { data: reportData, loading: reportLoading }] = useLazyQuery(GET_EMPLOYEE_COMMISSION_REPORT_QUERY, { fetchPolicy: "network-only" });
  const [getEstimate, { data: estimateData, loading: estimateLoading }] = useLazyQuery(GET_EMPLOYEE_COMMISSION_ESTIMATE_REPORT_QUERY, { fetchPolicy: "network-only" });
  const [getHistory, { data: historyData, loading: historyLoading }] = useLazyQuery(GET_COMMISSION_PAYOUT_HISTORY_QUERY, { fetchPolicy: "network-only" });
  const [getMonthly, { data: monthlyData, loading: monthlyLoading }] = useLazyQuery(GET_COMMISSION_MONTHLY_SUMMARY_QUERY, { fetchPolicy: "network-only" });

  const loading = reportLoading || estimateLoading || historyLoading || monthlyLoading;

  const runSearch = () => {
    if (!outletId || !fromdate || !todate) return;
    const baseVars = { storeid: storeId, fromdate, todate, userid: parsedUserId, outletid: outletId };
    getReport({ variables: baseVars });
    getEstimate({ variables: baseVars });
    getHistory({ variables: baseVars });
    getMonthly({ variables: baseVars });
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const estimationLines = estimateData?.getEmployeeCommissionEstimateReport?.lines ?? [];
  const pendingLines = (reportData?.getEmployeeCommissionReport?.lines ?? []).filter(
    (l: any) => Number(l.invoice_balance_due ?? 0) > 0.01
  );
  const paidOutRows = historyData?.getCommissionPayoutHistory ?? [];
  const monthlyRows = monthlyData?.getCommissionMonthlySummary ?? [];

  const estimationTotal = estimationLines.reduce((s: number, l: any) => s + Number(l.expected_commission ?? 0), 0);
  const pendingTotal = pendingLines.reduce((s: number, l: any) => s + Number(l.invoice_balance_due ?? 0), 0);
  const paidOutTotal = paidOutRows.reduce((s: number, r: any) => s + Number(r.commission_amount ?? 0), 0);
  const monthlyTotal = monthlyRows.reduce((s: number, r: any) => s + Number(r.total_paid ?? 0), 0);

  const handlePrint = async () => {
    if (!outletId) {
      dispatch(showNotification({ message: "Select an outlet before printing.", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setPrinting(true);
    try {
      const response = await api.post(
        "/store/commission/report/print",
        { storeid: storeId, outletid: outletId, userid: parsedUserId, fromdate, todate },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch (err: unknown) {
      let msg = "Failed to generate commission report PDF";
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
          width: "min(1200px, 96vw)", height: "min(92vh, 860px)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Commission Transaction Report</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left — Controls */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ marginBottom: 18 }}>
                <SectionLabel>Outlet</SectionLabel>
                <select
                  className="form-select"
                  value={outletId || ""}
                  onChange={(e) => setOutletId(Number(e.target.value))}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12 }}
                >
                  <option value="">Select outlet</option>
                  {outlets.map((o: any) => (
                    <option key={o.outletid} value={o.outletid}>{o.outletname}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <SectionLabel>Sales Rep</SectionLabel>
                {isOwner ? (
                  <select
                    className="form-select"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12 }}
                  >
                    <option value="">All Sales Reps</option>
                    {userOptions.map((u: any) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ width: "100%", padding: "6px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 12, color: "#475569", boxSizing: "border-box" }}>
                    {userOptions.find((u: any) => u.value === currentUserId)?.label ?? "My Report Only"}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <SectionLabel>Date Range</SectionLabel>
                <RangePicker
                  value={dateRange}
                  onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
                  format="YYYY-MM-DD"
                  size="middle"
                  style={{ width: "100%", fontSize: 12 }}
                />
              </div>

              <button
                onClick={runSearch}
                disabled={!outletId}
                style={{
                  width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 7,
                  background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600,
                  cursor: outletId ? "pointer" : "not-allowed", opacity: outletId ? 1 : 0.6,
                }}
              >
                Apply Filters
              </button>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={handlePrint}
                disabled={loading || printing || !outletId}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                  padding: "9px 12px", border: "none", borderRadius: 7,
                  background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: loading || printing || !outletId ? "not-allowed" : "pointer", opacity: loading || printing || !outletId ? 0.6 : 1,
                }}
              >
                <Printer size={14} />
                {printing ? "Generating PDF..." : "Print Report"}
              </button>
            </div>
          </div>

          {/* Right — Preview */}
          <div style={{ flex: 1, overflowY: "auto", background: "#e8edf3", padding: 20, position: "relative" }}>
            {!outletId && (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
                Select an outlet to run the report.
              </div>
            )}

            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(232,237,243,0.8)", zIndex: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} style={{ color: "#64748b", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Loading...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!!outletId && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Estimation */}
                <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Estimation Transactions</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Date</th>
                        <th style={th}>Invoice #</th>
                        <th style={th}>Customer</th>
                        <th style={th}>Sales Rep</th>
                        <th style={{ ...th, textAlign: "right" }}>Net Sales</th>
                        <th style={{ ...th, textAlign: "right" }}>Expected Comm.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimationLines.map((l: any, i: number) => (
                        <tr key={i}>
                          <td style={td}>{l.saledate ? dayjs(l.saledate).format("MM/DD/YY") : ""}</td>
                          <td style={td}>{l.invoicenumber}</td>
                          <td style={td}>{l.customername}</td>
                          <td style={td}>{l.username}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(l.net_sales ?? 0))}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(l.expected_commission ?? 0))}</td>
                        </tr>
                      ))}
                      {estimationLines.length === 0 && (
                        <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>No invoices in this period.</td></tr>
                      )}
                    </tbody>
                    {estimationLines.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={5} style={{ ...td, fontWeight: 700, borderBottom: "none" }}>Total</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{formatCurrency(estimationTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pending */}
                <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Pending Transactions</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Date</th>
                        <th style={th}>Invoice #</th>
                        <th style={th}>Customer</th>
                        <th style={th}>Sales Rep</th>
                        <th style={{ ...th, textAlign: "right" }}>Commission</th>
                        <th style={{ ...th, textAlign: "right" }}>Paid</th>
                        <th style={{ ...th, textAlign: "right" }}>Balance Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLines.map((l: any, i: number) => (
                        <tr key={i}>
                          <td style={td}>{l.saledate ? dayjs(l.saledate).format("MM/DD/YY") : ""}</td>
                          <td style={td}>{l.invoicenumber}</td>
                          <td style={td}>{l.customername}</td>
                          <td style={td}>{l.username}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(l.commission_amount ?? 0))}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(l.invoice_paid ?? 0))}</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{formatCurrency(Number(l.invoice_balance_due ?? 0))}</td>
                        </tr>
                      ))}
                      {pendingLines.length === 0 && (
                        <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>No pending commission in this period.</td></tr>
                      )}
                    </tbody>
                    {pendingLines.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={6} style={{ ...td, fontWeight: 700, borderBottom: "none" }}>Total</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{formatCurrency(pendingTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Paid Out */}
                <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Paid Out Transactions</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Paid Date</th>
                        <th style={th}>Sales Rep</th>
                        <th style={th}>Invoice #</th>
                        <th style={{ ...th, textAlign: "right" }}>Amount Paid</th>
                        <th style={th}>Paid By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidOutRows.map((r: any) => (
                        <tr key={r.id}>
                          <td style={td}>{r.paid_at}</td>
                          <td style={td}>{r.username}</td>
                          <td style={td}>{r.invoicenumber ? `#${r.invoicenumber}` : "Lump Sum"}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(r.commission_amount ?? 0))}</td>
                          <td style={td}>{r.paid_by_username}</td>
                        </tr>
                      ))}
                      {paidOutRows.length === 0 && (
                        <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>No payouts recorded in this period.</td></tr>
                      )}
                    </tbody>
                    {paidOutRows.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ ...td, fontWeight: 700, borderBottom: "none" }}>Total</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{formatCurrency(paidOutTotal)}</td>
                          <td style={{ ...td, borderBottom: "none" }} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Monthly Summary */}
                <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Paid Out — Monthly Summary (by Sales Rep &amp; Outlet)</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Month</th>
                        <th style={th}>Sales Rep</th>
                        <th style={th}>Outlet</th>
                        <th style={{ ...th, textAlign: "right" }}>Total Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRows.map((r: any, i: number) => (
                        <tr key={i}>
                          <td style={td}>{r.month}</td>
                          <td style={td}>{r.username}</td>
                          <td style={td}>{r.outletname ?? "—"}</td>
                          <td style={{ ...td, textAlign: "right" }}>{formatCurrency(Number(r.total_paid ?? 0))}</td>
                        </tr>
                      ))}
                      {monthlyRows.length === 0 && (
                        <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>No payouts recorded in this period.</td></tr>
                      )}
                    </tbody>
                    {monthlyRows.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ ...td, fontWeight: 700, borderBottom: "none" }}>Total</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{formatCurrency(monthlyTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename="commission-transaction-report.pdf"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </>,
    document.body
  );
};

export default CommissionTransactionReportModal;
