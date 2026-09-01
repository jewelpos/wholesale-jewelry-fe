"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useApolloClient, useLazyQuery, useQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  IServerSideGetRowsParams,
  ICellRendererParams,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import useMenu from "@/hooks/useMenu";
import { GET_PRODUCT_LIST_QUERY, GET_PRODUCT_LIST_SUMMARY_QUERY } from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import { makeProductColumnDefs } from "./columnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import ProductsListHeader from "./ProductsListHeader";
import ProductActions from "./ProductActions";
import ProductListSummaryCards from "./ProductListSummaryCards";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ProductFilterPills from "./ProductFilterPills";
import { exportAllRowsToExcel } from "@/lib/utils/exportAllRows";
import ExportProgressOverlay from "../../grid/ExportProgressOverlay";
import ExportScopeModal from "../../grid/ExportScopeModal";

const pageTotalFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const ProductsListComponent = () => {
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  // Mirrors exactly the filters the grid's last fetch used (search, column filters, pills,
  // outlet/warehouse) so the summary cards total up to what the grid is currently showing.
  const [activeGridFilters, setActiveGridFilters] = useState<any[]>([]);
  const debouncedSearch = useDebounce(search, 500);
  const { currentMenu } = useMenu();
  const apolloClient = useApolloClient();
  const apolloClientRef = useRef(apolloClient);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Overall total across every row matching the current filters (or the whole table
  // when there's no filter) — not just the page currently loaded in the grid. Shared
  // with the summary cards above so both reflect exactly the same number.
  const { data: summaryData, loading: summaryLoading } = useQuery(GET_PRODUCT_LIST_SUMMARY_QUERY, {
    variables: { outletid: selectedOutlet ?? 0, filters: activeGridFilters },
    skip: !selectedOutlet || selectedOutlet <= 0,
  });

  const SOLD_GROUP = ["soldtoday", "soldweek", "soldmonth"];

  const handlePillToggle = useCallback((key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (SOLD_GROUP.includes(key)) {
        SOLD_GROUP.forEach(k => next.delete(k));
        if (!prev.has(key)) next.add(key);
      } else {
        next.has(key) ? next.delete(key) : next.add(key);
      }
      return next;
    });
  }, []);

  const handlePillClear = useCallback(() => setActiveFilters(new Set()), []);

  const handleOnGridReady = (params: GridReadyEvent<ProductListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // Refs to hold latest filter values — avoids recreating the datasource on every filter change
  const selectedOutletRef = useRef(selectedOutlet);
  const selectedWarehouseRef = useRef(selectedWarehouse);
  const debouncedSearchRef = useRef(debouncedSearch);
  const activeFiltersRef = useRef(activeFilters);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { selectedWarehouseRef.current = selectedWarehouse; }, [selectedWarehouse]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { activeFiltersRef.current = activeFilters; }, [activeFilters]);

  // Stable datasource — created once, reads from refs so getRows always sees fresh values
  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const outlet = selectedOutletRef.current;
        const warehouse = selectedWarehouseRef.current;
        const search = debouncedSearchRef.current;
        const filters = activeFiltersRef.current;

        if (!outlet || warehouse === -1) {
          params.success({ rowData: [], rowCount: 0 });
          return;
        }
        let filtersMain = filterVariables(params, search, "itemcode, itemdescription, itembarcodeid, categoryname");
        filtersMain = {
          ...filtersMain,
          filters: [
            ...filtersMain.filters,
            { key: "outletid", value: { filterType: "text", type: "equals", filter: outlet } },
          ],
        };
        if (warehouse !== -1 && warehouse !== undefined) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              { key: "itemwarehouseid", value: { filterType: "text", type: "equals", filter: warehouse } },
            ],
          };
        }
        // Merge pill-driven filters
        const extraFilters: any[] = [];
        if (filters.has("bulk"))
          extraFilters.push({ key: "hasbulkdiscount", value: { filterType: "number", type: "greaterThan", filter: 0 } });
        if (filters.has("promo"))
          extraFilters.push({ key: "haspromotion", value: { filterType: "number", type: "greaterThan", filter: 0 } });
        if (filters.has("zerostock"))
          extraFilters.push({ key: "itemquantityinhand", value: { filterType: "number", type: "lessThanOrEqual", filter: 0 } });
        const qfKeys = ["new", "soldtoday", "soldweek", "soldmonth"].filter(k => filters.has(k));
        if (qfKeys.length > 0)
          extraFilters.push({ key: "__quickfilter__", value: { filterType: "text", type: "equals", filter: qfKeys.join(",") } });
        if (extraFilters.length > 0)
          filtersMain = { ...filtersMain, filters: [...filtersMain.filters, ...extraFilters] };

        setActiveGridFilters(filtersMain.filters);

        const result = await handleTryCatch(async () => {
          const { data } = await getProductList({ variables: { outletid: outlet, ...filtersMain } });
          if (data.getProductListNew) {
            const rows: ProductListType[] = data.getProductListNew.data;
            params.success({ rowData: rows, rowCount: data.getProductListNew.total });
            if (rows.length) {
              gridRef.current?.api?.hideOverlay();
            } else {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [dispatch, getProductList]
  );

  // Drives the pinned bottom row from the overall (filtered, or whole-table when no
  // filter is applied) total — independent of getRows above, which only sees whatever
  // page the grid last loaded.
  useEffect(() => {
    const stats = summaryData?.getProductListSummary;
    if (!stats || Number(stats.total_products ?? 0) === 0) {
      gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
      return;
    }
    gridRef.current?.api?.setGridOption("pinnedBottomRowData", [{
      itemcode: "Overall Total",
      itemquantityinhand: `${pageTotalFormatter.format(Number(stats.total_pcs ?? 0))} Pc / ${pageTotalFormatter.format(Number(stats.total_quantity ?? 0))} Wt`,
    }]);
  }, [summaryData]);

  const handleDeleteSuccess = useCallback(() => {
    if (gridReady) gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [gridReady]);

  // Patch just the adjusted row in place (Gmail-style instant update) instead of a full
  // grid purge+refetch — we already know the resulting quantity from the modal itself.
  // Falls back to a full refresh if the row isn't currently loaded in the grid's cache.
  const handleAdjustmentSuccess = useCallback(
    (updated?: { itemid: number; itemquantityinhand: number }) => {
      if (!gridReady) return;
      const api = gridRef.current?.api;
      if (!api) return;
      if (!updated) {
        api.refreshServerSide({ purge: true });
        return;
      }
      let patched = false;
      api.forEachNode((node) => {
        if (node.data?.itemid === updated.itemid) {
          node.setData({ ...node.data, itemquantityinhand: updated.itemquantityinhand });
          patched = true;
        }
      });
      if (!patched) api.refreshServerSide({ purge: true });
    },
    [gridReady]
  );

  // Set datasource once when grid is ready
  useEffect(() => {
    if (gridReady) gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
  }, [gridReady, datasource]);

  // Refresh data when any filter/search/outlet changes — initial load handled by Effect 1 (setGridOption triggers it)
  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeFilters, selectedOutlet, selectedWarehouse]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...makeProductColumnDefs(selectedOutletRef, apolloClientRef).filter((col) => col.headerName !== "Actions"),
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<ProductListType>) =>
          params.data && !params.node.rowPinned ? (
            <ProductActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
              onAdjustmentSuccess={handleAdjustmentSuccess}
            />
          ) : null,
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 185,
        minWidth: 52,
        suppressAutoSize: true,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressSizeToFit: true,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [handleDeleteSuccess, handleAdjustmentSuccess]
  );

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("product-list");

  const [exportScopeModalOpen, setExportScopeModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ fetched: number; total: number } | null>(null);

  const buildExportFilters = useCallback((stripAll: boolean) => {
    const sortModel = (gridRef.current?.api?.getColumnState() ?? [])
      .filter((c) => c.sort)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((c) => ({ colId: c.colId, sort: c.sort as "asc" | "desc" }));
    const outletFilter = [
      { key: "outletid", value: { filterType: "text", type: "equals", filter: selectedOutletRef.current } },
    ];
    if (stripAll) {
      return { filters: outletFilter, sortModel: [] as typeof sortModel };
    }
    return { filters: activeGridFilters, sortModel };
  }, [activeGridFilters]);

  const runExport = useCallback(async (stripAll: boolean) => {
    setExportScopeModalOpen(false);
    setExportProgress({ fetched: 0, total: 0 });
    const { filters, sortModel } = buildExportFilters(stripAll);
    const outlet = selectedOutletRef.current;
    const result = await handleTryCatch(async () => {
      await exportAllRowsToExcel(
        gridRef.current?.api,
        async (page, perpage) => {
          const { data } = await getProductList({
            variables: { outletid: outlet, filters, sortModel, rowGroupCols: [], groupKeys: [], page, perpage },
          });
          return { data: data?.getProductListNew?.data ?? [], total: data?.getProductListNew?.total ?? 0 };
        },
        {
          fileName: "products",
          sheetName: "Products",
          onProgress: (fetched, total) => setExportProgress({ fetched, total }),
        }
      );
      return true;
    });
    setExportProgress(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [buildExportFilters, getProductList, dispatch]);

  const handleExport = useCallback(() => {
    if (!selectedOutletRef.current) return;
    const filterModelActive = Object.keys(gridRef.current?.api?.getFilterModel() ?? {}).length > 0;
    const isFiltered =
      !!debouncedSearch ||
      filterModelActive ||
      activeFilters.size > 0 ||
      (selectedWarehouse !== -1 && selectedWarehouse !== undefined);
    if (isFiltered) {
      setExportScopeModalOpen(true);
    } else {
      runExport(true);
    }
  }, [debouncedSearch, activeFilters, selectedWarehouse, runExport]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <ProductsListHeader onExport={handleExport} />
      {isAdmin && !!selectedOutlet && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Product Summary">
          <ProductListSummaryCards stats={summaryData?.getProductListSummary} loading={summaryLoading} />
        </SummaryPanelWrapper>
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            searchPlaceholder="Search code, description, barcode, category"
            searchWidth={340}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <ProductFilterPills
            activeFilters={activeFilters}
            onToggle={handlePillToggle}
            onClear={handlePillClear}
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              gridKey="product-list"
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
              rowSelection="single"
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

export default ProductsListComponent;
