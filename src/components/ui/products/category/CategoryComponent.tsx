"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  GridReadyEvent,
  IServerSideGetRowsParams,
  ColDef,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { GET_ITEM_CATEGORY_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductItemCategoryType, Category } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { categoryColumnDefs } from "./ColumnDefs";
import CategoryHeader from "./CategoryHeader";
import CategoryModal from "./CategoryModal";
import CategoryActions from "./CategoryActions";
import { ICellRendererParams } from "ag-grid-community";

const CategoryComponent = () => {
  const [getItemCategoryList] = useLazyQuery(GET_ITEM_CATEGORY_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<Category | null>(null);

  const handleOnGridReady = (
    params: GridReadyEvent<ProductItemCategoryType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        let filters = filterVariables(
          params,
          debouncedSearch,
          "categoryname, categorycode, categorydescription"
        );
        if (selectedOutlet) {
          filters = {
            ...filters,
            filters: [
              ...filters.filters,
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
          filters = {
            ...filters,
            filters: [
              ...filters.filters,
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
          const { data } = await getItemCategoryList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getItemCategoryList) {
            params.success({
              rowData: data.getItemCategoryList.data,
              rowCount: data.getItemCategoryList.total,
            });
            if (!data.getItemCategoryList.data.length) {
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
      getItemCategoryList,
      debouncedSearch,
    ]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [
    gridRef,
    datasource,
    selectedOutlet,
    selectedWarehouse,
    gridReady,
    debouncedSearch,
  ]);

  // Modal handlers
  const handleOpenModal = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleModalSuccess = () => {
    // Refresh the grid data
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditData(category);
    setIsModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the grid data after successful deletion
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  };

  // Create column definitions with Actions column (following CustomerListComponent pattern)
  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...categoryColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<ProductItemCategoryType>) =>
          params.data ? (
            <CategoryActions
              {...params}
              onEditCategory={handleEditCategory}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 120,
        sortable: false,
        filter: false,
        maxWidth: 150,
        pinned: "right",
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [handleEditCategory, handleDeleteSuccess]
  );

  return (
    <>
      <CategoryHeader onOpenModal={handleOpenModal} />
      <div className="card table-list-card">
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
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />
    </>
  );
};

export default CategoryComponent;
