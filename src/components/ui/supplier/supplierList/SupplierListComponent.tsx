"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  _InfiniteRowModelGridApi,
  ColDef,
  GridReadyEvent,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import CustomLoadingOverlay from "../../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../../grid/CustomNoRowsOverlay";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";
import { GET_SUPPLIER_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierListType } from "@/types/supplier";
import { GridWrapper } from "../../grid/GridWrapper";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";

const SupplierListComponent = () => {
  const [getSupplierList] = useLazyQuery(GET_SUPPLIER_LIST_QUERY);
  const { autoSizeStrategy } = useAutoSizeAggrid();
  const [rowData, setRowData] = useState<SupplierListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();

  const columnDefs: ColDef<SupplierListType>[] = [
    { headerName: "Company", field: "companyname" },
    { headerName: "Name", field: "contactname" },
    { headerName: "Account number", field: "accountno" },
    { headerName: "Phone number", field: "phone" },
    { headerName: "Email ID", field: "emailaddress" },
    { headerName: "Web", field: "webaddress" },
    { headerName: "Warehouse name", field: "warehousename" },
  ];

  const handleOnGridReady = (params: GridReadyEvent<SupplierListType>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getSupplierList({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getSupplierList) {
          setRowData(data.getSupplierList.data);
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
            <AgGridReact<SupplierListType>
              loading={loading}
              rowData={rowData}
              columnDefs={columnDefs}
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
              onGridReady={handleOnGridReady}
              autoSizeStrategy={autoSizeStrategy}
              loadingOverlayComponent={CustomLoadingOverlay}
              noRowsOverlayComponent={CustomNoRowsOverlay}
            />
          </GridWrapper>
        )}
      </div>
    </div>
  );
};

export default SupplierListComponent;
