"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
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

const CustomerListComponent = () => {
  const [getCustomerList] = useLazyQuery(GET_CUSTOMER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<CustomersListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
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
    [parsedStoreId, dispatch, getCustomerList]
  );

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady]);

  return (
    <div className="card-body p-2">
      <div className="ag-theme-quartz custom-theme">
        <POSGrid
          ref={gridRef}
          columnDefs={customersListColumnDefs}
          onGridReady={handleOnGridReady}
        />
      </div>
    </div>
  );
};

export default CustomerListComponent;
