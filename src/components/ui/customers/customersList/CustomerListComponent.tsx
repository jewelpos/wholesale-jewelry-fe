"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { _InfiniteRowModelGridApi, GridReadyEvent } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import CustomLoadingOverlay from "../../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../../grid/CustomNoRowsOverlay";
import { GET_CUSTOMER_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomersListType } from "@/types/customer";
import "ag-grid-enterprise";
import { GridWrapper } from "../../grid/GridWrapper";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";
import { customersListColumnDefs } from "./ColumnDef";
import { useParams } from "next/navigation";

const CustomerListComponent = () => {
  const [getCustomerList] = useLazyQuery(GET_CUSTOMER_LIST_QUERY);
  const { autoSizeStrategy } = useAutoSizeAggrid();
  const [rowData, setRowData] = useState<CustomersListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);

  const handleOnGridReady = (params: GridReadyEvent<CustomersListType>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchReport = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getCustomerList({
          variables: { storeid: storeId, page: 1, perpage: 1000 },
        });
        if (data.getCustomerList) {
          setRowData(data.getCustomerList.data);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  }, []);

  useEffect(() => {
    if (parsedStoreId) {
      fetchReport(parsedStoreId);
    }
  }, [parsedStoreId, fetchReport]);

  return (
    <div className="card-body">
      <div className="ag-theme-quartz custom-theme">
        <GridWrapper>
          <AgGridReact<CustomersListType>
            loading={loading}
            rowData={rowData}
            columnDefs={customersListColumnDefs}
            defaultColDef={{
              filter: true,
              flex: 1,
            }}
            gridOptions={{
              rowHeight: 37,
              headerHeight: 50,
            }}
            pagination
            paginationPageSize={20}
            domLayout="normal"
            onGridReady={handleOnGridReady}
            autoSizeStrategy={autoSizeStrategy}
            loadingOverlayComponent={CustomLoadingOverlay}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </GridWrapper>
      </div>
    </div>
  );
};

export default CustomerListComponent;
