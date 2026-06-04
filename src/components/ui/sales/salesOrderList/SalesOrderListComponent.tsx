"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { GET_SALES_ORDER_LIST_QUERY } from "@/lib/graphql/query/sales";
import { SalesOrderListType } from "@/types/sales";
import { salesOrderColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import SalesOrderHeader from "./SalesOrderHeader";
import SalesOrderEmailModal from "./SalesOrderEmailModal";
import { useParams, useRouter } from "next/navigation";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";

const SalesOrderListComponent = () => {
  const [getSalesOrderList] = useLazyQuery(GET_SALES_ORDER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { basePath } = useDefaultRoute();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact<SalesOrderListType>>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [selectedSalesOrderNumbers, setSelectedSalesOrderNumbers] = useState<number[]>([]);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState<SalesOrderListType[]>([]);

  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const config = getEnvironmentConfig();

  const handleOnGridReady = (params: GridReadyEvent<SalesOrderListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "salesorderno, customerid, custcompanyname, warehousename, statusname"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getSalesOrderList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getSalesOrderList) {
            params.success({
              rowData: data.getSalesOrderList.data,
              rowCount: data.getSalesOrderList.total,
            });
            if (!data.getSalesOrderList.data.length) {
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
    [selectedOutlet, dispatch, getSalesOrderList, debouncedSearch]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  const handleSelectionChanged = useCallback(() => {
    const selected: SalesOrderListType[] = gridRef.current?.api?.getSelectedRows?.() || [];
    const orderNumbers = selected
      .map((r) => Number(r.salesorderno))
      .filter((n) => Number.isFinite(n) && n > 0);
    setSelectedSalesOrderNumbers(orderNumbers);
    setSelectedSalesOrders(selected);
  }, []);

  const handlePrintSalesOrder = useCallback(async () => {
    if (!parsedStoreId || selectedSalesOrderNumbers.length === 0) return;

    const payload = {
      storeid: parsedStoreId,
      salesordernumbers: selectedSalesOrderNumbers,
    };

    const result = await handleTryCatch(async () => {
      const response = await api.post(
        `${config.apiUrl}/store/sales-order/print`,
        payload,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;
      if (data) {
        const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        const tab = window.open(url, "_blank");
        if (!tab) {
          // Fallback if popup blocked
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "sales-order.pdf");
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        dispatch(
          showNotification({
            message: "Sales order preview opened",
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
      }

      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  }, [config.apiUrl, dispatch, parsedStoreId, selectedSalesOrderNumbers]);

  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleEmailSalesOrder = useCallback(() => {
    if (!parsedStoreId || selectedSalesOrderNumbers.length === 0) return;
    setShowEmailModal(true);
  }, [parsedStoreId, selectedSalesOrderNumbers]);

  const handleCreateInvoiceFromOrder = useCallback(() => {
    const salesorderno = selectedSalesOrders[0]?.salesorderno;
    if (!salesorderno) return;
    router.push(`${basePath}/sales/invoice_from_order/${salesorderno}`);
  }, [selectedSalesOrders, router, basePath]);

  return (
    <>
      <SalesOrderHeader
        selectedSalesOrderNumbers={selectedSalesOrderNumbers}
        canCreateInvoice={(() => {
          if (selectedSalesOrders.length !== 1) return false;
          const so = selectedSalesOrders[0];
          const status = so?.statusname?.toLowerCase() ?? "";
          const isFullyInvoiced = status.includes("fully invoiced") || status.includes("fully");
          const isCancelled = status.includes("cancel");
          const isPending = status === "pending";
          return !isFullyInvoiced && !isCancelled && !isPending;
        })()}
        onPrintSalesOrder={handlePrintSalesOrder}
        onEmailSalesOrder={handleEmailSalesOrder}
        onCreateInvoiceFromOrder={handleCreateInvoiceFromOrder}
      />
      {showEmailModal && (
        <SalesOrderEmailModal
          storeId={parsedStoreId}
          salesOrderNumbers={selectedSalesOrderNumbers}
          onClose={() => setShowEmailModal(false)}
          onSent={(msg) => {
            setShowEmailModal(false);
            dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS }));
          }}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
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
              columnDefs={salesOrderColumnDefs}
              onGridReady={handleOnGridReady}
              onSelectionChanged={handleSelectionChanged}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              rowSelection={{
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
              suppressRowClickSelection
              suppressCellFocus
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesOrderListComponent;
