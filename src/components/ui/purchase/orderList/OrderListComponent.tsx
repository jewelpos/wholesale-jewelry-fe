"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { GET_PURCHASE_ORDER_ITEMS_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { PurchaseOrderItemsListType } from "@/types/purchase";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import OrderListHeader from "./OrderListHeader";
import { orderListColumnDefs } from "./ColumnDef";
import { exportAllRowsToExcel } from "@/lib/utils/exportAllRows";
import ExportProgressOverlay from "../../grid/ExportProgressOverlay";
import ExportScopeModal from "../../grid/ExportScopeModal";

const OrderListComponent = () => {
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getPurchaseOrderItemsList] = useLazyQuery(GET_PURCHASE_ORDER_ITEMS_LIST_QUERY, {
    fetchPolicy: "network-only",
  });
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const selectedOutletRef = useRef(selectedOutlet);
  const selectedSupplierRef = useRef(selectedSupplier);
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { selectedSupplierRef.current = selectedSupplier; }, [selectedSupplier]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const handleOnGridReady = (params: GridReadyEvent<PurchaseOrderItemsListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutletRef.current) {
          params.success({ rowData: [], rowCount: 0 });
          gridRef.current?.api?.showNoRowsOverlay();
          return;
        }
        const filters = filterVariables(
          params,
          debouncedSearchRef.current,
          "ponumber, itemcode, itemdescription, suppliername"
        );
        const supplier = selectedSupplierRef.current;

        const result = await handleTryCatch(async () => {
          const { data } = await getPurchaseOrderItemsList({
            variables: {
              outletid: selectedOutletRef.current,
              supplierid: supplier && supplier !== -1 ? supplier : undefined,
              ...filters,
            },
          });
          if (data.getPurchaseOrderItemsList) {
            params.success({
              rowData: data.getPurchaseOrderItemsList.data,
              rowCount: data.getPurchaseOrderItemsList.total,
            });
            if (!data.getPurchaseOrderItemsList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
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
    [dispatch, getPurchaseOrderItemsList]
  );

  useEffect(() => {
    if (gridReady) gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, selectedSupplier, debouncedSearch]);

  const columnDefs = useMemo(() => orderListColumnDefs, []);

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
    const filters = filterVariables(
      { request: fakeRequest },
      debouncedSearch,
      "ponumber, itemcode, itemdescription, suppliername"
    ).filters;
    return { filters, sortModel };
  }, [debouncedSearch]);

  const runExport = useCallback(async (stripAll: boolean) => {
    setExportScopeModalOpen(false);
    setExportProgress({ fetched: 0, total: 0 });
    const { filters, sortModel } = buildExportFilters(stripAll);
    const supplier = selectedSupplierRef.current;
    const result = await handleTryCatch(async () => {
      await exportAllRowsToExcel(
        gridRef.current?.api,
        async (page, perpage) => {
          const { data } = await getPurchaseOrderItemsList({
            variables: {
              outletid: selectedOutletRef.current,
              supplierid: !stripAll && supplier && supplier !== -1 ? supplier : undefined,
              filters, sortModel, rowGroupCols: [], groupKeys: [],
              page, perpage,
            },
          });
          return { data: data?.getPurchaseOrderItemsList?.data ?? [], total: data?.getPurchaseOrderItemsList?.total ?? 0 };
        },
        {
          fileName: "order-list",
          sheetName: "Order List",
          onProgress: (fetched, total) => setExportProgress({ fetched, total }),
        }
      );
      return true;
    });
    setExportProgress(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [buildExportFilters, getPurchaseOrderItemsList, dispatch]);

  const handleExport = useCallback(() => {
    if (!selectedOutletRef.current) return;
    const filterModelActive = Object.keys(gridRef.current?.api?.getFilterModel() ?? {}).length > 0;
    const supplier = selectedSupplierRef.current;
    const isFiltered = !!debouncedSearch || filterModelActive || (!!supplier && supplier !== -1);
    if (isFiltered) {
      setExportScopeModalOpen(true);
    } else {
      runExport(true);
    }
  }, [debouncedSearch, runExport]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <OrderListHeader onExport={handleExport} />
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            searchPlaceholder="Search PO #, item code, description, supplier"
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid gridKey="order-list"
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
            />
          </div>
        </div>
      </div>
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
    </div>
  );
};

export default OrderListComponent;
