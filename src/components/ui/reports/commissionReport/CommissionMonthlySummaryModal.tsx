"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Printer, X, RefreshCw } from "react-feather";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/store/hook";
import { GET_COMMISSION_MONTHLY_SUMMARY_QUERY } from "@/lib/graphql/query/reports";
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

const CommissionMonthlySummaryModal: React.FC<Props> = ({ storeId, onClose }) => {
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("year"),
    dayjs(),
  ]);
  const [userId, setUserId] = useState<string>("");
  // Empty string = All Outlets — unlike the combined transaction report, this report
  // is allowed to run across every outlet at once (store owner only; enforced
  // server-side, not just hidden client-side).
  const [outletId, setOutletId] = useState<string>("");
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
  const parsedOutletId = outletId ? Number(outletId) : undefined;

  const [getMonthly, { data: monthlyData, loading }] = useLazyQuery(GET_COMMISSION_MONTHLY_SUMMARY_QUERY, { fetchPolicy: "network-only" });

  const runSearch = () => {
    if (!fromdate || !todate) return;
    getMonthly({ variables: { storeid: storeId, fromdate, todate, userid: parsedUserId, outletid: parsedOutletId } });
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyRows = monthlyData?.getCommissionMonthlySummary ?? [];
  const monthlyTotal = monthlyRows.reduce((s: number, r: any) => s + Number(r.total_paid ?? 0), 0);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await api.post(
        "/store/commission/report/monthly-summary/print",
        { storeid: storeId, outletid: parsedOutletId, userid: parsedUserId, fromdate, todate },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch (err: unknown) {
      let msg = "Failed to generate monthly summary PDF";
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
          width: "min(900px, 96vw)", height: "min(88vh, 720px)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Commission Paid Out — Monthly Summary</div>
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
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12 }}
                >
                  <option value="">All Outlets</option>
                  {outlets.map((o: any) => (
                    <option key={o.outletid} value={o.outletid}>{o.outletname}</option>
                  ))}
                </select>
                {!outletId && (
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                    All Outlets is only viewable/printable as the store owner.
                  </div>
                )}
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
                  presets={[
                    { label: "This Month", value: [dayjs().startOf("month"), dayjs()] },
                    { label: "Last Month", value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
                    { label: "This Year", value: [dayjs().startOf("year"), dayjs()] },
                  ]}
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

          {/* Right — Preview */}
          <div style={{ flex: 1, overflowY: "auto", background: "#e8edf3", padding: 20, position: "relative" }}>
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(232,237,243,0.8)", zIndex: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} style={{ color: "#64748b", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Loading...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", minHeight: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Paid Out — Monthly Summary</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                {fromdate} to {todate} · {monthlyRows.length} row{monthlyRows.length === 1 ? "" : "s"}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
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
                  {!loading && monthlyRows.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "20px 8px", textAlign: "center", color: "#94a3b8" }}>
                        No payouts recorded for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
                {monthlyRows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: "8px" }}>Total</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(monthlyTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename="commission-monthly-summary.pdf"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </>,
    document.body
  );
};

export default CommissionMonthlySummaryModal;
