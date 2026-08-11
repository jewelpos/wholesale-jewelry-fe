"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  IServerSideGetRowsParams,
  ICellRendererParams,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import {
  GET_CUSTOMER_LIST_QUERY,
  GET_CUSTOMER_QUERY,
} from "@/lib/graphql/query/customer";
import { REFRESH_CUSTOMER_LIST_MUTATION } from "@/lib/graphql/mutations/customer";
import { CustomersListType, CustomerType } from "@/types/customer";
import "ag-grid-enterprise";
import { customersListColumnDefs } from "./ColumnDef";
import { useParams } from "next/navigation";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import CustomerActions from "./CustomerActions";
import CustomerListHeader from "./CustomerListHeader";
import PrintModal, { PrintPayload } from "../../PrintModal";
import CustomerPrintDetails from "./CustomerPrintDetails";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ReportSummaryCards from "../../reports/shared/ReportSummaryCards";
import api from "@/lib/axios";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import useOutlets from "@/hooks/useOutlets";

const NO_FILTER: never[] = [];

type SegmentPill = "all" | "with_balance" | "no_balance";

const SEGMENT_PILLS: { key: SegmentPill; label: string }[] = [
  { key: "all", label: "All" },
  { key: "with_balance", label: "With Balance" },
  { key: "no_balance", label: "No Balance" },
];

