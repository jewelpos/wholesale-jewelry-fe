"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { GET_CASH_DRAWER_SESSION_QUERY } from "@/lib/graphql/query/sales";
import { OPEN_CASH_DRAWER_MUTATION, CLOSE_CASH_DRAWER_MUTATION } from "@/lib/graphql/mutations/cashDrawer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { formatCurrency } from "@/components/ui/dashboard/admin/utils";
import PageHeader from "@/components/ui/PageHeader";
import ActionFooter from "@/components/ui/ActionFooter";

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

interface DrawerSession {
  id: number;
  outletid: number;
  date: string;
  openedby: number;
  openingfloat: number;
  expectedclosing: number | null;
  actualclosing: number | null;
  variance: number | null;
  status: string;
  notes: string | null;
  openedat: string;
  closedat: string | null;
}

const InfoRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
    <span style={{ fontWeight: highlight ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>{value}</span>
  </div>
);

const CashDrawerComponent = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const storeid = parseInt(storeIdParam as string, 10);
  const outletid = parseInt(outletIdParam as string, 10);

  const [date, setDate] = useState(todayStr());
  const [openingFloat, setOpeningFloat] = useState("");
  const [actualClosing, setActualClosing] = useState("");
  const [notes, setNotes] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);

  const { data, loading, refetch } = useQuery(GET_CASH_DRAWER_SESSION_QUERY, {
    variables: { storeid, outletid, date },
    skip: !storeid || !outletid,
    fetchPolicy: "network-only",
  });

  const session: DrawerSession | null = data?.getCashDrawerSession ?? null;

  const [openDrawer, { loading: opening }] = useMutation(OPEN_CASH_DRAWER_MUTATION);
  const [closeDrawer, { loading: closing }] = useMutation(CLOSE_CASH_DRAWER_MUTATION);

  const handleOpen = async () => {
    const float = parseFloat(openingFloat);
    if (isNaN(float) || float < 0) {
      dispatch(showNotification({ message: "Please enter a valid opening float", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    try {
      await openDrawer({ variables: { storeid, outletid, openingfloat: float, date } });
      dispatch(showNotification({ message: "Cash drawer opened", type: NOTIFICATION_TYPES.SUCCESS }));
      setOpeningFloat("");
      refetch();
    } catch (err: any) {
      dispatch(showNotification({ message: err?.message ?? "Failed to open cash drawer", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleClose = async () => {
    const actual = parseFloat(actualClosing);
    if (isNaN(actual) || actual < 0) {
      dispatch(showNotification({ message: "Please enter a valid actual cash count", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    try {
      await closeDrawer({ variables: { storeid, outletid, actualclosing: actual, notes: notes || undefined, date } });
      dispatch(showNotification({ message: "Cash drawer closed", type: NOTIFICATION_TYPES.SUCCESS }));
      setActualClosing("");
      setNotes("");
      setShowCloseForm(false);
      refetch();
    } catch (err: any) {
      dispatch(showNotification({ message: err?.message ?? "Failed to close cash drawer", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <>
        <PageHeader
          title="Cash Drawer"
          subtitle="Track opening float and daily cash reconciliation"
          rightSection={
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted fw-semibold mb-0" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                max={todayStr()}
                onChange={(e) => { setDate(e.target.value); setShowCloseForm(false); }}
                style={{ width: 150 }}
              />
            </div>
          }
        />

        {loading && (
          <div className="text-muted text-center py-5" style={{ fontSize: 14 }}>Loading…</div>
        )}

        {/* No session — open drawer */}
        {!loading && !session && (
          <div className="row">
            <div className="col-md-5 col-lg-4">
              <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Open Cash Drawer</h6>
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>Enter opening float for {date}</div>
                </div>
                <div className="card-body p-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Opening Float ($)</label>
                    <input type="number" min="0" step="0.01" className="form-control" placeholder="0.00"
                      value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} />
                  </div>
                  <button className="btn btn-primary w-100" onClick={handleOpen} disabled={opening || !openingFloat}>
                    {opening ? "Opening…" : "Open Cash Drawer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session open */}
        {!loading && session && session.status === "open" && (
          <div className="row g-3">
            <div className="col-md-4 col-lg-3">
              <div className="card h-100" style={{ border: "2px solid #10b981", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                <div className="card-header d-flex align-items-center justify-content-between py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Session Status</h6>
                  <span className="badge" style={{ backgroundColor: "#d1fae5", color: "#065f46", fontSize: 11 }}>OPEN</span>
                </div>
                <div className="card-body p-3">
                  <InfoRow label="Date"          value={date} />
                  <InfoRow label="Opening Float" value={formatCurrency(session.openingfloat)} />
                  <InfoRow label="Opened At"     value={session.openedat?.replace("T", " ").substring(0, 16) ?? "—"} />
                </div>
              </div>
            </div>

            <div className="col-md-8 col-lg-9">
              <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Close Cash Drawer</h6>
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>Count the cash and enter the actual amount below</div>
                </div>
                <div className="card-body p-3">
                  {!showCloseForm ? (
                    <div className="d-flex align-items-center pt-2">
                      <button className="btn btn-outline-danger" onClick={() => setShowCloseForm(true)}>
                        <i className="fas fa-lock me-2" />Close Cash Drawer
                      </button>
                    </div>
                  ) : (
                    <div className="row g-3 align-items-end">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Actual Cash in Drawer ($)</label>
                        <input type="number" min="0" step="0.01" className="form-control" placeholder="0.00"
                          value={actualClosing} onChange={(e) => setActualClosing(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Notes (optional)</label>
                        <input type="text" className="form-control" placeholder="Any discrepancy notes…"
                          value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>
                      <div className="col-md-2 d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowCloseForm(false)}>Cancel</button>
                        <button className="btn btn-danger btn-sm" onClick={handleClose} disabled={closing || !actualClosing}>
                          {closing ? "Closing…" : "Confirm"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session closed — reconciliation */}
        {!loading && session && session.status === "closed" && (
          <div className="row g-3">
            <div className="col-md-5 col-lg-4">
              <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                <div className="card-header d-flex align-items-center justify-content-between py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Reconciliation Summary</h6>
                  <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#64748b", fontSize: 11 }}>CLOSED</span>
                </div>
                <div className="card-body p-3">
                  <InfoRow label="Opening Float"   value={formatCurrency(session.openingfloat)} />
                  <InfoRow label="Cash Sales"       value={formatCurrency((session.expectedclosing ?? 0) - session.openingfloat)} />
                  <InfoRow label="Expected Closing" value={formatCurrency(session.expectedclosing ?? 0)} highlight />
                  <InfoRow label="Actual Count"     value={formatCurrency(session.actualclosing ?? 0)} highlight />

                  <div className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Variance</span>
                    <span style={{
                      padding: "3px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                      backgroundColor: (session.variance ?? 0) >= 0 ? "#d1fae5" : "#fee2e2",
                      color: (session.variance ?? 0) >= 0 ? "#065f46" : "#991b1b",
                    }}>
                      {(session.variance ?? 0) >= 0 ? "+" : ""}{formatCurrency(session.variance ?? 0)}
                    </span>
                  </div>

                  {session.notes && (
                    <div className="mt-3 p-3" style={{ backgroundColor: "#fef9c3", borderRadius: 8, fontSize: 12 }}>
                      <strong>Notes:</strong> {session.notes}
                    </div>
                  )}

                  <div className="text-muted mt-3" style={{ fontSize: 11 }}>
                    Opened: {session.openedat?.replace("T", " ").substring(0, 16)}
                    {session.closedat && <> · Closed: {session.closedat?.replace("T", " ").substring(0, 16)}</>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <ActionFooter handleCancel={() => router.back()}>
          <></>
        </ActionFooter>
    </>
  );
};

export default CashDrawerComponent;
