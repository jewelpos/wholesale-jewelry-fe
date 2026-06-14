"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, RowStyle } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_SUPPLIER_LEDGER_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierLedgerListType } from "@/types/supplier";
import { supplierLedgerColumnDefs } from "./ColumnDef";
import POSGridClient from "../../grid/POSGridClient";
import SupplierLedgerActivityHeader from "./SupplierLedgerActivityHeader";
import SelectSupplier from "@/components/forms/SelectSupplier";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useParams } from "next/navigation";
import ReportMiniChart from "@/components/ui/reports/shared/ReportMiniChart";
import "ag-grid-enterprise";

const OB_CODE = "__OB__";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyRow = (override: Partial<SupplierLedgerListType>): SupplierLedgerListType =>
  ({
    supplierid: 0,
    ledgerdate: null,
    ledgerid: 0,
    ledgercode: "",
    ledgerdescription: "",
    ledamountdebit: 0,
    ledamountcredit: 0,
    running_balance: null,
    ledgerreference: "",
    ledgerbankid: null,
    warehousename: "",
    warehouseid: null,
    outletid: 0,
    ...override,
  } as unknown as SupplierLedgerListType);

const SupplierLedgerActitvityComponent = () => {
  const [getSupplierLedgerList] = useLazyQuery(GET_SUPPLIER_LEDGER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<SupplierLedgerListType[]>([]);
  const [pinnedTopRow, setPinnedTopRow] = useState<SupplierLedgerListType[]>([]);
  const [pinnedBottomRow, setPinnedBottomRow] = useState<SupplierLedgerListType[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [supplierid, setSupplierid] = useState<number | null>(null);
  const [fromdate, setFromdate] = useState<Dayjs | null>(null);
  const [todate, setTodate] = useState<Dayjs | null>(null);

  const handleOnGridReady = (params: GridReadyEvent<SupplierLedgerListType>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchLedger = useCallback(
    async (sid: number | null, from: Dayjs | null, to: Dayjs | null) => {
      if (!sid) return;

      setLoading(true);
      const filters: object[] = [
        { key: "supplierid", value: { filterType: "number", type: "equals", filter: String(sid) } },
      ];

      if (from && to) {
        filters.push({
          key: "ledgerdate",
          value: { filterType: "date", type: "inRange", dateFrom: from.format("YYYY-MM-DD"), dateTo: to.format("YYYY-MM-DD") },
        });
      } else if (from) {
        filters.push({
          key: "ledgerdate",
          value: { filterType: "date", type: "greaterThanOrEqual", dateFrom: from.format("YYYY-MM-DD") },
        });
      } else if (to) {
        filters.push({
          key: "ledgerdate",
          value: { filterType: "date", type: "lessThanOrEqual", dateTo: to.format("YYYY-MM-DD") },
        });
      }

      const result = await handleTryCatch(async () => {
        const { data } = await getSupplierLedgerList({
          variables: {
            outletid: parsedOutletId,
            page: 1,
            perpage: 10000,
            filters,
            sortModel: [{ colId: "ledgerdate", sort: "asc" }],
            rowGroupCols: [],
            groupKeys: [],
          },
        });

        const rows: SupplierLedgerListType[] = data?.getSupplierLedgerList?.data ?? [];

        // Compute opening balance from the first row's running balance minus its net movement
        const ob =
          rows.length > 0
            ? Number(rows[0].running_balance ?? 0) -
              Number(rows[0].ledamountdebit ?? 0) +
              Number(rows[0].ledamountcredit ?? 0)
            : 0;

        const totalDebits = rows.reduce((s, r) => s + Number(r.ledamountdebit ?? 0), 0);
        const totalCredits = rows.reduce((s, r) => s + Number(r.ledamountcredit ?? 0), 0);
        const closingBal =
          rows.length > 0 ? Number(rows[rows.length - 1].running_balance ?? 0) : ob;

        setRowData(rows);
        setOpeningBalance(ob);

        setPinnedTopRow(
          from
            ? [
                emptyRow({
                  ledgercode: OB_CODE,
                  ledgerdescription: "Opening Balance",
                  running_balance: ob,
                  outletid: parsedOutletId,
                }),
              ]
            : []
        );

        setPinnedBottomRow(
          rows.length > 0
            ? [
                emptyRow({
                  ledgerdescription: "TOTAL",
                  ledamountdebit: totalDebits,
                  ledamountcredit: totalCredits,
                  running_balance: closingBal,
                }),
              ]
            : []
        );

        return true;
      });

      setLoading(false);
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    },
    [getSupplierLedgerList, parsedOutletId, dispatch]
  );

  useEffect(() => {
    fetchLedger(supplierid, fromdate, todate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierid, fromdate, todate]);

  const closingBalance: number =
    rowData.length > 0 ? Number(rowData[rowData.length - 1].running_balance ?? 0) : openingBalance;

  const trendLabels = rowData.map((r) =>
    r.ledgerdate ? dayjs(r.ledgerdate.toString()).format("MM/DD") : ""
  );
  const trendValues = rowData.map((r) => Number(r.running_balance ?? 0));

  const handleExport = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `supplier-ledger-${supplierid}-${Date.now()}.csv`,
    });
  }, [supplierid]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <SupplierLedgerActivityHeader onExport={supplierid ? handleExport : undefined} />
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {/* Filter bar */}
          <div className="row mb-3 g-2 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                Supplier <span className="text-danger">*</span>
              </label>
              <SelectSupplier
                storeId={parsedStoreId}
                value={supplierid}
                onChangeAdditional={(val: number) => setSupplierid(val ?? null)}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                From Date
              </label>
              <DatePicker
                format="MM/DD/YYYY"
                className="form-control p-0"
                style={{ height: 38 }}
                value={fromdate}
                onChange={(d) => setFromdate(d)}
                allowClear
                disabledDate={(d) => (todate ? d.isAfter(todate) : false)}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                To Date
              </label>
              <DatePicker
                format="MM/DD/YYYY"
                className="form-control p-0"
                style={{ height: 38 }}
                value={todate}
                onChange={(d) => setTodate(d)}
                allowClear
                disabledDate={(d) => (fromdate ? d.isBefore(fromdate) : false)}
              />
            </div>
            {supplierid && (
              <div className="col-lg-2 col-md-6">
                <button
                  className="btn btn-secondary btn-sm w-100"
                  onClick={() => {
                    setSupplierid(null);
                    setFromdate(null);
                    setTodate(null);
                    setRowData([]);
                    setPinnedTopRow([]);
                    setPinnedBottomRow([]);
                    setOpeningBalance(0);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Summary cards */}
          {supplierid && (
            <div className="row g-2 mb-3" style={{ fontSize: 13 }}>
              {fromdate && (
                <div className="col-6 col-md-3 col-lg-2">
                  <div className="border rounded p-2 text-center" style={{ background: "#f0f4ff" }}>
                    <div className="text-muted" style={{ fontSize: 11 }}>Opening Balance</div>
                    <div style={{ fontWeight: 700 }}>{fmt(openingBalance)}</div>
                  </div>
                </div>
              )}
              <div className="col-6 col-md-3 col-lg-2">
                <div
                  className="border rounded p-2 text-center"
                  style={{ background: closingBalance < 0 ? "#fff0f0" : "#f0f8ff" }}
                >
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {fromdate || todate ? "Period Closing Balance" : "Ledger Balance"}
                  </div>
                  <div
                    style={{ fontWeight: 700, color: closingBalance < 0 ? "#dc3545" : undefined }}
                  >
                    {fmt(closingBalance)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Running balance trendline */}
          {supplierid && rowData.length > 0 && (
            <ReportMiniChart
              labels={trendLabels}
              values={trendValues}
              title="Running Balance Trend"
              subtitle="Balance over time"
              color="#6366f1"
              type="area"
            />
          )}

          <div style={{ flex: 1, minHeight: 0 }}>
            {!supplierid ? (
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: "100%", fontSize: 14 }}
              >
                Select a supplier to view ledger activity
              </div>
            ) : (
              <POSGridClient
                ref={gridRef}
                columnDefs={supplierLedgerColumnDefs}
                onGridReady={handleOnGridReady}
                rowData={rowData}
                loading={loading}
                pinnedTopRowData={pinnedTopRow}
                pinnedBottomRowData={pinnedBottomRow}
                rowGroupPanelShow="never"
                fillHeight
                defaultColDef={{
                  filter: true,
                  floatingFilter: true,
                  sortable: false,
                  enableRowGroup: false,
                }}
                getRowStyle={(params): RowStyle | undefined => {
                  if (params.data?.ledgercode === OB_CODE)
                    return { background: "#f0f4ff", fontWeight: "bold", fontStyle: "italic" };
                  if (params.node.rowPinned === "bottom")
                    return { background: "#f8f9fa", fontWeight: "bold" };
                  return undefined;
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedgerActitvityComponent;
