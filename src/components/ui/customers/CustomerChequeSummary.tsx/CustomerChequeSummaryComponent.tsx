"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import POSGridClient from "../../grid/POSGridClient";
import { customerChequeSummaryColumnDefs } from "./ColumnDef";
import { AgGridReact } from "ag-grid-react";
import { CustomerChequeSummaryListType } from "@/types/customer";
import { GridReadyEvent } from "ag-grid-enterprise";
import { useLazyQuery } from "@apollo/client";
import { GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/customer";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useParams } from "next/navigation";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import SelectCustomer from "@/components/forms/SelectCustomer";
import OnHandChecksComponent from "../onHandChecks/OnHandChecksComponent";
import CustomerChequeSummaryHeader from "./CustomerChequeSummaryHeader";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import AddOnHandChequeModal from "./AddOnHandChequeModal";
import OnHandChecksPrintModal from "./OnHandChecksPrintModal";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ReportSummaryCards, { SummaryCardDef } from "../../reports/shared/ReportSummaryCards";
import ReportMiniChart from "../../reports/shared/ReportMiniChart";
import useWarehouse from "@/hooks/useWarehouse";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_CHIPS = [
  { label: "All", value: 0 },
  { label: String(CURRENT_YEAR - 2), value: CURRENT_YEAR - 2 },
  { label: String(CURRENT_YEAR - 1), value: CURRENT_YEAR - 1 },
  { label: String(CURRENT_YEAR), value: CURRENT_YEAR },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const CustomerChequeSummaryComponent = () => {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<CustomerChequeSummaryListType[]>([]);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [openAddChequeModal, setOpenAddChequeModal] = useState<boolean>(false);
  const [openPrintModal, setOpenPrintModal] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("cheque-summary");

  // Load warehouses to auto-select the system/default warehouse on mount
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  useEffect(() => {
    if (parsedOutletId) fetchWarehouseByOutletId(parsedOutletId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOutletId]);

  const defaultWarehouse = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => warehouses.find((w: any) => w.issystem) ?? warehouses[0],
    [warehouses]
  );

  useEffect(() => {
    if (defaultWarehouse?.warehouseid && !selectedWarehouse) {
      setSelectedWarehouse(Number(defaultWarehouse.warehouseid));
    }
  }, [defaultWarehouse, selectedWarehouse]);

  useEffect(() => {
    if (!gridRef.current?.api) return;
    gridRef.current.api.updateGridOptions({
      defaultColDef: { floatingFilter: showFilters },
    });
  }, [showFilters]);

  const [getCustomerChequeSummaryList] = useLazyQuery(
    GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY
  );

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerChequeSummaryListType>
  ) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchChequeSummary = async (
    storeid: number,
    customerid: number | null,
    year: number | null,
    warehouseid: number | null
  ) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getCustomerChequeSummaryList({
          variables: {
            storeid: storeid,
            customerid: customerid ? Number(customerid) : null,
            year: year ? Number(year) : null,
            warehouseid: warehouseid ? Number(warehouseid) : null,
          },
        });
        if (data.getCustomerChequeSummaryList) {
          setRowData(data.getCustomerChequeSummaryList);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  useEffect(() => {
    fetchChequeSummary(
      parsedStoreId,
      selectedCustomer,
      selectedYear,
      selectedWarehouse
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedStoreId, selectedCustomer, selectedYear, selectedWarehouse]);

  const isValidCustomerRow = (r: CustomerChequeSummaryListType) =>
    Number.isInteger(Number(r.customerid)) && Number(r.customerid) > 0;

  // Filter by current outlet — include records assigned to this outlet OR with no outlet (legacy data)
  const filteredRowData = useMemo(() => {
    const outletFiltered = !parsedOutletId || !rowData.length
      ? rowData
      : rowData.filter((r) => !r.outletid || Number(r.outletid) === parsedOutletId);
    return outletFiltered.filter(isValidCustomerRow);
  }, [rowData, parsedOutletId]);

  const pinnedGrandTotal = useMemo(() => {
    const raw = !parsedOutletId || !rowData.length
      ? rowData
      : rowData.filter((r) => !r.outletid || Number(r.outletid) === parsedOutletId);
    const grandRow = raw.find((r) => !isValidCustomerRow(r));
    if (grandRow) return [{ ...grandRow, custcompanyname: "Grand Total" }];
    // Compute from valid rows if backend doesn't include one
    if (!filteredRowData.length) return [];
    const sum = (field: keyof CustomerChequeSummaryListType) =>
      filteredRowData.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    return [{
      customerid: "",
      custcompanyname: "Grand Total",
      yearly_total: String(sum("yearly_total")),
      Jan: String(sum("Jan")), Feb: String(sum("Feb")), Mar: String(sum("Mar")),
      Apr: String(sum("Apr")), May: String(sum("May")), Jun: String(sum("Jun")),
      Jul: String(sum("Jul")), Aug: String(sum("Aug")), Sep: String(sum("Sep")),
      Oct: String(sum("Oct")), Nov: String(sum("Nov")), Dec: String(sum("Dec")),
    }];
  }, [rowData, parsedOutletId, filteredRowData]);

  const chequeStats = useMemo(() => {
    if (!filteredRowData.length) return { totalValue: 0, customerCount: 0, largestValue: 0, largestName: "—", monthlyTotals: Array(12).fill(0) as number[] };
    let totalValue = 0, largestValue = 0, largestName = "—";
    const monthlyTotals = Array(12).fill(0) as number[];

    for (const r of filteredRowData) {
      const yearly = Number(r.yearly_total) || 0;
      totalValue += yearly;
      if (yearly > largestValue) { largestValue = yearly; largestName = r.custcompanyname; }
      MONTHS.forEach((m, i) => { monthlyTotals[i] += Number(r[m]) || 0; });
    }
    return { totalValue, customerCount: filteredRowData.length, largestValue, largestName, monthlyTotals };
  }, [filteredRowData]);

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Cheque Value", value: chequeStats.totalValue, format: "currency" },
    { label: "# Customers", value: chequeStats.customerCount, format: "number" },
    { label: "Largest Holder", value: chequeStats.largestValue, format: "currency", subtext: chequeStats.largestName },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <CustomerChequeSummaryHeader
        setOpenAddChequeModal={setOpenAddChequeModal}
        onExport={() => exportGridToExcel(gridRef.current?.api, { fileName: "customer-checks", sheetName: "Checks" })}
        onPrint={() => setOpenPrintModal(true)}
      />

      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Cheque Summary">
          <ReportSummaryCards cards={summaryCards} loading={loading && !rowData.length} />
          <ReportMiniChart
            labels={[...MONTHS]}
            values={chequeStats.monthlyTotals}
            title="Monthly Cheque Distribution"
            type="bar"
            color="#8b5cf6"
            height={120}
            loading={loading && !rowData.length}
            defaultCollapsed
          />
        </SummaryPanelWrapper>
      )}

      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {/* Filter bar */}
          <div className="container-fluid my-3">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <div className="input-group" style={{ width: 280 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span className="input-group-text">
                    <i data-feather="search" className="feather-search" />
                  </span>
                </div>
                <div
                  className="form-check form-switch d-flex align-items-center gap-1 mb-0"
                  style={{ paddingLeft: 0 }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="chequeFiltersToggle"
                    checked={showFilters}
                    onChange={(e) => setShowFilters(e.target.checked)}
                    style={{ cursor: "pointer", marginLeft: 0 }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="chequeFiltersToggle"
                    style={{ cursor: "pointer", fontSize: 12, color: "#64748b", userSelect: "none" }}
                  >
                    Filters
                  </label>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div style={{ minWidth: 200 }}>
                  <SelectCustomer
                    className=""
                    trigger={() => {}}
                    setValue={() => {}}
                    storeId={parsedStoreId}
                    value={selectedCustomer}
                    onChange={(value: React.SetStateAction<number>) => setSelectedCustomer(value)}
                  />
                </div>
                <div style={{ minWidth: 200 }}>
                  <SelectWarehouse
                    className=""
                    trigger={() => {}}
                    setValue={() => {}}
                    storeId={parsedStoreId}
                    outletId={parsedOutletId}
                    value={selectedWarehouse}
                    onChange={(value: React.SetStateAction<number>) => setSelectedWarehouse(value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Year pills */}
          <div className="d-flex gap-1 flex-wrap mb-2">
            {YEAR_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setSelectedYear(chip.value)}
                style={{
                  fontSize: 11,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontWeight: selectedYear === chip.value ? 600 : 400,
                  backgroundColor: selectedYear === chip.value ? "#8b5cf6" : "var(--surface-muted)",
                  color: selectedYear === chip.value ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${selectedYear === chip.value ? "#8b5cf6" : "var(--border-subtle)"}`,
                  cursor: "pointer",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGridClient
              ref={gridRef}
              columnDefs={customerChequeSummaryColumnDefs}
              onGridReady={handleOnGridReady}
              rowData={filteredRowData}
              pinnedBottomRowData={pinnedGrandTotal}
              loading={loading}
              fillHeight
              quickFilterText={search}
              defaultColDef={{ filter: true, floatingFilter: false }}
              masterDetail
              isRowMaster={(row) => Number.isInteger(Number(row?.customerid)) && Number(row?.customerid) > 0}
              detailCellRenderer={OnHandChecksComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
      {openPrintModal && (
        <OnHandChecksPrintModal onClose={() => setOpenPrintModal(false)} />
      )}
      {openAddChequeModal && (
        <AddOnHandChequeModal
          setShowPrintModal={setOpenAddChequeModal}
          triggerFetchSummary={() =>
            fetchChequeSummary(
              parsedStoreId,
              selectedCustomer,
              selectedYear,
              selectedWarehouse
            )
          }
        />
      )}
    </div>
  );
};

export default CustomerChequeSummaryComponent;
