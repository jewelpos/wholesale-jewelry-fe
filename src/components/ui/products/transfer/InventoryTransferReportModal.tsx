"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { Printer, X, RefreshCw } from "react-feather";
import { useParams } from "next/navigation";
import {
  GET_INVENTORY_TRANSFER_REPORT_LIST_QUERY,
  GET_TRANSFER_STATUS_LIST_QUERY,
} from "@/lib/graphql/query/products";
import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import SelectEmployee from "@/components/forms/SelectEmployee";

interface Props {
  onClose: () => void;
  // Pre-selected via checkboxes on the transfer list grid. When non-empty, the report
  // is scoped to exactly these transfers instead of the manual "Transfer ID" input.
  initialTransferIds?: number[];
}

interface ReportRow {
  inventoryitemtransferid: number;
  transferdatetime: string;
  transferstatus: string;
  fromwarehousename: string;
  towarehousename: string;
  requestedbyname: string;
  transferbyname: string;
  itemcode: string;
  itemdescription: string;
  itemunit: string;
  categoryname: string;
  quantityrequest: number;
  transferquantity: number;
  quantityreceived: number;
  unitprice: number;
  unitcost: number;
  totalcost: number;
}

const ControlLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, boxSizing: "border-box",
};

const InventoryTransferReportModal: React.FC<Props> = ({ onClose, initialTransferIds }) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();

  // Checkbox-selected transfers take priority; the manual numeric input only applies
  // when nothing was selected on the grid. Leaving both empty means "any" (no filter).
  const [selectedTransferIds, setSelectedTransferIds] = useState<number[]>(initialTransferIds ?? []);
  const [transferid, setTransferid] = useState<string>("");
  const [fromoutletid, setFromoutletid] = useState<string>("");
  const [tooutletid, setTooutletid] = useState<string>("");
  const [transferstatusid, setTransferstatusid] = useState<string>("");
  const [requestedbyid, setRequestedbyid] = useState<number | undefined>(undefined);
  const [transferbyid, setTransferbyid] = useState<number | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const { data: outletsData } = useQuery(GET_OUTLETS_QUERY, {
    variables: { storeid: [parsedStoreId], includeAll: true },
    skip: !parsedStoreId,
  });
  const outlets = outletsData?.getOutlets ?? [];

  const { data: statusData } = useQuery(GET_TRANSFER_STATUS_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });
  const statuses = statusData?.getTransferStatusList ?? [];

  const [fetchReport, { data: reportData, loading }] = useLazyQuery(GET_INVENTORY_TRANSFER_REPORT_LIST_QUERY, {
    fetchPolicy: "network-only",
  });

  const buildInput = () => ({
    transferids: selectedTransferIds.length
      ? selectedTransferIds
      : transferid ? [Number(transferid)] : undefined,
    fromoutletid: fromoutletid ? Number(fromoutletid) : undefined,
    tooutletid: tooutletid ? Number(tooutletid) : undefined,
    transferstatusid: transferstatusid ? Number(transferstatusid) : undefined,
    requestedbyid: requestedbyid || undefined,
    transferbyid: transferbyid || undefined,
    fromdate: fromDate || undefined,
    todate: toDate || undefined,
  });

  const runSearch = () => {
    if (!parsedStoreId) return;
    fetchReport({ variables: { storeid: parsedStoreId, input: buildInput() } });
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedStoreId]);

  const rows: ReportRow[] = reportData?.getInventoryTransferReportList ?? [];
  const totalCost = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.totalcost) || 0), 0), [rows]);

  // Same "total by unit" / "total by category+unit" breakdown as the invoice print —
  // Pc and Wt are different kinds of quantity, so they're never summed together.
  const numFmt = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(3));
  const unitTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const unit = r.itemunit || "Pc";
      m.set(unit, (m.get(unit) ?? 0) + (Number(r.transferquantity) || 0));
    }
    return m;
  }, [rows]);
  const categoryTotals = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const r of rows) {
      const unit = r.itemunit || "Pc";
      const cat = r.categoryname || "Uncategorized";
      const catMap = m.get(cat) ?? new Map<string, number>();
      catMap.set(unit, (catMap.get(unit) ?? 0) + (Number(r.transferquantity) || 0));
      m.set(cat, catMap);
    }
    return m;
  }, [rows]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await api.post(
        "/store/inventory-transfer/report/print",
        { storeid: parsedStoreId, ...buildInput() },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch (err: unknown) {
      let msg = "Failed to generate inventory transfer report PDF";
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
          width: "min(1200px, 96vw)", height: "min(90vh, 820px)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Inventory Transfer Report</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left — Filters */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ marginBottom: 14 }}>
                <ControlLabel>Transfer ID</ControlLabel>
                {selectedTransferIds.length > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, background: "#eef2ff" }}>
                    <span style={{ fontSize: 11.5, color: "#1e293b", fontWeight: 600 }}>
                      {selectedTransferIds.length} selected: #{selectedTransferIds.join(", #")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTransferIds([])}
                      style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <input type="number" style={inputStyle} value={transferid} onChange={(e) => setTransferid(e.target.value)} placeholder="Any" />
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>From Outlet</ControlLabel>
                <select className="form-select" style={inputStyle} value={fromoutletid} onChange={(e) => setFromoutletid(e.target.value)}>
                  <option value="">All</option>
                  {outlets.map((o: { outletid: number; outletname: string }) => (
                    <option key={o.outletid} value={o.outletid}>{o.outletname}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>To Outlet</ControlLabel>
                <select className="form-select" style={inputStyle} value={tooutletid} onChange={(e) => setTooutletid(e.target.value)}>
                  <option value="">All</option>
                  {outlets.map((o: { outletid: number; outletname: string }) => (
                    <option key={o.outletid} value={o.outletid}>{o.outletname}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>Status</ControlLabel>
                <select className="form-select" style={inputStyle} value={transferstatusid} onChange={(e) => setTransferstatusid(e.target.value)}>
                  <option value="">All</option>
                  {statuses.map((s: { transferstatusid: number; statusname: string }) => (
                    <option key={s.transferstatusid} value={s.transferstatusid}>{s.statusname}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>Requested By</ControlLabel>
                <SelectEmployee storeId={parsedStoreId} value={requestedbyid ?? null} onChange={(val: number) => setRequestedbyid(val || undefined)} placeholder="All" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>Transfer By</ControlLabel>
                <SelectEmployee storeId={parsedStoreId} value={transferbyid ?? null} onChange={(val: number) => setTransferbyid(val || undefined)} placeholder="All" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>From Date</ControlLabel>
                <input type="date" style={inputStyle} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <ControlLabel>To Date</ControlLabel>
                <input type="date" style={inputStyle} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>

              <button
                onClick={runSearch}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
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
                  <span style={{ fontSize: 13, color: "#64748b" }}>Loading transfers...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", minHeight: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Inventory Transfer Report</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
                {fromDate && toDate ? `${fromDate} to ${toDate}` : "All time"} · {rows.length} line item{rows.length === 1 ? "" : "s"}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
                    <th style={{ padding: "6px 6px" }}>Transfer #</th>
                    <th style={{ padding: "6px 6px" }}>Date</th>
                    <th style={{ padding: "6px 6px" }}>Status</th>
                    <th style={{ padding: "6px 6px" }}>From</th>
                    <th style={{ padding: "6px 6px" }}>To</th>
                    <th style={{ padding: "6px 6px" }}>Item Code</th>
                    <th style={{ padding: "6px 6px" }}>Description</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Req Qty</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Xfer Qty</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Recv Qty</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Unit Cost</th>
                    <th style={{ padding: "6px 6px", textAlign: "right" }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.inventoryitemtransferid}-${i}`} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 1 ? "#f8fafc" : "#fff" }}>
                      <td style={{ padding: "5px 6px" }}>{r.inventoryitemtransferid}</td>
                      <td style={{ padding: "5px 6px" }}>{r.transferdatetime ? dayjs(r.transferdatetime).format("MM/DD/YYYY") : ""}</td>
                      <td style={{ padding: "5px 6px" }}>{r.transferstatus}</td>
                      <td style={{ padding: "5px 6px" }}>{r.fromwarehousename}</td>
                      <td style={{ padding: "5px 6px" }}>{r.towarehousename}</td>
                      <td style={{ padding: "5px 6px" }}>{r.itemcode}</td>
                      <td style={{ padding: "5px 6px" }}>{r.itemdescription}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.quantityrequest || 0).toFixed(2)}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.transferquantity || 0).toFixed(2)}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.quantityreceived || 0).toFixed(2)}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.unitprice || 0).toFixed(2)}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.unitcost || 0).toFixed(2)}</td>
                      <td style={{ padding: "5px 6px", textAlign: "right" }}>{Number(r.totalcost || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={13} style={{ padding: "20px 8px", textAlign: "center", color: "#94a3b8" }}>
                        No transfers found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 700 }}>
                      <td colSpan={12} style={{ padding: "8px" }}>Total Cost</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{totalCost.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {rows.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                    Total: {Array.from(unitTotals.entries()).map(([u, q]) => `${numFmt(q)} ${u}`).join("   ·   ")}
                  </div>
                  {categoryTotals.size > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                        Totals by Category
                      </div>
                      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
                        {Array.from(categoryTotals.entries()).map(([cat, unitMap]) =>
                          Array.from(unitMap.entries()).map(([u, q]) => (
                            <span key={`${cat}-${u}`} style={{ marginRight: 14 }}>
                              {cat}: {numFmt(q)} {u}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename="inventory-transfer-report.pdf"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </>,
    document.body
  );
};

export default InventoryTransferReportModal;
