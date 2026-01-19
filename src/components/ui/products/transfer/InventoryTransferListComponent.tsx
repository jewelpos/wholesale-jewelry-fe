"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { ColDef, GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { InventoryTransfer, UpdateInventoryTransferStatusInput } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import InventoryTransferItemsComponent from "./transferItems/InventoryTransferItemsComponent";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_INVENTORY_TRANSFER_LIST_QUERY } from "@/lib/graphql/query/products";
import { inventoryTransferColumnDefs } from "./ColumnDef";
import InventoryTransferListHeader from "./InventoryTransferListHeader";
import { CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION } from "@/lib/graphql/mutations/products";

const InventoryTransferListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getInventoryTransferList] = useLazyQuery(
    GET_INVENTORY_TRANSFER_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const [changeStatus] = useMutation(CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION);

  const handleOnGridReady = (params: GridReadyEvent<InventoryTransfer>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "transfersource, destination, transfertype, username"
        );
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
          const { data } = await getInventoryTransferList({
            variables: {
              storeid: parsedStoreId,
              ...filtersMain,
            },
          });
          if (data.getInventoryTransferList) {
            params.success({
              rowData: data.getInventoryTransferList.data,
              rowCount: data.getInventoryTransferList.total,
            });
            if (!data.getInventoryTransferList.data.length) {
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
      dispatch,
      getInventoryTransferList,
      debouncedSearch,
      selectedWarehouse,
    ]
  );

  const refreshGrid = () => {
    if (gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  };

  const handleChangeStatus = async (inventoryitemtransferid: number, transferstatusid: number) => {
    if (!parsedStoreId) return;

    const payload: UpdateInventoryTransferStatusInput = {
      storeid: parsedStoreId,
      inventoryitemtransferid,
      transferstatusid,
    };

    setActionLoadingId(inventoryitemtransferid);
    const result = await handleTryCatch(async () => {
      const response = await changeStatus({
        variables: {
          changeInventoryTransferStatusInput: payload,
        },
      });

      const successData = response.data?.changeInventoryTransferStatus;
      if (successData) {
        dispatch(
          showNotification({
            message: successData.message,
            type: successData.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          })
        );

        if (successData.success) {
          refreshGrid();
        }
      }

      return true;
    });

    setActionLoadingId(null);

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  const columnDefs = useMemo(() => {
    const actionsCol: ColDef<InventoryTransfer> = {
      headerName: "Actions",
      field: "inventoryitemtransferid",
      sortable: false,
      filter: false,
      width: 180,
      pinned: "right",
      cellRenderer: (params: { data?: InventoryTransfer }) => {
        const row = params.data;
        if (!row) return null;

        const id = Number(row.inventoryitemtransferid);
        const statusId = Number(row.transferstatusid);
        if (statusId !== 1) return null;

        const disabled = actionLoadingId === id;
        return (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-success"
              disabled={disabled}
              onClick={() => handleChangeStatus(id, 2)}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={disabled}
              onClick={() => handleChangeStatus(id, 5)}
            >
              Cancel
            </button>
          </div>
        );
      },
    };

    return [...inventoryTransferColumnDefs, actionsCol];
  }, [actionLoadingId, refreshGrid]);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedWarehouse, gridReady, parsedStoreId]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  return (
    <>
      <InventoryTransferListHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
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
              masterDetail
              detailCellRenderer={InventoryTransferItemsComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryTransferListComponent;
