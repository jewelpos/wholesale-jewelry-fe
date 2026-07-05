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
import { useRouter } from "next/navigation";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import SubCategoryHeader from "./SubCategoryHeader";
import { GET_ITEM_SUB_CATEGORY_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductSubItemCategoryType, Subcategory } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { subCategoryColumnDefs } from "./columnDef";
import SubcategoryModal from "./SubcategoryModal";
import SubcategoryActions from "./SubcategoryActions";
import ActionFooter from "../../ActionFooter";

const SubCategoryComponent = () => {
  const router = useRouter();
  const [getItemSubCategoryList] = useLazyQuery(
    GET_ITEM_SUB_CATEGORY_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<Subcategory | null>(null);

  const handleOnGridReady = (
    params: GridReadyEvent<ProductSubItemCategoryType>
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
          "subcategoryname, categoryid, subcategorydescription"
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
          const { data } = await getItemSubCategoryList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getItemSubCategoryList) {
            params.success({
              rowData: data.getItemSubCategoryList.data,
              rowCount: data.getItemSubCategoryList.total,
            });
            if (!data.getItemSubCategoryList.data.length) {
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
      getItemSubCategoryList,
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

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditData(subcategory);
    setIsModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the grid data after successful deletion
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  };

  // Create column definitions with Actions column (following CategoryComponent pattern)
  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...subCategoryColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (
          params: ICellRendererParams<ProductSubItemCategoryType>
        ) =>
          params.data ? (
            <SubcategoryActions
              {...params}
              onEditSubcategory={handleEditSubcategory}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 120,
        minWidth: 120,
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
    [handleEditSubcategory, handleDeleteSuccess]
  );

  return (
    <>
      <SubCategoryHeader onOpenModal={handleOpenModal} />
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
                          />
          </div>
        </div>
      </div>
      <SubcategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />
      <ActionFooter handleCancel={() => router.back()} cancelLabel="Close" />
    </>
  );
};

export default SubCategoryComponent;
