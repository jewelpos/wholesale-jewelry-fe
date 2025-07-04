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
import { GET_SUPPLIER_LEDGER_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierLedgerListType } from "@/types/supplier";
import { supplierLedgerColumnDefs } from "./ColumnDef";
import POSGrid from "../../grid/POSGrid";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import SupplierLedgerActivityHeader from "./SupplierLedgerActivityHeader";

const SupplierLedgerActitvityComponent = () => {
  const [getSupplierLedgerList] = useLazyQuery(GET_SUPPLIER_LEDGER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const handleOnGridReady = (
    params: GridReadyEvent<SupplierLedgerListType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filtersMain = filterVariables(
          params,
          debouncedSearch,
          "supplierid, ledgercode, ledgerdescription"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getSupplierLedgerList({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getSupplierLedgerList) {
            params.success({
              rowData: data.getSupplierLedgerList.data,
              rowCount: data.getSupplierLedgerList.total,
            });
            if (!data.getSupplierLedgerList.data.length) {
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
    [selectedOutlet, dispatch, getSupplierLedgerList, debouncedSearch]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  return (
    <>
      <SupplierLedgerActivityHeader />
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
              columnDefs={supplierLedgerColumnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierLedgerActitvityComponent;
