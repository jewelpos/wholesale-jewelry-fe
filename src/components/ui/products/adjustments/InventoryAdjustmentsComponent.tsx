"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_INVENTORY_ADJUSTMENT_LIST_QUERY, GET_INVENTORY_ADJUSTMENT_CHART_QUERY } from "@/lib/graphql/query/products";
import { InventoryAdjustment, InventoryAdjustmentChartResponse } from "@/types/product";
import "ag-grid-enterprise";
import { inventoryAdjustmentColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useParams } from "next/navigation";
import POSGrid from "../../grid/POSGrid";
import InventoryAdjustmentsHeader from "./InventoryAdjustmentsHeader";
import SelectProduct from "@/components/forms/SelectProduct";
import { exportAllRowsToExcel } from "@/lib/utils/exportAllRows";
import ExportProgressOverlay from "../../grid/ExportProgressOverlay";
import ExportScopeModal from "../../grid/ExportScopeModal";
import InventoryAdjustmentChartView from "./InventoryAdjustmentChartView";
import ProductAdjustmentModal from "../list/ProductAdjustmentModal";
import useOutlets from "@/hooks/useOutlets";
import useWarehouse from "@/hooks/useWarehouse";
import { OutletType } from "@/types/outlet";
import { WarehouseType } from "@/types/warehouse";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
    {children}
  </label>
);

