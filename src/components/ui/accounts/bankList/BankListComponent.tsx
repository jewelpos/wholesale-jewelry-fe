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
import { useParams } from "next/navigation";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { AccountsBankListType } from "@/types/accounts";
import { bankListColumnDefs } from "./ColumnDef";
import { GET_BANK_LIST_QUERY } from "@/lib/graphql/query/accounts";

const BankListComponent = () => {
  const [getBanksList] = useLazyQuery(GET_BANK_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<AccountsBankListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data } = await getBanksList({
            variables: {
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (data.getBanksList) {
            params.success({
              rowData: data.getBanksList.data,
              rowCount: data.getBanksList.total,
            });
            if (!data.getBanksList.data.length) {
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
    [parsedStoreId, dispatch, getBanksList]
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
          columnDefs={bankListColumnDefs}
          onGridReady={handleOnGridReady}
        />
      </div>
    </div>
  );
};

export default BankListComponent;
