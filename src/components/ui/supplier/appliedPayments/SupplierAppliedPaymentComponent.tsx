"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_SUPPLIER_APPLIED_AMOUNT_LIST_QUERY } from "@/lib/graphql/query/supplier";
import { AppliedPaymentType, SupplierPayment } from "@/types/supplier";
import "ag-grid-enterprise";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useParams } from "next/navigation";
import appliedPaymentsColumnDefs from "./ColumnDef";

interface Props {
  data: SupplierPayment;
}

const SupplierAppliedPaymentComponent = ({ data }: Props) => {
  const [getSupplierAppliedAmountList] = useLazyQuery(
    GET_SUPPLIER_APPLIED_AMOUNT_LIST_QUERY
  );
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<AppliedPaymentType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data: paymentData } = await getSupplierAppliedAmountList({
            variables: {
              supplierpaymentid: data.paymentid,
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (paymentData.getSupplierAppliedAmountList) {
            params.success({
              rowData: paymentData.getSupplierAppliedAmountList.data,
              rowCount: paymentData.getSupplierAppliedAmountList.total,
            });
            if (!paymentData.getSupplierAppliedAmountList.data.length) {
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
    [dispatch, getSupplierAppliedAmountList, data.paymentid, parsedStoreId]
  );

  useEffect(() => {
    if (data.paymentid && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, data.supplierid, parsedStoreId]);

  return (
    <div className="card table-list-card">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={appliedPaymentsColumnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierAppliedPaymentComponent;