const InventoryAdjustmentsComponent = () => {
  const [getInventoryAdjustmentList] = useLazyQuery(GET_INVENTORY_ADJUSTMENT_LIST_QUERY);
  const [getInventoryAdjustmentChart] = useLazyQuery(GET_INVENTORY_ADJUSTMENT_CHART_QUERY);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = Number(outletIdParam);

  const { fetchOutletsList, outlets } = useOutlets();
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();

  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(-1);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"chart" | "grid">("grid");
  const [showNewAdjustmentModal, setShowNewAdjustmentModal] = useState(false);
  const [chartData, setChartData] = useState<InventoryAdjustmentChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Load outlets on mount, auto-select the active outlet from URL params
  useEffect(() => {
    if (parsedStoreId) fetchOutletsList([parsedStoreId]);
  }, [parsedStoreId, fetchOutletsList]);

  useEffect(() => {
    if (!(outlets as OutletType[]).length || selectedOutlet) return;
    const match = parsedOutletId
      ? (outlets as OutletType[]).find((o) => o.outletid === parsedOutletId)
      : undefined;
    setSelectedOutlet(match ? match.outletid : (outlets as OutletType[])[0].outletid);
  }, [outlets, selectedOutlet, parsedOutletId]);

  // When outlet changes, load its warehouses and auto-select system warehouse
  useEffect(() => {
    if (selectedOutlet) fetchWarehouseByOutletId(selectedOutlet);
  }, [selectedOutlet, fetchWarehouseByOutletId]);

  useEffect(() => {
    if (warehouses.length) {
      const systemWh = warehouses.find((w) => w.issystem) ?? warehouses[0];
      setSelectedWarehouse(systemWh.warehouseid);
    }
  }, [warehouses]);

  useEffect(() => {
    if (viewMode !== "chart" || !selectedOutlet || selectedWarehouse === -1 || !parsedStoreId) return;
    setChartLoading(true);
    getInventoryAdjustmentChart({
      variables: {
        storeid: parsedStoreId,
        outletid: selectedOutlet ?? null,
        warehouseid: selectedWarehouse !== -1 ? selectedWarehouse : null,
        itemid: selectedItemId ?? null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    }).then(({ data }) => {
      setChartData(data?.getInventoryAdjustmentChart ?? null);
    }).catch(() => {
      setChartData(null);
    }).finally(() => {
      setChartLoading(false);
    });
  }, [viewMode, selectedOutlet, selectedWarehouse, selectedItemId, dateFrom, dateTo, parsedStoreId, getInventoryAdjustmentChart]);

  const handleOnGridReady = (params: GridReadyEvent<InventoryAdjustment>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutlet || selectedWarehouse === -1) {
          params.success({ rowData: [], rowCount: 0 });
          gridRef.current?.api?.showNoRowsOverlay();
          return;
        }

        let filtersMain = filterVariables(params);

        filtersMain = {
          ...filtersMain,
          filters: [
            ...filtersMain.filters,
            { key: "outletid", value: { filterType: "text", type: "equals", filter: selectedOutlet } },
          ],
        };

        if (selectedWarehouse !== -1) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              { key: "warehouseid", value: { filterType: "text", type: "equals", filter: selectedWarehouse } },
            ],
          };
        }

        if (selectedItemId) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              { key: "itemid", value: { filterType: "text", type: "equals", filter: selectedItemId } },
            ],
          };
        }

        if (dateFrom || dateTo) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              {
                key: "adjusted_date",
                value: { filterType: "date", type: "inRange", dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
              },
            ],
          };
        }

        const result = await handleTryCatch(async () => {
          const { data } = await getInventoryAdjustmentList({
            variables: { storeid: parsedStoreId, ...filtersMain },
          });
          if (data.getInventoryAdjustmentList) {
            params.success({
              rowData: data.getInventoryAdjustmentList.data,
              rowCount: data.getInventoryAdjustmentList.total,
            });
            if (!data.getInventoryAdjustmentList.data.length) {
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
    [selectedOutlet, selectedWarehouse, selectedItemId, dateFrom, dateTo, dispatch, getInventoryAdjustmentList, parsedStoreId]
  );

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady]);

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
      filters = [...filters, { key: "adjusted_date", value: { filterType: "date", type: "inRange", dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }];
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
          const { data } = await getInventoryAdjustmentList({
            variables: { storeid: parsedStoreId, filters, sortModel, rowGroupCols: [], groupKeys: [], page, perpage },
          });
          return { data: data?.getInventoryAdjustmentList?.data ?? [], total: data?.getInventoryAdjustmentList?.total ?? 0 };
        },
        {
          fileName: "inventory-adjustments",
          sheetName: "Adjustments",
          onProgress: (fetched, total) => setExportProgress({ fetched, total }),
        }
      );
      return true;
    });
    setExportProgress(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [buildExportFilters, getInventoryAdjustmentList, parsedStoreId, dispatch]);

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

  const outletOptions = (outlets as OutletType[]).map((o) => ({ label: o.outletname, value: o.outletid }));
  const warehouseOptions = (warehouses as WarehouseType[]).map((w) => ({ label: w.warehousename, value: w.warehouseid }));

  return (
    <>
      <InventoryAdjustmentsHeader
        onExport={handleExport}
        onAddNew={() => setShowNewAdjustmentModal(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div className="card table-list-card">
        <div className="card-body p-2">

          {/* Filter bar */}
          <div className="container-fluid my-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <FieldLabel>Product</FieldLabel>
                <SelectProduct
                  storeId={parsedStoreId}
                  onChange={(itemId: number | null) => setSelectedItemId(itemId)}
                />
              </div>
              <div className="col-md-2">
                <FieldLabel>Date From</FieldLabel>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <FieldLabel>Date To</FieldLabel>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <FieldLabel>Outlet</FieldLabel>
                <select
                  className="form-select form-select-sm"
                  value={selectedOutlet ?? ""}
                  onChange={(e) => setSelectedOutlet(Number(e.target.value))}
                >
                  {outletOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <FieldLabel>Warehouse</FieldLabel>
                <select
                  className="form-select form-select-sm"
                  value={selectedWarehouse ?? ""}
                  onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                >
                  {warehouseOptions.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {viewMode === "chart" ? (
            <InventoryAdjustmentChartView data={chartData} loading={chartLoading} />
          ) : (
            <div className="ag-theme-quartz custom-theme">
              <POSGrid gridKey="inventory-adjustments"
                ref={gridRef}
                columnDefs={inventoryAdjustmentColumnDefs}
                onGridReady={handleOnGridReady}
                defaultColDef={{ filter: true, floatingFilter: true }}
              />
            </div>
          )}
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
      {showNewAdjustmentModal && (
        <ProductAdjustmentModal
          isOpen={showNewAdjustmentModal}
          onClose={() => setShowNewAdjustmentModal(false)}
          onSuccess={() => gridRef.current?.api?.refreshServerSide({ purge: true })}
        />
      )}
    </>
  );
};

export default InventoryAdjustmentsComponent;
