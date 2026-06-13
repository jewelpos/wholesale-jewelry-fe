"use client";

import React, { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_BALANCE_REPORT_QUERY, GET_CUSTOMER_LEDGER_REPORT_QUERY } from "@/lib/graphql/query/customer";
import LedgerPrintModal from "./LedgerPrintModal";
import { CustomerLedgerReportType } from "@/types/customer";
import "ag-grid-enterprise";
import { ledgerActivityColumnDefs } from "./ColumnDef";
import POSGridClient from "../../grid/POSGridClient";
import LedgerActivityHeader from "./LedgerActivityHeader";
import SelectCustomer from "@/components/forms/SelectCustomer";
import { DatePicker } from "antd";
import { Dayjs } from "dayjs";
import { useParams } from "next/navigation";

const OPENING_BALANCE_CODE = "__OB__";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyRow = (override: Partial<CustomerLedgerReportType>): CustomerLedgerReportType =>
  ({
    ledgercustid: null,
    customername: "",
    custcompanyname: "",
    ledgerdate: null,
    ledgerid: 0,
    ledgercode: "",
    ledgerdescription: "",
    ledamountdebit: 0,
    ledamountcredit: 0,
    running_balance: null,
    ledgerreference: "",
    ledgerbankid: null,
    warehouseid: null,
    warehousename: "",
    outletid: 0,
    ...override,
  } as unknown as CustomerLedgerReportType);

