"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { PurchaseOrder } from "@/types/purchase";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../grid/POSGrid";
import PODetailDrawer from "./PODetailDrawer";
import POStatsCards from "./POStatsCards";
import CustomFilterSections from "../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { purchaseOrderColumnDefs } from "./ColumnDef";
import PurchaseOrderListHeader from "./PurchaseOrderListHeader";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import PurchaseOrderActions from "./PurchaseOrderActions";
import { exportGridToExcel } from "@/lib/utils/exportGrid";

const PurchaseOrderListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getPurchaseOrdersList] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(
    -1
  );
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [selectedPOs, setSelectedPOs] = useState<number[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const config = getEnvironmentConfig();

  const handleOnGridReady = (params: GridReadyEvent<PurchaseOrder>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "ponumber, suppliername"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let variables: any = {
          storeid: parsedStoreId,
        };
        if (selectedSupplier !== -1) {
          variables = {
            ...variables,
            supplierid: selectedSupplier,
          };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getPurchaseOrdersList({
            variables: {
              ...variables,
              ...filters,
            },
          });
          if (data.getSupplierPurchaseOrderList) {
            params.success({
              rowData: data.getSupplierPurchaseOrderList.data,
              rowCount: data.getSupplierPurchaseOrderList.total,
            });
            if (!data.getSupplierPurchaseOrderList.data.length) {
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
      selectedSupplier,
      dispatch,
      getPurchaseOrdersList,
      debouncedSearch,
    ]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, parsedStoreId]);

  const columnDefs = useMemo<ColDef<PurchaseOrder>[]>(
    () => [
      ...purchaseOrderColumnDefs,
      {
        headerName: "Actions",
        colId: "actions",
        cellRenderer: (params: ICellRendererParams<PurchaseOrder>) =>
          params.data ? (
            <PurchaseOrderActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 160,
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

  useEffect(() => {
    if (parsedStoreId && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, selectedSupplier, gridReady, parsedStoreId]);

  useEffect(() => {
    if (debouncedSearch && gridReady && gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, debouncedSearch]);

  const handleExport = async (poNumbers: number[], type: string) => {
    setLoading(true);
    const updatedPayload = {
      storeid: parsedStoreId,
      ponumbers: poNumbers,
    };
    const result = await handleTryCatch(
      async () => {
        dispatch(
          showNotification({
            message: "Processing request...",
            type: NOTIFICATION_TYPES.INFO,
          })
        );
        const response = await api.post(
          `${config.apiUrl}/store/purchase-order/print`,
          updatedPayload,
          {
            responseType: "blob", // <== CRITICAL
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { data } = response;
        if (data) {
          if (type === "export") {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "purchase_orders.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else {
            const url = window.URL.createObjectURL(data);
            window.open(url, "_blank");
          }
          dispatch(
            showNotification({
              message: data.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );

    if (result.error) {
      setLoading(false);
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <>
      <PurchaseOrderListHeader
        selectedPOs={selectedPOs}
        handleExport={handleExport}
        onExport={() => exportGridToExcel(gridRef.current?.api, { fileName: "purchase-orders", sheetName: "Purchase Orders" })}
        onEmail={() => setShowEmailModal(true)}
      />
      <POStatsCards
        storeid={parsedStoreId}
        supplierid={selectedSupplier}
      />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
              }}
              rowSelection={{
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
              onSelectionChanged={() => {
                const selected =
                  gridRef.current?.api
                    ?.getSelectedRows()
                    ?.map?.((row: PurchaseOrder) => Number(row.ponumber)) || [];
                setSelectedPOs(selected);
              }}
              onRowClicked={(e) => {
                const target = e.event?.target as HTMLElement | null;
                if (target?.closest(".ag-selection-checkbox")) return;
                if (target?.closest(".action-table-data")) return;
                if (e.data) setSelectedPO(e.data as PurchaseOrder);
              }}
              getRowStyle={(params) =>
                params.data?.ponumber === selectedPO?.ponumber
                  ? { background: "#eff6ff" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <PODetailDrawer
        po={selectedPO}
        storeid={parsedStoreId}
        onClose={() => setSelectedPO(null)}
      />

      {showEmailModal && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="PURCHASE_ORDER"
          documentNumbers={selectedPOs}
          onClose={() => setShowEmailModal(false)}
          onSent={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS }))}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
    </>
  );
};

export default PurchaseOrderListComponent;
