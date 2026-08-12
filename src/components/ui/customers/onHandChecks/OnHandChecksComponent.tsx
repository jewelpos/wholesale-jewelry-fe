"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { ColDef, GridReadyEvent, ICellRendererParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_CHEQUE_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerChequeListType, CheckOnHandType } from "@/types/customer";
import "ag-grid-enterprise";
import { onHandsColumnDefs } from "./ColumnDef";
import POSGridClient from "../../grid/POSGridClient";
import { useParams } from "next/navigation";
import OnHandChecksActions from "./OnHandChecksActions";
import AddOnHandChequeModal from "../CustomerChequeSummary.tsx/AddOnHandChequeModal";

interface Props {
  data: CustomerChequeListType;
}

// A customer's on-hand checks are a small list (never paginated in the UI) — fetched
// once in full and rendered client-side so domLayout="autoHeight" can size the detail
// row to fit its rows. AG Grid's server-side row model (used by POSGrid) doesn't
// support autoHeight, which is why this list previously showed a fixed-height grid.
const MAX_CHECKS = 500;

const OnHandChecksComponent = ({ data }: Props) => {
  const [editingCheck, setEditingCheck] = useState<CheckOnHandType | null>(null);
  const [getCustomerChequeList, { loading }] = useLazyQuery(GET_CUSTOMER_CHEQUE_LIST_QUERY, {
    fetchPolicy: "network-only",
  });
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const [rowData, setRowData] = useState<CustomerChequeListType[]>([]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerChequeListType>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchData = useCallback(async () => {
    const validCustomerId = Number.isInteger(Number(data.customerid)) && Number(data.customerid) > 0;
    if (!validCustomerId || !parsedStoreId) {
      setRowData([]);
      return;
    }
    // On-hand cheques are global by default (a held cheque is tied to the customer's
    // account, not one outlet) — no outlet filter applied here.
    const result = await handleTryCatch(async () => {
      const { data: chequeData } = await getCustomerChequeList({
        variables: {
          customerid: Number(data.customerid),
          storeid: parsedStoreId,
          page: 1,
          perpage: MAX_CHECKS,
          filters: [],
          sortModel: [],
          rowGroupCols: [],
          groupKeys: [],
        },
      });
      setRowData(chequeData?.getCustomerChequeList?.data ?? []);
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [data.customerid, parsedStoreId, getCustomerChequeList, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              retryFetchData={fetchData}
              onEdit={() =>
                setEditingCheck({
                  customercheckdetailid: params.data!.customercheckdetailid,
                  customerid: String(params.data!.customerid),
                  warehouseid: String(params.data!.warehouseid),
                  checkno: params.data!.checkno,
                  checkamount: String(params.data!.checkamount),
                  checkpostingdate: params.data!.checkpostingdate,
                  chkinvoiceno: params.data!.chkinvoiceno ?? "",
                })
              }
            />
          ) : null,
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 120,
        minWidth: 52,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [fetchData]
  );

  return (
    <div className="card table-list-card">
      <div className="card-body p-2">
        <POSGridClient
          gridKey="customer-onhand-checks"
          columnDefs={columnDefs}
          onGridReady={handleOnGridReady}
          rowData={rowData}
          loading={loading}
          domLayout="autoHeight"
        />
      </div>
      {editingCheck && (
        <AddOnHandChequeModal
          editEntry={editingCheck}
          setShowPrintModal={() => setEditingCheck(null)}
          triggerFetchSummary={fetchData}
        />
      )}
    </div>
  );
};

export default OnHandChecksComponent;
