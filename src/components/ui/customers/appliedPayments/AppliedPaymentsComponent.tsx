"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_PAYMENT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerPaymentListType } from "@/types/customer";
import "ag-grid-enterprise";
import { appliedPaymentsColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import AppliedPaymentHeader from "./AppliedPaymentHeader";
import PaymentModal from "./PaymentModal";
import CustomerAppliedPaymentComponent from "./CustomerAppliedPaymentComponent";
import CustomerPaymentActions from "./CustomerPaymentActions";
import { paymentModalTypes } from "@/lib/config/constants";

const AppliedPaymentsComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [getCustomerPaymentList] = useLazyQuery(
    GET_CUSTOMER_PAYMENT_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [paymentModal, setPaymentModal] = useState<string>("");
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidRow, setVoidRow] = useState<CustomerPaymentListType | null>(null);

  const handleVoidClick = (row: CustomerPaymentListType) => {
    setVoidRow(row);
    setPaymentModalAndSyncUrl(paymentModalTypes.add_void_payment);
  };

  const setPaymentModalAndSyncUrl = (value: string) => {
    if (!value) {
      setPaymentModal("");
      router.replace(pathname);

      if (voidRow) {
        setVoidRow(null);
        gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
      }
      return;
    }
    setPaymentModal(value);
    router.replace(`${pathname}?modal=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    const modal = searchParams.get("modal");
    if (modal) {
      setPaymentModal(modal);
    }
  }, [searchParams]);

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerPaymentListType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filtersMain = filterVariables(
          params,
          debouncedSearch,
          "transactionno, custcompanyname"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getCustomerPaymentList({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getCustomerPaymentList) {
            params.success({
              rowData: data.getCustomerPaymentList.data,
              rowCount: data.getCustomerPaymentList.total,
            });
            if (!data.getCustomerPaymentList.data.length) {
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
    [selectedOutlet, dispatch, getCustomerPaymentList, debouncedSearch]
  );

  const columnDefs = useMemo(() => {
    return [
      ...appliedPaymentsColumnDefs,
      {
        headerName: "Actions",
        field: "transactionno",
        cellRenderer: (params: ICellRendererParams<CustomerPaymentListType>) =>
          params.data ? (
            <CustomerPaymentActions data={params.data} onVoid={handleVoidClick} />
          ) : null,
        width: 120,
        sortable: false,
        filter: false,
        maxWidth: 150,
        pinned: "right",
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      } as ColDef<CustomerPaymentListType>,
    ];
  }, [handleVoidClick]);

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  return (
    <>
      <AppliedPaymentHeader setPaymentModal={setPaymentModalAndSyncUrl} />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              masterDetail
              detailCellRenderer={CustomerAppliedPaymentComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
      {paymentModal && (
        <PaymentModal
          paymentModal={paymentModal}
          setPaymentModal={setPaymentModalAndSyncUrl}
          voidRow={voidRow}
        />
      )}
    </>
  );
};

export default AppliedPaymentsComponent;
