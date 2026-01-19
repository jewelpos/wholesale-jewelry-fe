"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import "ag-grid-enterprise";
import POSGrid from "../../grid/POSGrid";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { ColDef } from "ag-grid-community";

import { GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY } from "@/lib/graphql/query/customer";
import {
  CustomerCheckAppliedAmount,
  CustomerPaymentListType,
} from "@/types/customer";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

interface Props {
  data: CustomerPaymentListType;
}

const detailColumnDefs: ColDef<CustomerCheckAppliedAmount>[] = [
  {
    headerName: "Invoice #",
    field: "invoicenumber",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Applied date",
    field: "applieddate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) =>
      params.value ? dayjs(params.value).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Applied amount",
    field: "appliedamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Voided",
    field: "isvoided",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Credit invoice",
    field: "iscreditinvoice",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Last modified",
    field: "lastmodifieddate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) =>
      params.value ? dayjs(params.value).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
  },
];

const CustomerAppliedPaymentComponent = ({ data }: Props) => {
  const [getCustomerAppliedAmountList] = useLazyQuery(
    GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY
  );
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const parsedCustomerPaymentsId = useMemo(() => {
    const v = parseInt(String(data.transactionno), 10);
    return Number.isFinite(v) ? v : 0;
  }, [data.transactionno]);

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerCheckAppliedAmount>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const result = await handleTryCatch(async () => {
          const { data: paymentData } = await getCustomerAppliedAmountList({
            variables: {
              storeid: parsedStoreId,
              customerpaymentsid: parsedCustomerPaymentsId,
            },
          });

          if (paymentData.getCustomerAppliedAmountList) {
            params.success({
              rowData: paymentData.getCustomerAppliedAmountList,
              rowCount: paymentData.getCustomerAppliedAmountList.length,
            });

            if (!paymentData.getCustomerAppliedAmountList.length) {
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
    [dispatch, getCustomerAppliedAmountList, parsedCustomerPaymentsId, parsedStoreId]
  );

  useEffect(() => {
    if (parsedCustomerPaymentsId && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, parsedCustomerPaymentsId, parsedStoreId]);

  return (
    <div className="card table-list-card bg-gray-200">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={detailColumnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerAppliedPaymentComponent;
