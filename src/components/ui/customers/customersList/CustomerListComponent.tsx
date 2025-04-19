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
import { GET_CUSTOMER_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomersListType } from "@/types/customer";
import "ag-grid-enterprise";
import { customersListColumnDefs } from "./ColumnDef";
import { useParams } from "next/navigation";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import CustomerActions from "./CustomerActions";

const CustomerListComponent = () => {
  const [getCustomerList] = useLazyQuery(GET_CUSTOMER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const handleOnGridReady = (params: GridReadyEvent<CustomersListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "fullname, custcompanyname"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getCustomerList({
            variables: {
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (data.getCustomerList) {
            params.success({
              rowData: data.getCustomerList.data,
              rowCount: data.getCustomerList.total,
            });
            if (!data.getCustomerList.data.length) {
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
    [parsedStoreId, dispatch, getCustomerList, debouncedSearch]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, parsedStoreId]);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [debouncedSearch, gridReady, datasource]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "",
        field: "checkbox",
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        pinned: "left",
        sortable: false,
        filter: false,
        maxWidth: 50,
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
        headerCheckboxSelectionFilteredOnly: true,
      },
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
        width: 120,
        sortable: false,
        filter: false,
        maxWidth: 150,
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
    <div className="card-body p-2">
      <CustomFilterSections search={search} setSearch={setSearch} />
      <div className="ag-theme-quartz custom-theme">
        <POSGrid
          ref={gridRef}
          columnDefs={columnDefs}
          onGridReady={handleOnGridReady}
          defaultColDef={{
            filter: !debouncedSearch,
            floatingFilter: !debouncedSearch,
          }}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};

export default CustomerListComponent;
