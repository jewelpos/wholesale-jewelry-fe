"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  GridReadyEvent,
  IServerSideGetRowsParams,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import { useRouter, useParams } from "next/navigation";
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
import ActionFooter from "../../ActionFooter";

const CategoryComponent = () => {
  const router = useRouter();
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getItemCategoryList] = useLazyQuery(GET_ITEM_CATEGORY_LIST_QUERY);
  const dispatch = useAppDispatch();
  // Categories are global to the store — selectedOutlet/selectedWarehouse are an
  // optional narrow-down filter only, not required to load the list.
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
              // outletid routes to the right tenant DB; it's always the current route's
              // outlet, independent of the optional selectedOutlet narrow-down filter.
              outletid: parsedOutletId,
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
      parsedOutletId,
      selectedOutlet,
      selectedWarehouse,
      dispatch,
      getItemCategoryList,
      debouncedSearch,
    ]
  );

  useEffect(() => {
    if (gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [
    gridRef,
    datasource,
    gridReady,
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
        width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 120,
        minWidth: 52,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
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
            autoSelectCurrentOutlet={false}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
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
      <ActionFooter handleCancel={() => router.back()} cancelLabel="Close" />
    </>
  );
};

export default CategoryComponent;
