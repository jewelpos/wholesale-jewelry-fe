"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
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
import { GET_SALES_INVOICE_LIST_QUERY } from "@/lib/graphql/query/sales";
import { SalesInvoiceListType } from "@/types/sales";
import { salesInvoiceColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import SalesListHeader from "./SalesListHeader";
import { useDebounce } from "@/hooks/useDebounce";
import SalesActions from "./SalesActions";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import DocumentEmailModal from "../DocumentEmailModal";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import DailyStatusCards from "../../grid/DailyStatusCards";
import StatusFilterChips from "../../grid/StatusFilterChips";
import StatusPillRenderer from "../../grid/StatusPillRenderer";
import { GET_INVOICE_DAILY_SUMMARY_QUERY } from "@/lib/graphql/query/sales";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";

type DatePreset = "today" | "week" | "month" | "quarter" | "year";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Qtr",
  year: "This Year",
};

function getDateRange(preset: DatePreset): { startdate: string; enddate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);

  if (preset === "today") return { startdate: today, enddate: today };
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startdate: fmt(start), enddate: today };
  }
  if (preset === "month") {
    return { startdate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, enddate: today };
  }
  if (preset === "quarter") {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { startdate: fmt(qStart), enddate: today };
  }
  return { startdate: `${now.getFullYear()}-01-01`, enddate: today };
}

