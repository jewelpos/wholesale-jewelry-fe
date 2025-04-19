"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { GET_SUPPLIER_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierListType } from "@/types/supplier";
import { filterVariables } from "@/lib/utils/gridFilters";
import { suopplierListcolumnDefs } from "./ColumnDef";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";

const SupplierListComponent = () => {
  const [getSupplierList] = useLazyQuery(GET_SUPPLIER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

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

  return (
    <div className="card-body p-2">
      <CustomFilterSections
        search={search}
        setSearch={setSearch}
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
      />
      <POSGrid
        ref={gridRef}
        columnDefs={suopplierListcolumnDefs}
        onGridReady={handleOnGridReady}
        defaultColDef={{
          filter: !debouncedSearch,
          floatingFilter: !debouncedSearch,
        }}
      />
    </div>
  );
};

export default SupplierListComponent;
