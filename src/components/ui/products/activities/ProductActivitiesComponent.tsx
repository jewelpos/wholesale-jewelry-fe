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
import { ProductActivityList } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_PRODUCT_ACTIVITY_LIST_QUERY } from "@/lib/graphql/query/products";
import productActivityColumnDefs from "./ColumnDef";
import ProductActivitiesHeader from "./ProductActivitiesHeader";

const ProductActivitiesComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getProductActivitiesList] = useLazyQuery(
    GET_PRODUCT_ACTIVITY_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<ProductActivityList>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const columnDefs = useMemo(() => productActivityColumnDefs, []);

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutlet || selectedWarehouse === -1) {
          return false;
        }
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "itemcode, transaction_type, reference"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const variables: any = {
          storeid: parsedStoreId,
        };
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
                key: "warehouseid",
                value: {
                  filterType: "text",
                  type: "equals",
                  filter: selectedWarehouse,
                },
              },
            ],
          };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getProductActivitiesList({
            variables: {
              ...variables,
              ...filtersMain,
            },
          });
          if (data.getProductActivityList) {
            params.success({
              rowData: data.getProductActivityList.data,
              rowCount: data.getProductActivityList.total,
            });
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
      dispatch,
      getProductActivitiesList,
      parsedStoreId,
      debouncedSearch,
      selectedOutlet,
      selectedWarehouse,
    ]
  );

  useEffect(() => {
    if (parsedStoreId && gridReady && selectedOutlet) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [
    gridRef,
    datasource,
    gridReady,
    parsedStoreId,
    selectedOutlet,
    selectedWarehouse,
  ]);

  return (
    <>
      <ProductActivitiesHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
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

export default ProductActivitiesComponent;
