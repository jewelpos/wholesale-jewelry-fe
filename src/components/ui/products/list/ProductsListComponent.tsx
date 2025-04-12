"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";
import { GET_PRODUCT_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import { productListColumnDefs } from "./columnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";

const ProductsListComponent = () => {
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<ProductListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data } = await getProductList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
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
    [selectedOutlet, dispatch, getProductList]
  );

  useEffect(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady]);

  return (
    <div className="card-body p-2">
      <div className="table-top mb-2">
        <div className="search-set">
          <div className="search-input">
            <OutletsFilter
              fetchOutletsList={fetchOutletsList}
              outlets={outlets}
              loading={outletsLoading}
              setSelectedOutlet={setSelectedOutlet}
              selectedOutlet={selectedOutlet}
            />
          </div>
        </div>
      </div>
      <POSGrid
        ref={gridRef}
        columnDefs={productListColumnDefs}
        onGridReady={handleOnGridReady}
      />
    </div>
  );
};

export default ProductsListComponent;
