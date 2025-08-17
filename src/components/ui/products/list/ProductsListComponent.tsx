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
import useOutlets from "@/hooks/useOutlets";
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

const ProductsListComponent = () => {
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const { currentMenu } = useMenu();

  const handleOnGridReady = (params: GridReadyEvent<ProductListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
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
        const result = await handleTryCatch(async () => {
          const { data } = await getProductList({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getProductList) {
            params.success({
              rowData: data.getProductList.data,
              rowCount: data.getProductList.total,
            });
            if (!data.getProductList.data.length) {
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
    [selectedOutlet, dispatch, getProductList, debouncedSearch]
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
  }, [gridRef, datasource, selectedOutlet, gridReady]);

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
        width: 80,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [handleDeleteSuccess]
  );

  return (
    <>
      <ProductsListHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
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
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsListComponent;