const SalesListComponent = () => {
  const [getInvoiceList] = useLazyQuery(GET_SALES_INVOICE_LIST_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(parsedOutletId || undefined);
  const gridRef = useRef<AgGridReact<SalesInvoiceListType>>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedInvoiceNumbers, setSelectedInvoiceNumbers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("month");

  useEffect(() => { if (parsedOutletId) setSelectedOutlet(parsedOutletId); }, [parsedOutletId]);

  const selectedOutletRef = useRef(selectedOutlet);
  const debouncedSearchRef = useRef(debouncedSearch);
  const statusFilterRef = useRef(statusFilter);
  const datePresetRef = useRef(datePreset);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { datePresetRef.current = datePreset; }, [datePreset]);

  const handleOnGridReady = (params: GridReadyEvent<SalesInvoiceListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    if (!selectedOutletRef.current) {
      params.success({ rowData: [], rowCount: 0 });
      gridRef.current?.api?.showNoRowsOverlay();
      return;
    }
    const filters = filterVariables(params, debouncedSearchRef.current, "invoicenumber, customerid, companyname");
    const sf = statusFilterRef.current;
    if (sf === "paid") {
      filters.filters = [
        ...filters.filters,
        { key: "balancedue", value: { filterType: "number", type: "lessThanOrEqual", filter: 0 } },
        { key: "statusname", value: { filterType: "text", type: "notContains", filter: "void" } },
      ];
    } else if (sf === "open") {
      filters.filters = [
        ...filters.filters,
        { key: "balancedue", value: { filterType: "number", type: "greaterThan", filter: 0 } },
        { key: "statusname", value: { filterType: "text", type: "notContains", filter: "void" } },
      ];
    } else if (sf === "void") {
      filters.filters = [
        ...filters.filters,
        { key: "statusname", value: { filterType: "text", type: "contains", filter: "void" } },
      ];
    }
    const { startdate, enddate } = getDateRange(datePresetRef.current);
    filters.filters = [
      ...filters.filters,
      { key: "saledate", value: { filterType: "date", type: "inRange", dateFrom: startdate, dateTo: enddate } },
    ];
    const result = await handleTryCatch(async () => {
      const { data } = await getInvoiceList({
        variables: { outletid: selectedOutletRef.current, ...filters },
      });
      if (data.getInvoiceList) {
        params.success({ rowData: data.getInvoiceList.data, rowCount: data.getInvoiceList.total });
        if (!data.getInvoiceList.data.length) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
        } else {
          gridRef.current?.api?.hideOverlay();
          const rows = data.getInvoiceList.data as SalesInvoiceListType[];
          const totals = rows.reduce(
            (acc, r) => {
              acc.numberofitems += Number(r.numberofitems || 0);
              acc.totalamount += Number(r.totalamount || 0);
              acc.discountamount += Number(r.discountamount || 0);
              acc.subtotal += Number(r.subtotal || 0);
              acc.salestax += Number(r.salestax || 0);
              acc.shipping += Number(r.shipping || 0);
              acc.netamount += Number(r.netamount || 0);
              acc.amountreceived += Number(r.amountreceived || 0);
              acc.balancedue += Number(r.balancedue || 0);
              return acc;
            },
            { numberofitems: 0, totalamount: 0, discountamount: 0, subtotal: 0, salestax: 0, shipping: 0, netamount: 0, amountreceived: 0, balancedue: 0 }
          );
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", [{
            invoicenumber: "Page Total" as unknown as number, ...totals,
          }]);
        }
      }
      return true;
    });
    if (result.error) {
      gridRef.current?.api?.showNoRowsOverlay();
      gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      params.fail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datasource = useRef({ getRows }).current;

  const handleDeleteSuccess = useCallback(() => {
    if (gridReady) gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [gridReady]);

  const handleSelectionChanged = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows?.() || [];
    const invoiceNumbers = selected
      .map((r) => Number(r.invoicenumber))
      .filter((n) => Number.isFinite(n) && n > 0);
    setSelectedInvoiceNumbers(invoiceNumbers);
  }, []);

  const handlePrintInvoice = useCallback(async () => {
    if (!parsedStoreId || selectedInvoiceNumbers.length === 0) return;

    setPrinting(true);
    const payload = {
      storeid: parsedStoreId,
      invoicenumbers: selectedInvoiceNumbers,
    };

    const result = await handleTryCatch(
      async () => {
        const response = await api.post(
          `/store/invoice/print`,
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
          setPdfPreview({ url, filename: "invoice.pdf" });
          dispatch(
            showNotification({
              message: "Invoice printed successfully",
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      },
      () => {
        setPrinting(false);
      }
    );

    if (result.error) {
      setPrinting(false);
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  }, [dispatch, parsedStoreId, selectedInvoiceNumbers]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...salesInvoiceColumnDefs.map((col) =>
        col.field === "statusname" ? { ...col, cellRenderer: StatusPillRenderer } : col
      ),
      {
        headerName: "Actions",
        field: "actions",
        width: 185,
        cellRenderer: (params: ICellRendererParams<SalesInvoiceListType>) => {
          if (params.node.rowPinned) {
            return null;
          }
          if (params.data) {
            return (
              <SalesActions
                data={params.data}
                node={params.node}
              />
            );
          }
          return null;
        },
        sortable: false,
        filter: false,
        maxWidth: 190,
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
    if (gridReady) gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, debouncedSearch, statusFilter, datePreset]);

  const handleEmailInvoice = useCallback(() => {
    if (selectedInvoiceNumbers.length > 0) setEmailModalOpen(true);
  }, [selectedInvoiceNumbers]);

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "invoices", sheetName: "Invoices" });
  }, []);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("invoice-list");

  const { startdate, enddate } = getDateRange(datePreset);
  const { data: summaryData, loading: summaryLoading } = useQuery(GET_INVOICE_DAILY_SUMMARY_QUERY, {
    variables: { outletid: selectedOutlet, startdate, enddate },
    skip: !selectedOutlet,
  });
  const summary = summaryData?.getInvoiceDailySummary ?? null;
  const periodLabel = DATE_PRESET_LABELS[datePreset];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <SalesListHeader
        selectedInvoiceNumbers={selectedInvoiceNumbers}
        onPrintInvoice={handlePrintInvoice}
        onEmailInvoice={handleEmailInvoice}
        onExport={handleExport}
      />
      {emailModalOpen && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="INVOICE"
          documentNumbers={selectedInvoiceNumbers}
          onClose={() => setEmailModalOpen(false)}
          onSent={(message) => {
            setEmailModalOpen(false);
            dispatch(showNotification({ message, type: NOTIFICATION_TYPES.SUCCESS }));
          }}
          onError={(message) => {
            dispatch(showNotification({ message, type: NOTIFICATION_TYPES.ERROR }));
          }}
        />
      )}
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Invoice Summary">
          <DailyStatusCards
            data={summary}
            loading={summaryLoading}
            labelOverrides={{
              revenue: `Revenue — ${periodLabel}`,
              total: `Invoices — ${periodLabel}`,
              avg: `Avg Invoice — ${periodLabel}`,
              open: `Open — ${periodLabel}`,
            }}
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
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginBottom: 8 }}>
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
            <div className="btn-group btn-group-sm">
              {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn ${datePreset === p ? "btn-secondary" : "btn-outline-secondary"}`}
                  style={{ fontSize: 11, padding: "3px 10px" }}
                  onClick={() => setDatePreset(p)}
                >
                  {DATE_PRESET_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              onSelectionChanged={handleSelectionChanged}
              fillHeight
                            rowSelection={{
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
              getRowStyle={(params) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : undefined
              }
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

export default SalesListComponent;
