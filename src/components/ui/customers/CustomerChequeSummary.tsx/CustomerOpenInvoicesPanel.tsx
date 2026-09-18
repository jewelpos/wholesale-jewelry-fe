"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY, GET_CUSTOMER_CHEQUE_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CHECK_STATUS } from "@/lib/config/constants";

interface Props {
  storeId: number;
  customerId: number | string;
  /** Invoice # is still a plain, freely-typed field — clicking a row here is just a
   * shortcut that fills it in, never a requirement. */
  onPick: (invoiceNumber: string) => void;
}

type FilterMode = "pending" | "received" | "all";

// A voided/cancelled check entry never really happened — it shouldn't count as "this
// invoice already has a check" the way an on-hand, held, deposited, or even bounced
// one would.
const VOIDED_CHECK_STATUSES: string[] = [CHECK_STATUS.VOID_CHECK, CHECK_STATUS.CANCEL_CHECK];

// Reference-only panel shown under a check row once its customer is picked — lets
// staff see the customer's actual open invoices and balances instead of a long,
// hard-to-scan dropdown (which is what a many-invoice customer turned into), and
// cross-references those invoices against checks already entered for this customer so
// staff can jump straight to the ones still waiting on a check. The Invoice # field
// itself stays a plain optional text input; this is just context.
const CustomerOpenInvoicesPanel = ({ storeId, customerId, onPick }: Props) => {
  const [filterMode, setFilterMode] = useState<FilterMode>("pending");

  const { data, loading } = useQuery(GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY, {
    variables: { storeid: Number(storeId), customerid: Number(customerId) },
    skip: !storeId || !customerId,
    fetchPolicy: "cache-first",
  });

  const { data: checkData, loading: checksLoading } = useQuery(GET_CUSTOMER_CHEQUE_LIST_QUERY, {
    variables: {
      storeid: Number(storeId),
      customerid: Number(customerId),
      page: 1,
      perpage: 500,
      filters: [],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !storeId || !customerId,
    fetchPolicy: "cache-first",
  });

  const invoices: Array<{
    invoicenumber: number;
    balancedue: number;
    saledate?: string | null;
    warehousename?: string | null;
  }> = data?.getCustomerBalanceDueInvoices ?? [];

  // Invoice numbers that already have at least one non-voided check tagged to them.
  const invoicesWithChecks = useMemo(() => {
    const rows: Array<{ chkinvoiceno: number | string | null; checkstatus: string }> =
      checkData?.getCustomerChequeList?.data ?? [];
    const set = new Set<string>();
    for (const r of rows) {
      if (!r.chkinvoiceno) continue;
      if (VOIDED_CHECK_STATUSES.includes(r.checkstatus)) continue;
      set.add(String(r.chkinvoiceno));
    }
    return set;
  }, [checkData]);

  const filteredInvoices = useMemo(() => {
    if (filterMode === "all") return invoices;
    return invoices.filter((inv) => {
      const hasCheck = invoicesWithChecks.has(String(inv.invoicenumber));
      return filterMode === "received" ? hasCheck : !hasCheck;
    });
  }, [invoices, invoicesWithChecks, filterMode]);

  const isLoading = loading || checksLoading;

  const filterBtnStyle = (mode: FilterMode): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
    border: "1px solid " + (filterMode === mode ? "#1d4ed8" : "#e2e8f0"),
    background: filterMode === mode ? "#1d4ed8" : "#fff",
    color: filterMode === mode ? "#fff" : "#64748b",
    cursor: "pointer",
  });

  return (
    <div>
      <div className="fw-semibold text-muted mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Open Invoices
      </div>

      <div className="d-flex gap-1 mb-2">
        <button type="button" style={filterBtnStyle("pending")} onClick={() => setFilterMode("pending")}>
          Checks Pending
        </button>
        <button type="button" style={filterBtnStyle("received")} onClick={() => setFilterMode("received")}>
          Checks Received
        </button>
        <button type="button" style={filterBtnStyle("all")} onClick={() => setFilterMode("all")}>
          All
        </button>
      </div>

      {isLoading && <div style={{ fontSize: 12, color: "#94a3b8" }}>Loading…</div>}
      {!isLoading && filteredInvoices.length === 0 && (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          {invoices.length === 0
            ? "No open balance-due invoices for this customer."
            : filterMode === "received"
              ? "None of this customer's open invoices have a check on file yet."
              : "Every open invoice already has a check on file."}
        </div>
      )}
      {!isLoading && filteredInvoices.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Click a row to fill Invoice #</div>
          <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ border: 0, padding: "2px 4px", color: "#64748b" }}>Invoice #</th>
                <th style={{ border: 0, padding: "2px 4px", color: "#64748b" }}>Date</th>
                <th style={{ border: 0, padding: "2px 4px", color: "#64748b", textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const hasCheck = invoicesWithChecks.has(String(inv.invoicenumber));
                return (
                  <tr
                    key={inv.invoicenumber}
                    onClick={() => onPick(String(inv.invoicenumber))}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    title={inv.warehousename ?? undefined}
                  >
                    <td style={{ padding: "3px 4px", fontWeight: 600 }}>
                      {inv.invoicenumber}
                      {filterMode === "all" && hasCheck && (
                        <span
                          title="A check is already on file for this invoice"
                          style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: "1px 5px" }}
                        >
                          ✓ check
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", color: "#64748b" }}>
                      {inv.saledate ? new Date(inv.saledate).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "right", fontWeight: 600, color: Number(inv.balancedue) < 0 ? "#16a34a" : "#0f172a" }}>
                      ${Number(inv.balancedue ?? 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default CustomerOpenInvoicesPanel;
