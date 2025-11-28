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
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { filterVariables } from "@/lib/utils/gridFilters";
import { ItemAgingSummary } from "@/types/product";
import { productAgingColumnDefs } from "./ColumnDef";
import ProductAgingHeader from "./ProductAgingHeader";
import { GET_PRODUCT_AGING_LIST_QUERY } from "@/lib/graphql/query/products";
import { useParams } from "next/navigation";

const ProductAgingComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getProductAgingList] = useLazyQuery(GET_PRODUCT_AGING_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(
    -1
  );
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<ItemAgingSummary>
  ) => {
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
            params.success({
              rowData: rows,
              rowCount: total,
            });
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
      parsedStoreId,
      selectedOutlet,
      selectedWarehouse,
      dispatch,
      getProductAgingList,
      debouncedSearch,
    ]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, selectedWarehouse, gridReady, debouncedSearch]);

  return (
    <>
      <ProductAgingHeader />
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
              columnDefs={productAgingColumnDefs}
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

export default ProductAgingComponent;
