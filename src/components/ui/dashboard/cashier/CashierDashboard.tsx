"use client";
import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DollarSign, TrendingUp, BarChart2, FileText, Plus } from "lucide-react";
import { useAppSelector } from "@/lib/store/hook";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { GET_SALES_INVOICE_LIST_QUERY } from "@/lib/graphql/query/sales";
import {
  num,
  formatCurrency,
  formatPct,
  MONTH_KEYS,
  MONTH_LABELS,
  currentYear,
  yearFilter,
  PRISM,
} from "@/components/ui/dashboard/admin/utils";

const NO_FILTER: never[] = [];

type EmpRow = Record<string, number | string | undefined>;

type InvoiceRow = {
  invoicenumber?: string;
  companyname?: string;
  saledate?: string;
  netamount?: number;
  statusname?: string;
  salemodename?: string;
};

const Tile = ({
  label,
  value,
  sub,
  accent,
  Icon,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  Icon: React.ElementType;
  loading: boolean;
}) => (
  <div className="col" style={{ minWidth: 160 }}>
    <div
      className="h-100 p-3"
      style={{
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: accent + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={accent} />
        </div>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
        }}
      >
        {loading ? (
          <span className="text-muted" style={{ fontSize: 14 }}>
            —
          </span>
        ) : (
          value
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

const statusStyle = (status?: string) => {
  if (status === "Paid")
    return { background: "#dcfce7", color: "#16a34a" };
  if (status === "Void")
    return { background: "#fee2e2", color: "#dc2626" };
  return { background: "#fef3c7", color: "#d97706" };
};

const CashierDashboard = () => {
  const params = useParams();
  const storeId = parseInt(params.storeId as string, 10);
  const outletId = parseInt(params.outletId as string, 10);
  const user = useAppSelector((state) => state.user.data);
  const year = currentYear;

  const now = new Date();
  const curMonthIdx = now.getMonth();
  const prevMonthIdx = curMonthIdx === 0 ? 11 : curMonthIdx - 1;
  const curMonthKey = MONTH_KEYS[curMonthIdx];
  const prevMonthKey = MONTH_KEYS[prevMonthIdx];
  const curMonthLabel = MONTH_LABELS[curMonthIdx];
  const prevMonthLabel = MONTH_LABELS[prevMonthIdx];

  const { data: whData } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: outletId },
    skip: !outletId,
  });
  const warehouseId: number | null =
    whData?.getWarehousesByOutletId?.[0]?.warehouseid ?? null;
  const warehouseReady = warehouseId !== null;

  const { data: empData, loading: empLoading } = useQuery(
    GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY,
    {
      variables: {
        storeid: storeId,
        outletid: outletId,
        warehouseid: warehouseId,
        page: 1,
        perpage: 2000,
        filters: yearFilter(year),
        sortModel: NO_FILTER,
        rowGroupCols: NO_FILTER,
        groupKeys: NO_FILTER,
      },
      skip: !warehouseReady,
    }
  );

  const { data: invoiceData, loading: invoiceLoading } = useQuery(
    GET_SALES_INVOICE_LIST_QUERY,
    {
      variables: {
        outletid: outletId,
        page: 1,
        perpage: 15,
        filters: NO_FILTER,
        sortModel: [{ colId: "saledate", sort: "desc" }],
        rowGroupCols: NO_FILTER,
        groupKeys: NO_FILTER,
      },
      skip: !outletId,
    }
  );

  const allEmpRows: EmpRow[] = empData?.getMonthlyEmployeeSalesPivot?.data ?? [];
  const myRows = useMemo(
    () => allEmpRows.filter((r) => r.employeename === user?.name),
    [allEmpRows, user?.name]
  );

  const myYtd = myRows.reduce((s, r) => s + num(r.total_sales as number), 0);
  const myProfit = myRows.reduce((s, r) => s + num(r.total_profit as number), 0);
  const myMargin = myYtd > 0 ? (myProfit / myYtd) * 100 : 0;
  const myThisMonth = myRows.reduce(
    (s, r) => s + num(r[curMonthKey] as number),
    0
  );
  const myLastMonth = myRows.reduce(
    (s, r) => s + num(r[prevMonthKey] as number),
    0
  );

  const invoiceRows: InvoiceRow[] = invoiceData?.getInvoiceList?.data ?? [];

  const basePath = `/jw/${params.storeId}/${params.outletId}`;

  return (
    <div>
      {/* Header */}
      <div
        className="mb-4 px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, #064e3b 0%, #059669 55%, #0e7490 100%)",
          borderRadius: "var(--radius-card)",
          color: "#fff",
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 style={{ fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
              My Sales Dashboard
            </h4>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              {user?.name} · {year} Performance
            </div>
          </div>
          <Link
            href={`${basePath}/sales/new_invoice`}
            className="btn"
            style={{
              backgroundColor: "#fff",
              color: "#059669",
              fontWeight: 700,
              fontSize: 13,
              padding: "8px 20px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={14} />
            New Sale
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
        <Tile
          label={`${curMonthLabel} Sales`}
          value={formatCurrency(myThisMonth)}
          sub={`${prevMonthLabel}: ${formatCurrency(myLastMonth)}`}
          accent={PRISM.indigo}
          Icon={DollarSign}
          loading={empLoading}
        />
        <Tile
          label="YTD Sales"
          value={formatCurrency(myYtd)}
          sub={`Profit: ${formatCurrency(myProfit)}`}
          accent={PRISM.emerald}
          Icon={TrendingUp}
          loading={empLoading}
        />
        <Tile
          label="Profit Margin"
          value={formatPct(myMargin)}
          sub={myMargin >= 30 ? "✓ On target" : "Below target"}
          accent={PRISM.teal}
          Icon={BarChart2}
          loading={empLoading}
        />
        <Tile
          label="Recent Invoices"
          value={invoiceLoading ? "—" : String(invoiceRows.length)}
          sub="Showing last 15 at outlet"
          accent={PRISM.amber}
          Icon={FileText}
          loading={invoiceLoading}
        />
      </div>

      {/* My Monthly Summary */}
      <div
        className="card mb-4"
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--surface-card)",
        }}
      >
        <div className="card-body">
          <h6 className="mb-3">My Monthly Sales · {year}</h6>
          {empLoading ? (
            <div className="text-muted text-center py-3" style={{ fontSize: 12 }}>
              Loading…
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-sm align-middle mb-0"
                style={{ fontSize: 12 }}
              >
                <thead style={{ fontSize: 11 }}>
                  <tr>
                    {MONTH_LABELS.map((m) => (
                      <th key={m} className="text-end">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {MONTH_KEYS.map((mk) => {
                      const val = myRows.reduce(
                        (s, r) => s + num(r[mk] as number),
                        0
                      );
                      return (
                        <td
                          key={mk}
                          className="text-end"
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: mk === curMonthKey ? 700 : 400,
                            color:
                              mk === curMonthKey ? PRISM.emerald : undefined,
                          }}
                        >
                          {formatCurrency(val)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className="card"
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--surface-card)",
        }}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="mb-0">Recent Transactions</h6>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Last 15 invoices at this outlet
              </div>
            </div>
            <Link
              href={`${basePath}/sales/list`}
              style={{ fontSize: 12, color: PRISM.indigo }}
            >
              View all →
            </Link>
          </div>
          {invoiceLoading && (
            <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
              Loading…
            </div>
          )}
          {!invoiceLoading && invoiceRows.length === 0 && (
            <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
              No recent transactions.
            </div>
          )}
          {!invoiceLoading && invoiceRows.length > 0 && (
            <div className="table-responsive">
              <table
                className="table table-sm align-middle mb-0"
                style={{ fontSize: 12 }}
              >
                <thead style={{ fontSize: 11 }}>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th className="text-end">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((inv) => (
                    <tr key={inv.invoicenumber}>
                      <td>
                        <Link
                          href={`${basePath}/sales/${inv.invoicenumber}/view`}
                          style={{
                            fontWeight: 600,
                            color: PRISM.indigo,
                            fontSize: 12,
                          }}
                        >
                          {inv.invoicenumber}
                        </Link>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {inv.companyname || "—"}
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {inv.saledate?.split("T")[0] ?? "—"}
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {inv.salemodename || "—"}
                      </td>
                      <td
                        className="text-end"
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(num(inv.netamount))}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "1px 8px",
                            borderRadius: 20,
                            ...statusStyle(inv.statusname),
                          }}
                        >
                          {inv.statusname || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
