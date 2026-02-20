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
import { getEnvironmentConfig } from "@/lib/config/environment";
import { Modal } from "react-bootstrap";

const ProductsListComponent = () => {
  const [getProductList] = useLazyQuery(GET_PRODUCT_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [selectedProduct, setSelectedProduct] = useState<ProductListType | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const { currentMenu } = useMenu();

  const handleCloseImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const selectedProductImageUrl = useMemo(() => {
    const raw = String(selectedProduct?.itemimagepath || "").trim();
    if (!raw) return "";

    const config = getEnvironmentConfig();

    let resolved = raw;
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          resolved = String(parsed[0] || "");
        }
      } catch {
        resolved = raw;
      }
    }

    resolved = String(resolved || "").trim();
    if (!resolved) return "";

    if (/^https?:\/\//i.test(resolved)) return resolved;
    if (resolved.startsWith("/")) return `${config.apiUrl}${resolved}`;
    return `${config.apiUrl}/${resolved}`;
  }, [selectedProduct?.itemimagepath]);

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
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              rowSelection="single"
              onRowClicked={(event) => {
                setSelectedProduct(event.data || null);
                setIsImageModalOpen(true);
              }}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>

      <Modal show={isImageModalOpen} onHide={handleCloseImageModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Item Image{selectedProduct?.itemcode ? ` - ${selectedProduct.itemcode}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedProduct ? (
            <div className="text-muted">No item selected</div>
          ) : !selectedProductImageUrl ? (
            <div>
              <div className="text-muted">No image available</div>
              <div className="small mt-2">{selectedProduct.itemdescription || ""}</div>
            </div>
          ) : (
            <div>
              <div
                className="border rounded"
                style={{ width: "100%", height: 520, overflow: "hidden" }}
              >
                <img
                  src={selectedProductImageUrl}
                  alt={selectedProduct.itemdescription || "Product image"}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div className="small mt-2">{selectedProduct.itemdescription || ""}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductsListComponent;
