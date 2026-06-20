"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
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
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import DailyStatusCards from "../../grid/DailyStatusCards";
import StatusFilterChips from "../../grid/StatusFilterChips";
import StatusPillRenderer from "../../grid/StatusPillRenderer";
import { GET_SO_DAILY_SUMMARY_QUERY } from "@/lib/graphql/query/sales";
import { useParams, useRouter } from "next/navigation";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

const SalesOrderListComponent = () => {
  const [getSalesOrderList] = useLazyQuery(GET_SALES_ORDER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { basePath } = useDefaultRoute();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact<SalesOrderListType>>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [selectedSalesOrderNumbers, setSelectedSalesOrderNumbers] = useState<number[]>([]);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState<SalesOrderListType[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const config = getEnvironmentConfig();

  useEffect(() => { if (parsedOutletId) setSelectedOutlet(parsedOutletId); }, [parsedOutletId]);

  const selectedOutletRef = useRef(selectedOutlet);
  const debouncedSearchRef = useRef(debouncedSearch);
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

  const handleOnGridReady = (params: GridReadyEvent<SalesOrderListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    if (!selectedOutletRef.current) {
      params.success({ rowData: [], rowCount: 0 });
      gridRef.current?.api?.showNoRowsOverlay();
      return;
    }
    const filters = filterVariables(
      params,
      debouncedSearchRef.current,
      "salesorderno, customerid, custcompanyname, warehousename, statusname"
    );
    const sf = statusFilterRef.current;
    if (sf) {
      filters.filters = [
        ...filters.filters,
        { key: "statusname", value: { filterType: "text", type: "contains", filter: sf } },
      ];
    }
    const result = await handleTryCatch(async () => {
      const { data } = await getSalesOrderList({
        variables: { outletid: selectedOutletRef.current, ...filters },
      });
      if (data.getSalesOrderList) {
        params.success({ rowData: data.getSalesOrderList.data, rowCount: data.getSalesOrderList.total });
        if (!data.getSalesOrderList.data.length) gridRef.current?.api?.showNoRowsOverlay();
        else gridRef.current?.api?.hideOverlay();
      }
      return true;
    });
    if (result.error) {
      gridRef.current?.api?.showNoRowsOverlay();
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      params.fail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datasource = useRef({ getRows }).current;

  useEffect(() => {
    if (gridReady) gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, debouncedSearch, statusFilter]);

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
        setPdfPreview({ url, filename: "sales-order.pdf" });
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

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "sales-orders", sheetName: "Sales Orders" });
  }, []);

  const handleCreateInvoiceFromOrder = useCallback(() => {
    const salesorderno = selectedSalesOrders[0]?.salesorderno;
    if (!salesorderno) return;
    router.push(`${basePath}/sales/invoice_from_order/${salesorderno}`);
  }, [selectedSalesOrders, router, basePath]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("so-list");

  const columnDefs = useMemo(
    () => salesOrderColumnDefs.map((col) =>
      col.field === "statusname" ? { ...col, cellRenderer: StatusPillRenderer } : col
    ),
    []
  );

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_SO_DAILY_SUMMARY_QUERY, {
    variables: { outletid: selectedOutlet },
    skip: !selectedOutlet,
  });
  const summary = summaryData?.getSODailySummary ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
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
        onExport={handleExport}
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
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Sales Order Daily Summary">
          <DailyStatusCards
            data={summary}
            loading={summaryLoading}
            labelOverrides={{ revenue: "Value Today", total: "Orders Today", avg: "Avg Order", open: "Open Today" }}
          />
        </SummaryPanelWrapper>
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
          />
          <StatusFilterChips
            active={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              gridRef.current?.api?.refreshServerSide({ purge: true });
            }}
            counts={{
              total: summary?.total_today ?? 0,
              paid: summary?.paid_today ?? 0,
              pending: summary?.pending_today ?? 0,
              voided: summary?.voided_today ?? 0,
            }}
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              onSelectionChanged={handleSelectionChanged}
              fillHeight
              defaultColDef={{
                filter: !debouncedSearch,
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
      {pdfPreview && (
        <PdfPreviewModal
          pdfUrl={pdfPreview.url}
          filename={pdfPreview.filename}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
};

export default SalesOrderListComponent;
