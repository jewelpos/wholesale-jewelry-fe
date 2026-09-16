"use client";

import React, { useState } from "react";
import { Printer } from "react-feather";
import api from "@/lib/axios";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import OutletsFilter from "@/components/ui/grid/OutletsFilter";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import useOutlets from "@/hooks/useOutlets";

interface Props {
  storeid: number;
  defaultDate: string;
  onClose: () => void;
}

/**
 * Print dialog for the Day End dashboard report — a date range + outlet (defaulting
 * to the report's current single-day view), generating one PDF with a Day End section
 * per day in that range. See generateDayEndReportPdf in store.service.ts.
 */
const DayEndReportPrintModal = ({ storeid, defaultDate, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const { fetchOutletsList, outlets, loading: outletsLoading } = useOutlets();
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [outletid, setOutletid] = useState<number | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const invalidRange = !fromDate || !toDate || fromDate > toDate;

  const handleGenerate = async () => {
    if (invalidRange) return;
    setGenerating(true);
    try {
      const response = await api.post(
        "/store/day-end-report/print",
        { storeid, outletid, fromdate: fromDate, todate: toDate },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      setPdfUrl(url);
    } catch {
      dispatch(showNotification({ message: "Failed to generate day end report PDF", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setGenerating(false);
    }
  };

  if (pdfUrl) {
    return (
      <PdfPreviewModal
        pdfUrl={pdfUrl}
        filename={`day-end-report-${fromDate}-to-${toDate}.pdf`}
        onClose={() => { setPdfUrl(null); onClose(); }}
      />
    );
  }

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99999 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Printer size={16} />
              Print Day End Report
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3" style={{ fontSize: 12.5 }}>
              Prints one Day End section per day in the selected range.
            </p>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>From Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>To Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Outlet</label>
                <OutletsFilter
                  fetchOutletsList={fetchOutletsList}
                  outlets={outlets}
                  loading={outletsLoading}
                  setSelectedOutlet={setOutletid}
                  selectedOutlet={outletid}
                  autoSelectCurrentOutlet={false}
                />
                <div className="text-muted mt-1" style={{ fontSize: 11 }}>Leave as "All" to include every outlet you have access to.</div>
              </div>
            </div>
            {invalidRange && (
              <div className="text-danger mt-2" style={{ fontSize: 12 }}>From Date must be on or before To Date.</div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose} disabled={generating}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-submit d-flex align-items-center gap-2"
              onClick={handleGenerate}
              disabled={invalidRange || generating}
            >
              <Printer size={14} />
              {generating ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayEndReportPrintModal;
