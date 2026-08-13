"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import PaySupplierModal, { PAY_SUPPLIER } from "./PaySupplierModal";
import { exportAllRowsToExcel } from "@/lib/utils/exportAllRows";
import ExportProgressOverlay from "../../grid/ExportProgressOverlay";
import ExportScopeModal from "../../grid/ExportScopeModal";

const SupplierPaymentsComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getAPPaymentsList] = useLazyQuery(GET_SUPPLIER_PAYMENTS_QUERY);
  const dispatch = useAppDispatch();
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  // Pay Supplier modal
  const [paymentModal, setPaymentModal] = useState<string>("");

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
        const filters = filterVariables(params, debouncedSearch, "companyname, reference");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let variables: any = { storeid: parsedStoreId };
        if (selectedSupplier !== -1) {
          variables = { ...variables, supplierid: selectedSupplier };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getAPPaymentsList({ variables: { ...variables, ...filters } });
          if (data.getAPPaymentsList) {
            params.success({ rowData: data.getAPPaymentsList.data, rowCount: data.getAPPaymentsList.total });
            if (!data.getAPPaymentsList.data.length) gridRef.current?.api?.showNoRowsOverlay();
            else gridRef.current?.api?.hideOverlay();
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [parsedStoreId, selectedSupplier, dispatch, getAPPaymentsList, debouncedSearch]
  );

  const columnDefs = useMemo(() => {
    return [
      ...supplierPaymentColumnDefs,
      {
        headerName: "Actions",
        field: "paymentid",
        cellRenderer: (params: ICellRendererParams<SupplierPayment>) =>
          params.data ? <SupplierPaymentActions data={params.data} onVoid={handleVoidClick} /> : null,
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 80,
        minWidth: 52,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
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

  const [exportScopeModalOpen, setExportScopeModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ fetched: number; total: number } | null>(null);

  const buildExportFilters = useCallback((stripAll: boolean) => {
    const sortModel = (gridRef.current?.api?.getColumnState() ?? [])
      .filter((c) => c.sort)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((c) => ({ colId: c.colId, sort: c.sort as "asc" | "desc" }));
    if (stripAll) {
      return { filters: [] as { key: string; value: object }[], sortModel: [] as typeof sortModel };
    }
    const filterModel = gridRef.current?.api?.getFilterModel() ?? {};
    const fakeRequest = { startRow: 0, endRow: 1, filterModel, sortModel, groupKeys: [], rowGroupCols: [] };
    const filters = filterVariables({ request: fakeRequest }, debouncedSearch, "companyname, reference").filters;
    return { filters, sortModel };
  }, [debouncedSearch]);

  const runExport = useCallback(async (stripAll: boolean) => {
    setExportScopeModalOpen(false);
    setExportProgress({ fetched: 0, total: 0 });
    const { filters, sortModel } = buildExportFilters(stripAll);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let variables: any = { storeid: parsedStoreId };
    if (!stripAll && selectedSupplier !== -1) {
      variables = { ...variables, supplierid: selectedSupplier };
    }
    const result = await handleTryCatch(async () => {
      await exportAllRowsToExcel(
        gridRef.current?.api,
        async (page, perpage) => {
          const { data } = await getAPPaymentsList({
            variables: { ...variables, filters, sortModel, rowGroupCols: [], groupKeys: [], page, perpage },
          });
          return { data: data?.getAPPaymentsList?.data ?? [], total: data?.getAPPaymentsList?.total ?? 0 };
        },
        {
          fileName: "supplier-payments",
          sheetName: "Supplier Payments",
          onProgress: (fetched, total) => setExportProgress({ fetched, total }),
        }
      );
      return true;
    });
    setExportProgress(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [buildExportFilters, getAPPaymentsList, parsedStoreId, selectedSupplier, dispatch]);

  const handleExport = useCallback(() => {
    const filterModelActive = Object.keys(gridRef.current?.api?.getFilterModel() ?? {}).length > 0;
    const isFiltered = !!debouncedSearch || filterModelActive || selectedSupplier !== -1;
    if (isFiltered) {
      setExportScopeModalOpen(true);
    } else {
      runExport(true);
    }
  }, [debouncedSearch, selectedSupplier, runExport]);

  const handlePayModalClose = () => {
    setPaymentModal("");
    gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
  };

  return (
    <>
      <SupplierPaymentsHeader setPaymentModal={setPaymentModal} onExport={handleExport} />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid gridKey="supplier-payments"
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
                            masterDetail
              detailCellRenderer={SupplierAppliedPaymentComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>

      {paymentModal === PAY_SUPPLIER && (
        <PaySupplierModal
          storeId={parsedStoreId}
          outletId={parsedOutletId}
          closeModal={handlePayModalClose}
        />
      )}

      {showVoidModal && voidSupplierId && voidPaymentId && (
        <VoidPaymentModal
          setShowVoidModal={handleCloseVoidModal}
          storeId={parsedStoreId}
          outletId={parsedOutletId}
          supplierid={voidSupplierId}
          paymentid={voidPaymentId}
        />
      )}
      {exportScopeModalOpen && (
        <ExportScopeModal
          onClose={() => setExportScopeModalOpen(false)}
          onExportFiltered={() => runExport(false)}
          onExportAll={() => runExport(true)}
        />
      )}
      {exportProgress && (
        <ExportProgressOverlay fetched={exportProgress.fetched} total={exportProgress.total} />
      )}
    </>
  );
};

export default SupplierPaymentsComponent;
