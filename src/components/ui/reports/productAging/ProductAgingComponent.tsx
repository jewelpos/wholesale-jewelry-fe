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
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { filterVariables } from "@/lib/utils/gridFilters";
import { ItemAgingSummary } from "@/types/product";
import { productAgingColumnDefs } from "./ColumnDef";
import ProductAgingHeader from "./ProductAgingHeader";
import ProductAgingChartView from "./ProductAgingChartView";
import { GET_PRODUCT_AGING_LIST_QUERY } from "@/lib/graphql/query/products";
import { useParams } from "next/navigation";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import ReportSliderFilter from "@/components/ui/reports/shared/ReportSliderFilter";

const AGE_MARKS = { 0: "All", 30: "30d", 60: "60d", 90: "90d", 180: "180d", 365: "1yr" };

const ProductAgingComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getProductAgingList] = useLazyQuery(GET_PRODUCT_AGING_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"chart" | "grid">("grid");
  const [minAgeDays, setMinAgeDays] = useState(0);

  const handleOnGridReady = (params: GridReadyEvent<ItemAgingSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "itemcode, itemdescription, supplier, warehousename"
        );
        if (minAgeDays > 0) {
          filters.filters = [...filters.filters, { key: "age_days", value: { filterType: "number", type: "greaterThanOrEqual", filter: String(minAgeDays) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getProductAgingList({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              warehouseid: selectedWarehouse,
              ...filters,
            },
          });
          if (data.getProductAgingList) {
            const { data: rows, total } = data.getProductAgingList;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
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
    [parsedStoreId, selectedOutlet, selectedWarehouse, dispatch, getProductAgingList, debouncedSearch, minAgeDays]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, selectedOutlet, selectedWarehouse, gridReady, debouncedSearch]);

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "product-aging", sheetName: "Product Aging" });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <ProductAgingHeader onExport={handleExport} viewMode={viewMode} setViewMode={setViewMode} />

      <div className="card mb-2 border-0 shadow-sm" style={{ flexShrink: 0 }}>
        <div className="card-body p-2">
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <ReportSliderFilter
            label="Minimum Age"
            min={0}
            max={365}
            step={null}
            marks={AGE_MARKS}
            value={minAgeDays}
            onChange={(v) => setMinAgeDays(v as number)}
            color="#f59e0b"
          />
        </div>
      </div>

      {viewMode === "chart" ? (
        <ProductAgingChartView
          storeid={parsedStoreId}
          outletid={selectedOutlet}
          warehouseid={selectedWarehouse}
        />
      ) : (
        <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
          <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <POSGrid
                ref={gridRef}
                columnDefs={productAgingColumnDefs}
                onGridReady={handleOnGridReady}
                fillHeight
                              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAgingComponent;