const LedgerActivityComponent = () => {
  const [getCustomerLedgerReport] = useLazyQuery(GET_CUSTOMER_LEDGER_REPORT_QUERY);
  const [getCustomerBalanceReport] = useLazyQuery(GET_CUSTOMER_BALANCE_REPORT_QUERY);
  const dispatch = useAppDispatch();
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<CustomerLedgerReportType[]>([]);
  const [pinnedTopRow, setPinnedTopRow] = useState<CustomerLedgerReportType[]>([]);
  const [pinnedBottomRow, setPinnedBottomRow] = useState<CustomerLedgerReportType[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [viewBalance, setViewBalance] = useState<number>(0);
  const [showPrint, setShowPrint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerid, setCustomerid] = useState<number | null>(null);
  const [fromdate, setFromdate] = useState<Dayjs | null>(null);
  const [todate, setTodate] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (!customerid) { setViewBalance(0); return; }
    getCustomerBalanceReport({
      variables: {
        outletid: parsedOutletId,
        page: 1,
        perpage: 1,
        filters: [{ key: "customerid", value: { filterType: "number", type: "equals", filter: customerid } }],
        sortModel: [],
        rowGroupCols: [],
        groupKeys: [],
      },
    }).then(({ data }) => {
      setViewBalance(data?.getCustomerBalanceReport?.data?.[0]?.total_due ?? 0);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerid]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerLedgerReportType>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchLedger = async (cid: number | null, from: Dayjs | null, to: Dayjs | null) => {
    if (!cid) return;

    setLoading(true);
    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerLedgerReport({
        variables: {
          outletid: parsedOutletId,
          customerid: cid,
          fromdate: from ? from.format("YYYY-MM-DD") : null,
          todate: to ? to.format("YYYY-MM-DD") : null,
          page: 1,
          perpage: 10000,
          filters: [],
          sortModel: [],
          rowGroupCols: [],
          groupKeys: [],
        },
      });

      const rows: CustomerLedgerReportType[] = data?.getCustomerLedgerReport?.data ?? [];
      const ob: number = data?.getCustomerLedgerReport?.openingBalance ?? 0;

      const totalDebits = rows.reduce((s, r) => s + (r.ledamountdebit || 0), 0);
      const totalCredits = rows.reduce((s, r) => s + (r.ledamountcredit || 0), 0);
      const closingBal = rows.length > 0 ? rows[rows.length - 1].running_balance ?? 0 : ob;

      setRowData(rows);
      setOpeningBalance(ob);

      setPinnedTopRow(
        from
          ? [emptyRow({ ledgercode: OPENING_BALANCE_CODE, ledgerdescription: "Opening Balance", running_balance: ob, outletid: parsedOutletId })]
          : []
      );

      setPinnedBottomRow(
        rows.length > 0
          ? [emptyRow({ ledgerdescription: "TOTAL", ledamountdebit: totalDebits, ledamountcredit: totalCredits, running_balance: closingBal })]
          : []
      );

      return true;
    });

    setLoading(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  useEffect(() => {
    fetchLedger(customerid, fromdate, todate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerid, fromdate, todate]);

  const closingBalance: number =
    rowData.length > 0 ? rowData[rowData.length - 1].running_balance ?? 0 : openingBalance;
  const isBalanced =
    customerid != null && !fromdate && !todate && Math.abs(closingBalance - viewBalance) < 0.01;

  return (
    <>
      <LedgerActivityHeader
        onPrint={customerid ? () => setShowPrint(true) : undefined}
        onExport={() => gridRef.current?.api?.exportDataAsCsv({ fileName: `ledger-${customerid}-${Date.now()}.csv` })}
      />
      <div className="card table-list-card">
        <div className="card-body p-2">
          {/* Filter bar */}
          <div className="row mb-3 g-2 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600 }}>
                Customer <span className="text-danger">*</span>
              </label>
              <SelectCustomer
                className=""
                storeId={parsedStoreId}
                trigger={() => {}}
                value={customerid}
                onChange={(val: number) => setCustomerid(val || null)}
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
            {customerid && (
              <div className="col-lg-2 col-md-6">
                <button
                  className="btn btn-secondary btn-sm w-100"
                  onClick={() => {
                    setCustomerid(null);
                    setFromdate(null);
                    setTodate(null);
                    setRowData([]);
                    setPinnedTopRow([]);
                    setPinnedBottomRow([]);
                    setOpeningBalance(0);
                    setViewBalance(0);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Summary strip — cross-check cards only */}
          {customerid && (
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
                  <div style={{ fontWeight: 700, color: closingBalance < 0 ? "#dc3545" : undefined }}>
                    {fmt(closingBalance)}
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <div
                  className="border rounded p-2 text-center"
                  style={{
                    background: isBalanced ? "#f0fff4" : "#fffaf0",
                    borderColor: isBalanced ? "#198754" : "#ffc107",
                  }}
                >
                  <div className="text-muted" style={{ fontSize: 11 }}>View Balance (vw_customer_list)</div>
                  <div style={{ fontWeight: 700, color: viewBalance < 0 ? "#dc3545" : undefined }}>
                    {fmt(viewBalance)}
                  </div>
                </div>
              </div>
              {!fromdate && !todate && (
                <div className="col-6 col-md-3 col-lg-2 d-flex align-items-center justify-content-center">
                  {isBalanced ? (
                    <span className="badge bg-success" style={{ fontSize: 12 }}>Balanced</span>
                  ) : (
                    <span className="badge bg-warning text-dark" style={{ fontSize: 12 }}>
                      Diff: {fmt(Math.abs(closingBalance - viewBalance))}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {!customerid ? (
            <div
              className="d-flex align-items-center justify-content-center text-muted"
              style={{ height: 200, fontSize: 14 }}
            >
              Select a customer to view ledger activity
            </div>
          ) : (
            <POSGridClient
              ref={gridRef}
              columnDefs={ledgerActivityColumnDefs}
              onGridReady={handleOnGridReady}
              rowData={rowData}
              loading={loading}
              pinnedTopRowData={pinnedTopRow}
              pinnedBottomRowData={pinnedBottomRow}
              rowGroupPanelShow="never"
              defaultColDef={{ filter: true, floatingFilter: true, sortable: false, enableRowGroup: false }}
              getRowStyle={(params) => {
                if (params.data?.ledgercode === OPENING_BALANCE_CODE)
                  return { background: "#f0f4ff", fontWeight: 700, fontStyle: "italic" };
                if (params.node.rowPinned === "bottom")
                  return { background: "#f8f9fa", fontWeight: 700, fontStyle: "normal" };
                return undefined;
              }}
            />
          )}
        </div>
      </div>

      {showPrint && customerid && (
        <LedgerPrintModal
          customerid={customerid}
          rowData={rowData}
          openingBalance={openingBalance}
          fromdate={fromdate}
          todate={todate}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
};

export default LedgerActivityComponent;
