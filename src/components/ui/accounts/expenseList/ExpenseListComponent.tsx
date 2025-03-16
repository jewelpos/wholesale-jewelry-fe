"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { _InfiniteRowModelGridApi } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import CustomLoadingOverlay from "../../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../../grid/CustomNoRowsOverlay";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";
import { GET_EXPENSE_LIST_QUERY } from "@/lib/graphql/query/accounts";
import { AccountsExpenseListType } from "@/types/accounts";
import { GridWrapper } from "../../grid/GridWrapper";
import { expenseListColumnDefs } from "./ColumnDef";

const ExpenseListComponent = () => {
  const [getExpenseList] = useLazyQuery(GET_EXPENSE_LIST_QUERY);
  const [rowData, setRowData] = useState<AccountsExpenseListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getExpenseList({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getExpenseList) {
          setRowData(data.getExpenseList.data);
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
    if (selectedOutlet) {
      fetchReport(selectedOutlet);
    }
  }, [selectedOutlet, fetchReport]);

  return (
    <div className="card-body">
      <div className="table-top">
        <div className="search-set">
          <div className="search-input">
            <OutletsFilter
              fetchOutletsList={fetchOutletsList}
              outlets={outlets}
              loading={outletsLoading}
              setSelectedOutlet={setSelectedOutlet}
              selectedOutlet={selectedOutlet}
            />
          </div>
        </div>
      </div>
      <div className="ag-theme-quartz custom-theme">
        {!outletsLoading && (
          <GridWrapper>
            <AgGridReact<AccountsExpenseListType>
              loading={loading}
              rowData={rowData}
              columnDefs={expenseListColumnDefs}
              defaultColDef={{
                filter: true,
                flex: 1,
              }}
              gridOptions={{
                rowHeight: 50,
                headerHeight: 50,
              }}
              pagination
              paginationPageSize={20}
              domLayout="normal"
              loadingOverlayComponent={CustomLoadingOverlay}
              noRowsOverlayComponent={CustomNoRowsOverlay}
            />
          </GridWrapper>
        )}
      </div>
    </div>
  );
};

export default ExpenseListComponent;
