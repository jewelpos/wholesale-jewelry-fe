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

const SupplierInvoiceListComponent = () => {
  const [getSupplierInvoiceList] = useLazyQuery(GET_SUPPLIER_INVOICE_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<SupplierInvoiceType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "veninvoiceno");
        const result = await handleTryCatch(async () => {
          const { data } = await getSupplierInvoiceList({
            variables: {
              outletid: selectedOutlet,
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
    [selectedOutlet, dispatch, getSupplierInvoiceList, debouncedSearch]
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
      <SupplierInvoiceListHeader
      />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              rowSelection={{
                mode: "multiRow",
                checkboxes:   true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInvoiceListComponent;
