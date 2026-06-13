"use client";

import React, { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerCheckAppliedAmount, CustomerPaymentListType } from "@/types/customer";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

interface Props {
  data: CustomerPaymentListType;
}

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomerAppliedPaymentComponent = ({ data }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const [getCustomerAppliedAmountList] = useLazyQuery(GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY);
  const [rows, setRows] = useState<CustomerCheckAppliedAmount[]>([]);
  const [loading, setLoading] = useState(false);

  const parsedPaymentsId = parseInt(String(data.transactionno), 10);
  const totalApplied = rows.reduce((s, r) => s + (r.appliedamount || 0), 0);

  useEffect(() => {
    if (!parsedPaymentsId || !parsedStoreId) return;
    setLoading(true);
    handleTryCatch(async () => {
      const { data: res } = await getCustomerAppliedAmountList({
        variables: { storeid: parsedStoreId, customerpaymentsid: parsedPaymentsId },
      });
      setRows(res?.getCustomerAppliedAmountList ?? []);
      return true;
    }).then((result) => {
      setLoading(false);
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedPaymentsId, parsedStoreId]);

  return (
    <div style={{ padding: "10px 16px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
      {/* Detail header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid #cbd5e1",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
          Applied Invoices — Txn #{data.transactionno}
          <span style={{ fontWeight: 400, color: "#64748b", marginLeft: 8 }}>
            {data.custcompanyname}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#334155" }}>
          Total Applied:{" "}
          <strong style={{ color: totalApplied > 0 ? "#166534" : undefined }}>{fmt(totalApplied)}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>Loading...</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>No applied invoices found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#e8edf3" }}>
              {["Invoice #", "Applied Date", "Amount", "Type", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #cbd5e1",
                    textAlign: h === "Amount" ? "right" : "left",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    color: "#475569",
                    letterSpacing: "0.03em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const voided = !!row.isvoided;
              return (
                <tr
                  key={i}
                  style={{
                    background: voided ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#f8fafc",
                    opacity: voided ? 0.7 : 1,
                  }}
                >
                  <td style={{ padding: "4px 10px", border: "1px solid #e2e8f0", color: voided ? "#9ca3af" : undefined, textDecoration: voided ? "line-through" : undefined }}>
                    {row.invoicenumber}
                  </td>
                  <td style={{ padding: "4px 10px", border: "1px solid #e2e8f0", whiteSpace: "nowrap", color: voided ? "#9ca3af" : undefined }}>
                    {row.applieddate ? dayjs(row.applieddate).format("MM/DD/YYYY") : ""}
                  </td>
                  <td style={{ padding: "4px 10px", border: "1px solid #e2e8f0", textAlign: "right", color: voided ? "#9ca3af" : "#166534", fontWeight: 600 }}>
                    {fmt(row.appliedamount)}
                  </td>
                  <td style={{ padding: "4px 10px", border: "1px solid #e2e8f0" }}>
                    {row.iscreditinvoice ? (
                      <span style={{ fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                        Credit
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                        Payment
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "4px 10px", border: "1px solid #e2e8f0" }}>
                    {voided ? (
                      <span style={{ fontSize: 11, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                        Voided
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f1f5f9" }}>
              <td colSpan={2} style={{ padding: "5px 10px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "#475569" }}>
                Total
              </td>
              <td style={{ padding: "5px 10px", border: "1px solid #cbd5e1", textAlign: "right", fontWeight: 700, color: "#166534" }}>
                {fmt(totalApplied)}
              </td>
              <td colSpan={2} style={{ border: "1px solid #cbd5e1" }} />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

export default CustomerAppliedPaymentComponent;
