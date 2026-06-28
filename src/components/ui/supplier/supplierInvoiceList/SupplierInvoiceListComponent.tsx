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
import { GET_SUPPLIER_INVOICE_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierInvoiceType } from "@/types/supplier";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { supplierInvoiceListColumnDefs } from "./ColumnDef";
import SupplierInvoiceActions from "./SupplierInvoiceActions";
import SupplierInvoiceListHeader from "./SupplierInvoiceListHeader";
import { useParams } from "next/navigation";
import SupplierInvoiceFormModal from "../invoice/new/SupplierInvoiceFormModal";

const SupplierInvoiceListComponent = () => {
  const [getSupplierInvoiceList] = useLazyQuery(
    GET_SUPPLIER_INVOICE_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null);

  const handleOnGridReady = (params: GridReadyEvent<SupplierInvoiceType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // Ref so datasource closure always reads the latest search without recreating
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  // Stable datasource — created once, reads search from ref
  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearchRef.current,
          "veninvoiceno"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getSupplierInvoiceList({
            variables: {
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (data.getSupplierInvoiceList) {
            params.success({
              rowData: data.getSupplierInvoiceList.data,
              rowCount: data.getSupplierInvoiceList.total,
            });
            if (!data.getSupplierInvoiceList.data.length) {
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
    [parsedStoreId, dispatch, getSupplierInvoiceList]
  );

  const handleRefreshInvoice = useCallback(() => {
    if (gridReady) {
      gridRef.current?.api?.refreshServerSide({ purge: true });
    }
  }, [gridReady]);

  // Set datasource once when grid ready — stable datasource so this only fires once
  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource, parsedStoreId]);

  // Refresh data on search change — no setGridOption, preserves column state
  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [debouncedSearch, gridReady]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...supplierInvoiceListColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<SupplierInvoiceType>) =>
          params.data ? (
            <SupplierInvoiceActions
              data={params.data}
              handleRefreshInvoice={handleRefreshInvoice}
              setSelectedInvoiceId={setSelectedInvoiceId}
              setViewInvoiceId={setViewInvoiceId}
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
    [handleRefreshInvoice, setSelectedInvoiceId, setViewInvoiceId]
  );

  return (
    <>
      <SupplierInvoiceListHeader onAdd={() => setShowAddModal(true)} />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections search={search} setSearch={setSearch} />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              rowSelection={{
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
            />
          </div>
        </div>
      </div>
      {showAddModal && (
        <SupplierInvoiceFormModal
          setShowInvoiceFormModal={() => setShowAddModal(false)}
          handleRefreshInvoice={handleRefreshInvoice}
        />
      )}
      {selectedInvoiceId && (
        <SupplierInvoiceFormModal
          setShowInvoiceFormModal={() => setSelectedInvoiceId(null)}
          supplierinvoiceid={selectedInvoiceId}
          handleRefreshInvoice={handleRefreshInvoice}
        />
      )}
      {viewInvoiceId && (
        <SupplierInvoiceFormModal
          setShowInvoiceFormModal={() => setViewInvoiceId(null)}
          supplierinvoiceid={viewInvoiceId}
          readOnly
        />
      )}
    </>
  );
};

export default SupplierInvoiceListComponent;
