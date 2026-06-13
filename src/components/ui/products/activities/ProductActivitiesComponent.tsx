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
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import StockLevelChart from "./StockLevelChart";
import ActivityTimeline from "./ActivityTimeline";
import ActivitySummaryChart from "./ActivitySummaryChart";
import SelectProduct from "@/components/forms/SelectProduct";

const LABEL_STYLE = { fontSize: 12, fontWeight: 600, color: "#475569" } as const;

const ProductActivitiesComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [getProductActivitiesList] = useLazyQuery(GET_PRODUCT_ACTIVITY_LIST_QUERY);
  const [getProductActivityChart] = useLazyQuery(GET_PRODUCT_ACTIVITY_CHART_QUERY);
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();

  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(-1);

  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const { fetchWarehouseByStoreId, fetchWarehouseByOutletId, loading: warehousesLoading, warehouses } = useWarehouse();
  const fetchWarehousesList = useCallback(() => {
    if (selectedOutlet) {
      fetchWarehouseByOutletId(selectedOutlet);
    } else {
      fetchWarehouseByStoreId(parsedStoreId);
    }
  }, [fetchWarehouseByOutletId, fetchWarehouseByStoreId, selectedOutlet, parsedStoreId]);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState<{ code: string; description: string } | null>(null);
  const [onHandQty, setOnHandQty] = useState<number | null>(null);
  const [availableQty, setAvailableQty] = useState<number | null>(null);
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
    setOnHandQty(null);
    setAvailableQty(null);
    setDateFrom("");
    setDateTo("");
  }, []);


  // Fetch actual on-hand qty from product list whenever item/outlet/warehouse changes
  useEffect(() => {
    if (!selectedItemId || !selectedOutlet) {
      setOnHandQty(null);
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
      setOnHandQty(row?.itemquantityinhand ?? null);
      setAvailableQty(row?.availableqty ?? null);
    }).catch(() => { setOnHandQty(null); setAvailableQty(null); });
  }, [selectedItemId, selectedOutlet, selectedWarehouse, getProductList]);

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

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "product-activities", sheetName: "Product Activities" });
  }, []);

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
            <ActivitySummaryChart data={chartLoading ? [] : chartData} onHandQty={onHandQty} availableQty={availableQty} />
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
              <POSGrid
                ref={gridRef}
                columnDefs={columnDefs}
                onGridReady={handleOnGridReady}
                defaultColDef={{ filter: true, floatingFilter: true }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductActivitiesComponent;
