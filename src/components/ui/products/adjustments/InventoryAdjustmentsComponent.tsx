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
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import InventoryAdjustmentChartView from "./InventoryAdjustmentChartView";
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

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "inventory-adjustments", sheetName: "Adjustments" });
  }, []);

  const outletOptions = (outlets as OutletType[]).map((o) => ({ label: o.outletname, value: o.outletid }));
  const warehouseOptions = (warehouses as WarehouseType[]).map((w) => ({ label: w.warehousename, value: w.warehouseid }));

  return (
    <>
      <InventoryAdjustmentsHeader onExport={handleExport} viewMode={viewMode} setViewMode={setViewMode} />
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
              <POSGrid
                ref={gridRef}
                columnDefs={inventoryAdjustmentColumnDefs}
                onGridReady={handleOnGridReady}
                defaultColDef={{ filter: true, floatingFilter: true }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryAdjustmentsComponent;
