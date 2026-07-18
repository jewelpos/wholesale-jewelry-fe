"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation } from "@apollo/client";
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
import "ag-grid-enterprise";
import { GET_SUPPLIER_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { REFRESH_SUPPLIER_LIST_MUTATION } from "@/lib/graphql/mutations/supplier";
import { SupplierListType } from "@/types/supplier";
import { filterVariables } from "@/lib/utils/gridFilters";
import { supplierListcolumnDefs } from "./ColumnDef";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import SupplierActions from "./SupplierActions";
import SupplierListHeader from "./SupplierListHeader";
import SupplierStatsCards from "./SupplierStatsCards";
import SupplierInvoiceFormModal from "../invoice/new/SupplierInvoiceFormModal";
import PaymentModal from "../appliedPayments/PaymentModal";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import { useParams } from "next/navigation";

const SupplierListComponent = () => {
  const [getSupplierList] = useLazyQuery(GET_SUPPLIER_LIST_QUERY);
  const [refreshSupplierListMutation, { loading: refreshing }] = useMutation(REFRESH_SUPPLIER_LIST_MUTATION);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [showInvoiceFormModal, setShowInvoiceFormModal] =
    useState<boolean>(false);
  const [paymentModal, setPaymentModal] = useState<string>("");

  const handleOnGridReady = (params: GridReadyEvent<SupplierListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // Refs so datasource closure always reads the latest values without recreating
  const debouncedSearchRef = useRef(debouncedSearch);
  const selectedOutletRef = useRef(selectedOutlet);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);

  // Stable datasource — created once, reads filters from refs
  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearchRef.current, "companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getSupplierList({
            variables: {
              outletid: selectedOutletRef.current,
              ...filters,
            },
          });
          if (data.getSupplierList) {
            params.success({
              rowData: data.getSupplierList.data,
              rowCount: data.getSupplierList.total,
            });
            if (!data.getSupplierList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(
            showNotification({
              message: result.error,
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
          params.fail();
        }
      },
    }),
    [dispatch, getSupplierList]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (gridReady) {
      gridRef.current?.api?.refreshServerSide({ purge: true });
    }
  }, [gridReady]);

  const handleRefresh = useCallback(async () => {
    const result = await handleTryCatch(async () => {
      await refreshSupplierListMutation({ variables: { storeid: parsedStoreId } });
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      gridRef.current?.api?.refreshServerSide({ purge: true });
    }
  }, [parsedStoreId, refreshSupplierListMutation, dispatch]);

  // Set datasource once when grid ready — stable datasource so this only fires once
  useEffect(() => {
    if (selectedOutlet && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource, selectedOutlet]);

  // Refresh only when search text changes — initial load and outlet changes are handled by Effect 1
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) { isFirstSearch.current = false; return; }
    if (!gridReady) return;
    gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("supplier-list");

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...supplierListcolumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<SupplierListType>) =>
          params.data ? (
            <SupplierActions
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

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
        <SupplierListHeader
          setShowInvoiceFormModal={setShowInvoiceFormModal}
          setPaymentModal={setPaymentModal}
        />
        {isAdmin && (
          <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Supplier Summary">
            <SupplierStatsCards outletid={selectedOutlet} />
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
              }
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              <POSGrid
                ref={gridRef}
                columnDefs={columnDefs}
                onGridReady={handleOnGridReady}
                fillHeight
                                rowSelection={{
                  mode: "singleRow",
                  checkboxes: false,
                  enableClickSelection: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {showInvoiceFormModal && (
        <SupplierInvoiceFormModal
          setShowInvoiceFormModal={setShowInvoiceFormModal}
        />
      )}
      {paymentModal && (
        <PaymentModal
          setPaymentModal={setPaymentModal}
          paymentModal={paymentModal}
        />
      )}
    </>
  );
};

export default SupplierListComponent;
