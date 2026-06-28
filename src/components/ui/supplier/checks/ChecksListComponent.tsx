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
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { GET_ON_HAND_CHEQUE_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { OnHandChequeSummaryType } from "@/types/supplier";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { checksListColumnDefs } from "./ColumnDef";
import ChecksListHeader from "./ChecksListHeader";
import { useParams } from "next/navigation";

const ChecksListComponent = () => {
  const [getOnHandChequeSummaryList] = useLazyQuery(
    GET_ON_HAND_CHEQUE_SUMMARY_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const handleOnGridReady = (
    params: GridReadyEvent<OnHandChequeSummaryType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getOnHandChequeSummaryList({
            variables: {
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (data.getOnHandChequeSummaryList) {
            params.success({
              rowData: data.getOnHandChequeSummaryList.data,
              rowCount: data.getOnHandChequeSummaryList.total,
            });
            if (!data.getOnHandChequeSummaryList.data.length) {
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
    [parsedStoreId, dispatch, getOnHandChequeSummaryList, debouncedSearch]
  );

  const handleRefreshChecks = useCallback(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, parsedStoreId]);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  const columnDefs = useMemo<ColDef[]>(() => [...checksListColumnDefs], []);

  return (
    <>
      <ChecksListHeader />
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
    </>
  );
};

export default ChecksListComponent;