const CustomerListComponent = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);
  const [getCustomerList] = useLazyQuery(GET_CUSTOMER_LIST_QUERY, { fetchPolicy: "network-only" });
  const [refreshCustomerListMutation, { loading: refreshing }] = useMutation(REFRESH_CUSTOMER_LIST_MUTATION);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(
    parsedOutletId || undefined
  );
  const [segmentPill, setSegmentPill] = useState<SegmentPill>("all");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // "All Outlets" toggle — bypasses the per-user outlet access floor. Defaults off
  // (today's behavior: assigned outlet(s) only). Only rendered when the store
  // actually has 2+ outlets, so we fetch the store-wide count (includeAll: true,
  // not gated by this user's own assignments) purely to decide whether to show it.
  const [showAllOutlets, setShowAllOutlets] = useState<boolean>(false);
  const { fetchOutletsList: fetchAllOutletsList, outlets: allOutlets } = useOutlets();
  useEffect(() => {
    if (parsedStoreId) fetchAllOutletsList([parsedStoreId], true);
  }, [parsedStoreId, fetchAllOutletsList]);
  const hasMultipleOutlets = allOutlets.length > 1;

  // Stats query — respects outlet + segment pill selection. The specific-outlet
  // dropdown is ignored while "All Outlets" is on, otherwise it would silently
  // keep narrowing to whichever outlet the dropdown defaulted to.
  const statsFilters = useMemo(() => {
    const f: { key: string; value: object }[] = [];
    if (!showAllOutlets && selectedOutlet) f.push({ key: "outletid", value: { filterType: "number", type: "equals", filter: selectedOutlet } });
    if (segmentPill === "with_balance") f.push({ key: "balancedue", value: { filterType: "number", type: "greaterThan", filter: 0 } });
    else if (segmentPill === "no_balance") f.push({ key: "balancedue", value: { filterType: "number", type: "equals", filter: 0 } });
    return f;
  }, [selectedOutlet, segmentPill, showAllOutlets]);

  const { data: statsData, loading: statsLoading } = useQuery(GET_CUSTOMER_LIST_QUERY, {
    variables: { storeid: parsedStoreId, page: 1, perpage: 2000, filters: statsFilters, sortModel: NO_FILTER, rowGroupCols: NO_FILTER, groupKeys: NO_FILTER, showAllOutlets },
    fetchPolicy: "cache-and-network",
  });

  const customerStats = useMemo(() => {
    const rows: CustomersListType[] = statsData?.getCustomerList?.data ?? [];
    let totalBalance = 0, totalSales = 0, withBalance = 0;
    for (const r of rows) {
      totalBalance += Number(r.balancedue) || 0;
      totalSales += Number(r.totalsale) || 0;
      if ((Number(r.balancedue) || 0) > 0) withBalance++;
    }
    return { total: rows.length, totalBalance, totalSales, withBalance };
  }, [statsData]);
  const { data: customerData, loading: customerLoading } = useQuery(
    GET_CUSTOMER_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        customerid: Number(selectedCustomerId),
      },
      skip: !storeIdParam || !selectedCustomerId,
    }
  );
  const selectedCustomer: CustomerType = customerData?.getCustomer;
  const [loading, setLoading] = useState(false);

  const selectedOutletRef = useRef(selectedOutlet);
  const segmentPillRef = useRef(segmentPill);
  const debouncedSearchRef = useRef(debouncedSearch);
  const showAllOutletsRef = useRef(showAllOutlets);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { segmentPillRef.current = segmentPill; }, [segmentPill]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { showAllOutletsRef.current = showAllOutlets; }, [showAllOutlets]);

  const handleOnGridReady = (params: GridReadyEvent<CustomersListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    const outlet = selectedOutletRef.current;
    const pill = segmentPillRef.current;
    const filtersMain = filterVariables(params, debouncedSearchRef.current, "fullname, custcompanyname");

    // The specific-outlet dropdown is ignored while "All Outlets" is on — otherwise
    // it would silently keep narrowing to whichever outlet it defaulted to.
    const outletExtra = outlet && !showAllOutletsRef.current
      ? [{ key: "outletid", value: { filterType: "number", type: "equals", filter: outlet } }]
      : [];
    const pillExtra =
      pill === "with_balance"
        ? [{ key: "balancedue", value: { filterType: "number", type: "greaterThan", filter: 0 } }]
        : pill === "no_balance"
        ? [{ key: "balancedue", value: { filterType: "number", type: "equals", filter: 0 } }]
        : [];

    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerList({
        variables: {
          storeid: parsedStoreId,
          ...filtersMain,
          filters: [...filtersMain.filters, ...outletExtra, ...pillExtra],
          showAllOutlets: showAllOutletsRef.current,
        },
      });
      if (data.getCustomerList) {
        params.success({ rowData: data.getCustomerList.data, rowCount: data.getCustomerList.total });
        if (!data.getCustomerList.data.length) gridRef.current?.api?.showNoRowsOverlay();
        else gridRef.current?.api?.hideOverlay();
      }
      return true;
    });
    if (result.error) {
      gridRef.current?.api?.showNoRowsOverlay();
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      params.fail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datasource = useRef({ getRows }).current;

  const handleDeleteSuccess = useCallback(() => {
    if (gridReady) gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [gridReady]);

  const handleRefresh = useCallback(async () => {
    const result = await handleTryCatch(async () => {
      await refreshCustomerListMutation({ variables: { storeid: parsedStoreId } });
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      gridRef.current?.api?.refreshServerSide({ purge: true });
    }
  }, [parsedStoreId, refreshCustomerListMutation, dispatch]);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [parsedStoreId, gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, segmentPill, debouncedSearch, showAllOutlets]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...customersListColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<CustomersListType>) =>
          params.data ? (
            <CustomerActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 130,
        minWidth: 52,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [handleDeleteSuccess]
  );

  const handlePrintSubmit = async (payload: PrintPayload) => {
    setLoading(true);
    const updatedPayload = {
      ...payload,
      customerid: selectedCustomerId,
      outletid: 123,
    };
    const result = await handleTryCatch(
      async () => {
        const response = await api.post(
          `/store/customer/statement`,
          updatedPayload,
          {
            responseType: "blob", // <== CRITICAL
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { data } = response;
        if (data) {
          const url = window.URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "file.pdf");
          document.body.appendChild(link);
          link.click();
          link.remove();
          dispatch(
            showNotification({
              message: data.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );

    if (result.error) {
      setLoading(false);
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("customer-list");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <CustomerListHeader
        selectedCustomerId={selectedCustomerId}
        setShowPrintModal={setShowPrintModal}
        onExport={() => exportGridToExcel(gridRef.current?.api, { fileName: "customers", sheetName: "Customers" })}
      />
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Customer Summary">
          <ReportSummaryCards
            cards={[
              { label: "Total Customers", value: customerStats.total, format: "number" },
              { label: "Outstanding Balance", value: customerStats.totalBalance, format: "currency" },
              { label: "Total Sales", value: customerStats.totalSales, format: "currency" },
              { label: "Customers w/ Balance", value: customerStats.withBalance, format: "number" },
            ]}
            loading={statsLoading && !statsData}
          />
        </SummaryPanelWrapper>
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            extraActions={
              <>
                {hasMultipleOutlets && (
                  <div
                    className="form-check form-switch d-flex align-items-center gap-1 mb-0"
                    style={{ paddingLeft: 0 }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="showAllOutletsToggle"
                      checked={showAllOutlets}
                      onChange={(e) => {
                        setShowAllOutlets(e.target.checked);
                        if (e.target.checked) {
                          // Clear the specific-outlet dropdown so it doesn't sit on a
                          // stale selection while "All Outlets" is showing everything.
                          setSelectedOutlet(undefined);
                        } else {
                          // Switching back off — restore the dropdown to the current outlet.
                          setSelectedOutlet(parsedOutletId || undefined);
                        }
                      }}
                      style={{ cursor: "pointer", marginLeft: 0 }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="showAllOutletsToggle"
                      style={{ cursor: "pointer", fontSize: 12, color: "#64748b", userSelect: "none", whiteSpace: "nowrap" }}
                    >
                      All Outlets
                    </label>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh balances from latest invoices & payments"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, border: "1px solid #dee2e6",
                    background: "#fff", color: "#64748b",
                    cursor: refreshing ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap", transition: "0.15s",
                  }}
                >
                  <i className={`fas fa-sync-alt${refreshing ? " fa-spin" : ""}`} style={{ fontSize: 11 }} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </>
            }
          />
          <div className="d-flex gap-1 flex-wrap mb-2">
            {SEGMENT_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSegmentPill(p.key)}
                style={{
                  fontSize: 11,
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontWeight: segmentPill === p.key ? 600 : 400,
                  backgroundColor: segmentPill === p.key ? "#3b82f6" : "var(--surface-muted)",
                  color: segmentPill === p.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${segmentPill === p.key ? "#3b82f6" : "var(--border-subtle)"}`,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid gridKey="customer-list"
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
                            rowSelection={{
                mode: "singleRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
              onSelectionChanged={() => {
                const selected = gridRef.current?.api?.getSelectedRows() || [];
                setSelectedCustomerId(selected[0]?.customerid);
              }}
            />
          </div>
        </div>
      </div>
      {showPrintModal && selectedCustomerId && (
        <PrintModal
          setShowPrintModal={setShowPrintModal}
          handlePrintSubmit={handlePrintSubmit}
          loading={loading}
        >
          <CustomerPrintDetails
            selectedCustomer={selectedCustomer}
            loading={customerLoading}
          />
        </PrintModal>
      )}
    </div>
  );
};

export default CustomerListComponent;
