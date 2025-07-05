"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  GridReadyEvent,
  IServerSideGetRowsParams,
  ICellRendererParams,
  ColDef,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { GET_SUPPLIER_PAYMENTS_QUERY } from "@/lib/graphql/query/supplier";
import { SupplierPayment } from "@/types/supplier";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import SupplierPaymentsHeader from "./SupplierPaymentsHeader";
import { supplierPaymentColumnDefs } from "./ColumnDef";
import { useParams } from "next/navigation";
import SupplierAppliedPaymentComponent from "../appliedPayments/SupplierAppliedPaymentComponent";
import SupplierPaymentActions from "./SupplierPaymentActions";
import VoidPaymentModal from "../appliedPayments/VoidPaymentModal";

const SupplierPaymentsComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getAPPaymentsList] = useLazyQuery(GET_SUPPLIER_PAYMENTS_QUERY);
  const dispatch = useAppDispatch();
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(
    -1
  );
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  // Void payment modal state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidSupplierId, setVoidSupplierId] = useState<number | null>(null);
  const [voidPaymentId, setVoidPaymentId] = useState<number | null>(null);

  const handleVoidClick = (supplierid: number, paymentid: number) => {
    setVoidSupplierId(supplierid);
    setVoidPaymentId(paymentid);
    setShowVoidModal(true);
  };

  const handleCloseVoidModal = (value: boolean) => {
    setShowVoidModal(value);
    if (!value) {
      // Refresh grid after void action
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  };

  const handleOnGridReady = (params: GridReadyEvent<SupplierPayment>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "companyname, reference"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let variables: any = {
          storeid: parsedStoreId,
        };
        if (selectedSupplier !== -1) {
          variables = {
            ...variables,
            supplierid: selectedSupplier,
          };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getAPPaymentsList({
            variables: {
              ...variables,
              ...filters,
            },
          });
          if (data.getAPPaymentsList) {
            params.success({
              rowData: data.getAPPaymentsList.data,
              rowCount: data.getAPPaymentsList.total,
            });
            if (!data.getAPPaymentsList.data.length) {
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
    [
      parsedStoreId,
      selectedSupplier,
      dispatch,
      getAPPaymentsList,
      debouncedSearch,
    ]
  );

  const columnDefs = useMemo(() => {
    return [
      ...supplierPaymentColumnDefs,
      {
        headerName: "Actions",
        field: "paymentid", // Using paymentid as the field since it's part of SupplierPayment type
        cellRenderer: (params: ICellRendererParams<SupplierPayment>) =>
          params.data ? (
            <SupplierPaymentActions
              data={params.data}
              onVoid={handleVoidClick}
            />
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
      } as ColDef<SupplierPayment>,
    ];
  }, [handleVoidClick]);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedSupplier, gridReady, parsedStoreId]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  return (
    <>
      <SupplierPaymentsHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
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
              detailCellRenderer={SupplierAppliedPaymentComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
      {showVoidModal && voidSupplierId && voidPaymentId && (
        <VoidPaymentModal
          setShowVoidModal={handleCloseVoidModal}
          storeId={parsedStoreId}
          supplierid={voidSupplierId}
          paymentid={voidPaymentId}
        />
      )}
    </>
  );
};

export default SupplierPaymentsComponent;
