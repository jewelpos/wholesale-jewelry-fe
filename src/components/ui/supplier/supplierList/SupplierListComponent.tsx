"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
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

const SupplierListComponent = () => {
  const [getSupplierList] = useLazyQuery(GET_SUPPLIER_LIST_QUERY);
  const dispatch = useAppDispatch();
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

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getSupplierList({
            variables: {
              outletid: selectedOutlet,
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
    [selectedOutlet, dispatch, getSupplierList, debouncedSearch]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, selectedOutlet]);

  useEffect(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

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
        width: 80,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressSizeToFit: false,
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
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              <POSGrid
                ref={gridRef}
                columnDefs={columnDefs}
                onGridReady={handleOnGridReady}
                fillHeight
                defaultColDef={{
                  filter: !debouncedSearch,
                }}
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
