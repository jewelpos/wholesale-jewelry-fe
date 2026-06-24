"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
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
import { GET_PRODUCT_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import { productListColumnDefs } from "./columnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import ProductsListHeader from "./ProductsListHeader";
import ProductActions from "./ProductActions";
import ProductListSummaryCards from "./ProductListSummaryCards";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import ProductFilterPills from "./ProductFilterPills";

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
  const debouncedSearch = useDebounce(search, 500);
  const { currentMenu } = useMenu();
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

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

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutlet || selectedWarehouse === -1) {
          return;
        }
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "itemcode, itemdescription"
        );
        if (selectedOutlet) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              {
                key: "outletid",
                value: {
                  filterType: "text",
                  type: "equals",
                  filter: selectedOutlet,
                },
              },
            ],
          };
        }
        if (selectedWarehouse !== -1) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              {
                key: "itemwarehouseid",
                value: {
                  filterType: "text",
                  type: "equals",
                  filter: selectedWarehouse,
                },
              },
            ],
          };
        }
        // Merge pill-driven filters
        const extraFilters: any[] = [];
        if (activeFilters.has("bulk"))
          extraFilters.push({ key: "hasbulkdiscount", value: { filterType: "number", type: "greaterThan", filter: 0 } });
        if (activeFilters.has("promo"))
          extraFilters.push({ key: "haspromotion", value: { filterType: "number", type: "greaterThan", filter: 0 } });
        if (activeFilters.has("zerostock"))
          extraFilters.push({ key: "itemquantityinhand", value: { filterType: "number", type: "lessThanOrEqual", filter: 0 } });
        const qfKeys = ["new", "soldtoday", "soldweek", "soldmonth"].filter(k => activeFilters.has(k));
        if (qfKeys.length > 0)
          extraFilters.push({ key: "__quickfilter__", value: { filterType: "text", type: "equals", filter: qfKeys.join(",") } });

        if (extraFilters.length > 0)
          filtersMain = { ...filtersMain, filters: [...filtersMain.filters, ...extraFilters] };

        const result = await handleTryCatch(async () => {
          const { data } = await getProductList({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getProductListNew) {
            params.success({
              rowData: data.getProductListNew.data,
              rowCount: data.getProductListNew.total,
            });
            if (!data.getProductListNew.data.length) {
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
      selectedOutlet,
      selectedWarehouse,
      dispatch,
      getProductList,
      debouncedSearch,
      activeFilters,
    ]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, selectedOutlet]);

  useEffect(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, selectedWarehouse, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...productListColumnDefs.filter((col) => col.headerName !== "Actions"),
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<ProductListType>) =>
          params.data ? (
            <ProductActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 185,
        minWidth: 185,
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
    [handleDeleteSuccess]
  );

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("product-list");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <ProductsListHeader />
      {isAdmin && !!selectedOutlet && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Product Summary">
          <ProductListSummaryCards outletid={selectedOutlet} />
        </SummaryPanelWrapper>
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
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
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
              rowSelection="single"
              defaultColDef={{
                filter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsListComponent;
