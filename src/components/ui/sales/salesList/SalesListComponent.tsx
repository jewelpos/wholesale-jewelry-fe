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
import { GET_SALES_INVOICE_LIST_QUERY } from "@/lib/graphql/query/sales";
import { SalesInvoiceListType } from "@/types/sales";
import { salesInvoiceColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";

const SalesListComponent = () => {
  const [getInvoiceList] = useLazyQuery(GET_SALES_INVOICE_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const handleOnGridReady = (params: GridReadyEvent<SalesInvoiceListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data } = await getInvoiceList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getInvoiceList) {
            params.success({
              rowData: data.getInvoiceList.data,
              rowCount: data.getInvoiceList.total,
            });
            if (!data.getInvoiceList.data.length) {
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
    [selectedOutlet, dispatch, getInvoiceList]
  );

  useEffect(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady]);

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
        columnDefs={salesInvoiceColumnDefs}
        onGridReady={handleOnGridReady}
      />
    </div>
  );
};

export default SalesListComponent;
