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
import { ProductActivityList, ProductActivityChartPoint } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import OutletsFilter from "../../grid/OutletsFilter";
import WarehouseFilter from "../../grid/WarehouseFilter";
import useOutlets from "@/hooks/useOutlets";
import useWarehouse from "@/hooks/useWarehouse";
import { useParams } from "next/navigation";
import { GET_PRODUCT_ACTIVITY_LIST_QUERY, GET_PRODUCT_ACTIVITY_CHART_QUERY, GET_PRODUCT_LIST_QUERY } from "@/lib/graphql/query/products";
import productActivityColumnDefs from "./ColumnDef";
import ProductActivitiesHeader from "./ProductActivitiesHeader";
import { exportAllRowsToExcel } from "@/lib/utils/exportAllRows";
import ExportProgressOverlay from "../../grid/ExportProgressOverlay";
import ExportScopeModal from "../../grid/ExportScopeModal";
import StockLevelChart from "./StockLevelChart";
import ActivityTimeline from "./ActivityTimeline";
import ActivitySummaryChart from "./ActivitySummaryChart";
import SelectProduct from "@/components/forms/SelectProduct";

const LABEL_STYLE = { fontSize: 12, fontWeight: 600, color: "#475569" } as const;

const ProductActivitiesComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [getProductActivitiesList] = useLazyQuery(GET_PRODUCT_ACTIVITY_LIST_QUERY);
  const [getProductActivityChart] = useLazyQuery(GET_PRODUCT_ACTIVITY_CHART_QUERY);
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();

  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(-1);

  useEffect(() => {
    if (parsedOutletId) setSelectedOutlet(parsedOutletId);
  }, [parsedOutletId]);

  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const { fetchWarehouseByStoreId, fetchWarehouseByOutletId, loading: warehousesLoading, warehouses } = useWarehouse();
  const fetchWarehousesList = useCallback(() => {
    if (selectedOutlet) {
      fetchWarehouseByOutletId(selectedOutlet);
    } else {
      fetchWarehouseByStoreId(parsedStoreId);
    }
  }, [fetchWarehouseByOutletId, fetchWarehouseByStoreId, selectedOutlet, parsedStoreId]);

  // Item search must be scoped to the same outlet the activity grid/chart is filtered
  // to — otherwise the picker surfaces items regardless of outlet (in practice, whatever
  // sorts first store-wide).
  const searchWarehouseId = useMemo(() => {
    if (selectedWarehouse && selectedWarehouse !== -1) return selectedWarehouse;
    return warehouses.find((w) => w.issystem)?.warehouseid ?? warehouses[0]?.warehouseid;
  }, [selectedWarehouse, warehouses]);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState<{ code: string; description: string } | null>(null);
  const [availableQty, setAvailableQty] = useState<number | null>(null);
  const [soQty, setSoQty] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [clearKey, setClearKey] = useState(0);

  const [chartData, setChartData] = useState<ProductActivityChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [detailView, setDetailView] = useState<"timeline" | "grid">("timeline");

  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<ProductActivityList>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const columnDefs = useMemo(
    () =>
      productActivityColumnDefs.map((col) =>
        col.field === "itemcode" || col.field === "itemdescription"
          ? { ...col, hide: !!selectedItemId }
          : col
      ),
    [selectedItemId]
  );

  const handleReset = useCallback(() => {
    setClearKey((k) => k + 1);
    setSelectedItemId(null);
    setSelectedItemInfo(null);
    setAvailableQty(null);
    setSoQty(null);
    setDateFrom("");
    setDateTo("");
  }, []);


  // "Available" (on-hand minus booked/reserved qty) isn't derivable from the activity
  // ledger, so it still comes from the live product list.
  useEffect(() => {
    if (!selectedItemId || !selectedOutlet) {
      setAvailableQty(null);
      setSoQty(null);
      return;
    }
    const filters: { key: string; value: object }[] = [
      { key: "itemid", value: { filterType: "text", type: "equals", filter: selectedItemId } },
    ];
    if (selectedWarehouse && selectedWarehouse !== -1) {
      filters.push({ key: "itemwarehouseid", value: { filterType: "text", type: "equals", filter: selectedWarehouse } });
    }
    getProductList({
      variables: { outletid: selectedOutlet, page: 1, perpage: 1, filters, sortModel: [], rowGroupCols: [], groupKeys: [] },
    }).then(({ data }) => {
      const row = data?.getProductListNew?.data?.[0];
      setAvailableQty(row?.availableqty ?? null);
      setSoQty(row?.soquantity ?? null);
    }).catch(() => { setAvailableQty(null); setSoQty(null); });
  }, [selectedItemId, selectedOutlet, selectedWarehouse, getProductList]);

  // On-hand is derived from the activity timeline's own running_balance (same number the
  // timeline displays and has been verified correct) rather than a separately-maintained
  // stock total, which can drift from the ledger if a past transaction mutated stock
  // incorrectly. Only valid when no date filter narrows the ledger — with dateFrom/dateTo
  // set, the balance calculation starts from 0 at the first row inside that window, not
  // the true all-time total, so we fall back to null rather than show a misleading number.
  const onHandQty = useMemo(() => {
    if (dateFrom || dateTo) return null;
    if (!chartData.length) return null;
    return chartData[chartData.length - 1].running_balance;
  }, [chartData, dateFrom, dateTo]);

  // Fetch chart data whenever item/outlet/warehouse/dates change
  useEffect(() => {
    if (!selectedItemId || !parsedStoreId) {
      setChartData([]);
      return;
    }
    setChartLoading(true);
    getProductActivityChart({
      variables: {
        storeid: parsedStoreId,
        itemid: selectedItemId,
        outletid: selectedOutlet ?? null,
        warehouseid: selectedWarehouse !== -1 ? selectedWarehouse : null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    }).then(({ data }) => {
      setChartData(data?.getProductActivityChart ?? []);
    }).catch(() => {
      setChartData([]);
    }).finally(() => {
      setChartLoading(false);
    });
  }, [selectedItemId, parsedStoreId, selectedOutlet, selectedWarehouse, dateFrom, dateTo, getProductActivityChart]);

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutlet || selectedWarehouse === -1) {
          params.success({ rowData: [], rowCount: 0 });
          gridRef.current?.api?.showNoRowsOverlay();
          return;
        }

        let filtersMain = filterVariables(params);

        filtersMain = { ...filtersMain, filters: [...filtersMain.filters, { key: "outletid", value: { filterType: "text", type: "equals", filter: selectedOutlet } }] };

        if (selectedWarehouse !== -1) {
          filtersMain = { ...filtersMain, filters: [...filtersMain.filters, { key: "warehouseid", value: { filterType: "text", type: "equals", filter: selectedWarehouse } }] };
        }
        if (selectedItemId) {
          filtersMain = { ...filtersMain, filters: [...filtersMain.filters, { key: "itemid", value: { filterType: "text", type: "equals", filter: selectedItemId } }] };
        }
        if (dateFrom || dateTo) {
          filtersMain = { ...filtersMain, filters: [...filtersMain.filters, { key: "transation_date", value: { filterType: "date", type: "inRange", dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }] };
        }

        const result = await handleTryCatch(async () => {
          const { data } = await getProductActivitiesList({ variables: { storeid: parsedStoreId, ...filtersMain } });
          if (data.getProductActivityList) {
            params.success({ rowData: data.getProductActivityList.data, rowCount: data.getProductActivityList.total });
            if (!data.getProductActivityList.data.length) {
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
    [dispatch, getProductActivitiesList, parsedStoreId, selectedOutlet, selectedWarehouse, selectedItemId, dateFrom, dateTo]
  );

  useEffect(() => {
    if (parsedStoreId && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, parsedStoreId]);

  const [exportScopeModalOpen, setExportScopeModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ fetched: number; total: number } | null>(null);

  const buildExportFilters = useCallback((stripAll: boolean) => {
    const sortModel = (gridRef.current?.api?.getColumnState() ?? [])
      .filter((c) => c.sort)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((c) => ({ colId: c.colId, sort: c.sort as "asc" | "desc" }));
    const baseFilters: { key: string; value: object }[] = [
      { key: "outletid", value: { filterType: "text", type: "equals", filter: selectedOutlet } },
    ];
    if (selectedWarehouse !== -1) {
      baseFilters.push({ key: "warehouseid", value: { filterType: "text", type: "equals", filter: selectedWarehouse } });
    }
    if (stripAll) {
      return { filters: baseFilters, sortModel: [] as typeof sortModel };
    }
    const filterModel = gridRef.current?.api?.getFilterModel() ?? {};
    const fakeRequest = { startRow: 0, endRow: 1, filterModel, sortModel, groupKeys: [], rowGroupCols: [] };
    let filters = [...baseFilters, ...filterVariables({ request: fakeRequest }).filters];
    if (selectedItemId) {
      filters = [...filters, { key: "itemid", value: { filterType: "text", type: "equals", filter: selectedItemId } }];
    }
    if (dateFrom || dateTo) {
      filters = [...filters, { key: "transation_date", value: { filterType: "date", type: "inRange", dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }];
    }
    return { filters, sortModel };
  }, [selectedOutlet, selectedWarehouse, selectedItemId, dateFrom, dateTo]);

  const runExport = useCallback(async (stripAll: boolean) => {
    setExportScopeModalOpen(false);
    setExportProgress({ fetched: 0, total: 0 });
    const { filters, sortModel } = buildExportFilters(stripAll);
    const result = await handleTryCatch(async () => {
      await exportAllRowsToExcel(
        gridRef.current?.api,
        async (page, perpage) => {
          const { data } = await getProductActivitiesList({
            variables: { storeid: parsedStoreId, filters, sortModel, rowGroupCols: [], groupKeys: [], page, perpage },
          });
          return { data: data?.getProductActivityList?.data ?? [], total: data?.getProductActivityList?.total ?? 0 };
        },
        {
          fileName: "product-activities",
          sheetName: "Product Activities",
          onProgress: (fetched, total) => setExportProgress({ fetched, total }),
        }
      );
      return true;
    });
    setExportProgress(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [buildExportFilters, getProductActivitiesList, parsedStoreId, dispatch]);

  const handleExport = useCallback(() => {
    if (!selectedOutlet || selectedWarehouse === -1) return;
    const filterModelActive = Object.keys(gridRef.current?.api?.getFilterModel() ?? {}).length > 0;
    const isFiltered = filterModelActive || !!selectedItemId || !!dateFrom || !!dateTo;
    if (isFiltered) {
      setExportScopeModalOpen(true);
    } else {
      runExport(true);
    }
  }, [selectedOutlet, selectedWarehouse, selectedItemId, dateFrom, dateTo, runExport]);

  const showCharts = !!selectedItemId;
  const showGrid = !showCharts || detailView === "grid";

  return (
    <>
      <ProductActivitiesHeader onExport={handleExport} />

      {/* filter bar */}
      <div className="card mb-3 border-0 shadow-sm">
        <div className="card-body p-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-1" style={LABEL_STYLE}>Product</label>
              <SelectProduct
                storeId={parsedStoreId}
                hasWarehouseId={true}
                warehouseId={searchWarehouseId}
                onChange={(itemId: number | null) => setSelectedItemId(itemId)}
                onChangeAdditional={(data: { itemcode?: string; itemdescription?: string } | null) => {
                  setSelectedItemInfo(data ? { code: data.itemcode ?? "", description: data.itemdescription ?? "" } : null);
                }}
                clearKey={clearKey}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={LABEL_STYLE}>Date From</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={LABEL_STYLE}>Date To</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <OutletsFilter
                fetchOutletsList={fetchOutletsList}
                outlets={outlets}
                loading={outletsLoading}
                setSelectedOutlet={setSelectedOutlet}
                selectedOutlet={selectedOutlet}
                stacked
              />
            </div>
            <div className="col-md-2">
              <WarehouseFilter
                fetchWarehousesList={fetchWarehousesList}
                warehouses={warehouses}
                loading={warehousesLoading}
                setSelectedWarehouse={setSelectedWarehouse}
                selectedWarehouse={selectedWarehouse}
                stacked
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleReset}
                title="Clear product and date filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* charts row — only when product selected */}
      {showCharts && (
        <div className="row g-3 mb-3">
          <div className="col-lg-7">
            <StockLevelChart
              data={chartLoading ? [] : chartData}
              itemLabel={chartLoading ? "Loading…" : undefined}
            />
          </div>
          <div className="col-lg-5">
            <ActivitySummaryChart data={chartLoading ? [] : chartData} onHandQty={onHandQty} availableQty={availableQty} soQty={soQty} />
          </div>
        </div>
      )}

      {/* detail view toggle — only when product selected */}
      {showCharts && (
        <div className="d-flex align-items-center gap-3 mb-2 px-1">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.3px" }}>DETAIL VIEW</span>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${detailView === "timeline" ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ fontSize: 12, padding: "4px 14px" }}
              onClick={() => setDetailView("timeline")}
            >
              Timeline
            </button>
            <button
              type="button"
              className={`btn ${detailView === "grid" ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ fontSize: 12, padding: "4px 14px" }}
              onClick={() => setDetailView("grid")}
            >
              Grid
            </button>
          </div>
        </div>
      )}

      {/* timeline — only when product selected and timeline active */}
      {showCharts && detailView === "timeline" && (
        <ActivityTimeline data={chartLoading ? [] : chartData} />
      )}

      {/* grid — always mounted; hidden only when product selected and timeline is active */}
      <div style={{ display: showGrid ? "block" : "none" }}>
        <div className="card table-list-card">
          {selectedItemInfo && (
            <div className="px-3 pt-2 pb-0 d-flex align-items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>ITEM</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selectedItemInfo.code}</span>
              {selectedItemInfo.description && (
                <span style={{ fontSize: 12, color: "#64748b" }}>— {selectedItemInfo.description}</span>
              )}
            </div>
          )}
          <div className="card-body p-2">
            <div className="ag-theme-quartz custom-theme">
              <POSGrid gridKey="product-activities"
                ref={gridRef}
                columnDefs={columnDefs}
                onGridReady={handleOnGridReady}
                defaultColDef={{ filter: true, floatingFilter: true }}
              />
            </div>
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
    </>
  );
};

export default ProductActivitiesComponent;
