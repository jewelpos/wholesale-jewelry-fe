"use client";

import React, { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_CUSTOMER_CHECKS_FOR_PRINT_QUERY } from "@/lib/graphql/query/customer";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";
import SelectCustomer from "@/components/forms/SelectCustomer";
import DOMPurify from "dompurify";
import dayjs from "dayjs";

interface CheckPrintItem {
  customerid: number;
  custcompanyname: string;
  checkpostingdate: string;
  checkno: string;
  checkamount: number;
  checkstatus: string;
  checkentrydate: string;
  enteredby: string;
  customercheckdetailid: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "O/H", label: "On Hand (O/H)" },
  { value: "HLD", label: "Hold (HLD)" },
  { value: "DEP", label: "Deposited (DEP)" },
  { value: "NSF", label: "NSF" },
  { value: "VD", label: "Void (VD)" },
];

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val: string | null | undefined) =>
  val ? dayjs(val).format("MM/DD/YYYY") : "";

const OnHandChecksPrintModal = ({ onClose }: { onClose: () => void }) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const storeName = useAppSelector((state) => state.store.data?.storename ?? "");

  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [checks, setChecks] = useState<CheckPrintItem[]>([]);
  const [fetched, setFetched] = useState(false);

  const [fetchChecks, { loading }] = useLazyQuery(GET_CUSTOMER_CHECKS_FOR_PRINT_QUERY, {
    fetchPolicy: "network-only",
  });

  const handleFetch = async () => {
    const { data } = await fetchChecks({
      variables: {
        storeid: parsedStoreId,
        customerid: selectedCustomer || null,
        fromdate: fromDate || null,
        todate: toDate || null,
        checkstatus: statusFilter === "ALL" ? null : statusFilter,
      },
    });
    setChecks(data?.getCustomerChecksForPrint ?? []);
    setFetched(true);
  };

  const totalAmount = checks.reduce((s, r) => s + (Number(r.checkamount) || 0), 0);

  const periodLabel = (() => {
    if (fromDate && toDate) return `${dayjs(fromDate).format("MM/DD/YYYY")} — ${dayjs(toDate).format("MM/DD/YYYY")}`;
    if (fromDate) return `From ${dayjs(fromDate).format("MM/DD/YYYY")}`;
    if (toDate) return `Up to ${dayjs(toDate).format("MM/DD/YYYY")}`;
    return "All Dates";
  })();

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter;

  const handlePrint = () => {
    const rawContent = document.getElementById("onhand-print-content")?.innerHTML ?? "";
    if (!rawContent) return;
    const content = DOMPurify.sanitize(rawContent);

    const win = window.open("", "_blank", "width=960,height=720");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>On Hand Checks Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 5px 7px; border: 1px solid #ccc; font-size: 10px; text-transform: uppercase; text-align: left; background: #f0f0f0; }
    td { padding: 4px 7px; border: 1px solid #ddd; font-size: 11px; }
    @page { margin: 1.5cm; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title">Print On Hand Checks</h5>
            <div className="d-flex gap-2 ms-auto">
              {fetched && checks.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <i className="feather-printer me-1" />
                  Print
                </button>
              )}
              <button className="btn-close" onClick={onClose} />
            </div>
          </div>

          {/* Filter bar */}
          <div className="modal-body border-bottom py-2 px-3" style={{ background: "#f8fafc" }}>
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>Customer (optional)</label>
                <SelectCustomer
                  className=""
                  trigger={() => {}}
                  setValue={() => {}}
                  storeId={parsedStoreId}
                  value={selectedCustomer}
                  onChange={(v: React.SetStateAction<number>) => setSelectedCustomer(v)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>From Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>To Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>Status</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex">
                <button
                  className="btn btn-success btn-sm w-100"
                  onClick={handleFetch}
                  disabled={loading}
                >
                  {loading ? <><i className="fas fa-spinner fa-spin me-1" />Loading…</> : <><i className="feather-refresh-cw me-1" />Load</>}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-body p-3" style={{ background: "#f5f5f5" }}>
            {!fetched ? (
              <div className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                Set your filters above and click <strong>Load</strong> to preview checks.
              </div>
            ) : checks.length === 0 ? (
              <div className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                No checks found for the selected criteria.
              </div>
            ) : (
              <div
                id="onhand-print-content"
                style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 4,
                  border: "1px solid #ddd",
                  fontFamily: "Arial, sans-serif",
                  fontSize: 12,
                }}
              >
                {/* Print header */}
                <div className="header" style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #333", paddingBottom: 10, marginBottom: 14 }}>
                  <div>
                    <div className="store-name" style={{ fontSize: 18, fontWeight: 700 }}>{storeName}</div>
                    <div className="report-title" style={{ fontSize: 13, color: "#555", marginTop: 2 }}>On Hand Checks Report</div>
                  </div>
                  <div className="meta" style={{ textAlign: "right", fontSize: 10, color: "#666" }}>
                    <div>Print Date: {dayjs().format("MM/DD/YYYY")}</div>
                    <div style={{ marginTop: 2 }}>Period: {periodLabel}</div>
                    <div style={{ marginTop: 2 }}>Status: {statusLabel}</div>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      {["Customer Name", "Check #", "Posting Date", "Amount", "Status", "Entry Date", "Entered By"].map((h) => (
                        <th key={h} style={{ padding: "5px 7px", border: "1px solid #ccc", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((row, i) => (
                      <tr key={row.customercheckdetailid} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.custcompanyname}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.checkno}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd", whiteSpace: "nowrap" }}>{fmtDate(row.checkpostingdate)}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(row.checkamount)}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.checkstatus}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd", whiteSpace: "nowrap" }}>{fmtDate(row.checkentrydate)}</td>
                        <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.enteredby}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: "#f4f4f4", fontWeight: 700, borderTop: "2px solid #999" }}>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }} colSpan={2}>
                        TOTAL — {checks.length} {checks.length === 1 ? "check" : "checks"}
                      </td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }} />
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(totalAmount)}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }} colSpan={3} />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnHandChecksPrintModal;
