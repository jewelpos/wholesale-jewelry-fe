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
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_CHEQUE_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerChequeListType } from "@/types/customer";
import "ag-grid-enterprise";
import { onHandsColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useParams } from "next/navigation";
import OnHandChecksActions from "./OnHandChecksActions";

interface Props {
  data: CustomerChequeListType;
}

const OnHandChecksComponent = ({ data }: Props) => {
  const [getCustomerChequeList] = useLazyQuery(GET_CUSTOMER_CHEQUE_LIST_QUERY);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerChequeListType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data: chequeData } = await getCustomerChequeList({
            variables: {
              customerid: Number(data.customerid),
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (chequeData.getCustomerChequeList) {
            params.success({
              rowData: chequeData.getCustomerChequeList.data,
              rowCount: chequeData.getCustomerChequeList.total,
            });
            if (!chequeData.getCustomerChequeList.data.length) {
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
    [dispatch, getCustomerChequeList, data.customerid, parsedStoreId]
  );

  useEffect(() => {
    if (data.customerid && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, data.customerid, parsedStoreId]);

  const retryFetchData = useCallback(() => {
    gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
  }, [datasource]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...onHandsColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<CustomerChequeListType>) =>
          params.data ? (
            <OnHandChecksActions
              data={params.data}
              retryFetchData={retryFetchData}
            />
          ) : null,
        width: 120,
        sortable: false,
        filter: false,
        maxWidth: 180,
        pinned: "right",
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [retryFetchData]
  );

  return (
    <div className="card table-list-card">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={columnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default OnHandChecksComponent;
