"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useQuery } from "@apollo/client";
import {
  GridReadyEvent,
  IServerSideGetRowsParams,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-enterprise";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch } from "@/lib/store/hook";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { GET_MEMO_LIST_QUERY } from "@/lib/graphql/query/sales";
import { MemoSummary, MemoSummaryTotals } from "@/types/sales";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import MemoListHeader from "./MemoListHeader";
import MemoActions from "./MemoActions";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";
import DailyStatusCards from "@/components/ui/grid/DailyStatusCards";
import StatusFilterChips from "@/components/ui/grid/StatusFilterChips";
import StatusPillRenderer from "@/components/ui/grid/StatusPillRenderer";
import { GET_MEMO_DAILY_SUMMARY_QUERY } from "@/lib/graphql/query/sales";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import DocumentEmailModal from "../DocumentEmailModal";

const dateRenderer = (params: ICellRendererParams) =>
  params.node.rowPinned === "bottom" || params.value == null
    ? ""
    : dayjs(Number(params.value)).format(TIME_FORMAT);

const memoColumnDefs: ColDef<MemoSummary>[] = [
  { headerName: "Memo #",   field: "memonumber",  filter: "agNumberColumnFilter" },
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    filter: "agTextColumnFilter",
    valueGetter: (params) => {
      if (!params.data || params.node?.rowPinned) return "";
      return `${params.data.customerid} - ${params.data.companyname ?? ""}`;
    },
  },
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter", cellRenderer: StatusPillRenderer },
  { headerName: "Mode",     field: "salemodename", filter: "agTextColumnFilter" },
  { headerName: "Date",     field: "saledate",    filter: "agDateColumnFilter", cellRenderer: dateRenderer },
  { headerName: "Items",    field: "numberofitems", filter: "agNumberColumnFilter" },
  { headerName: "Total",    field: "totalamount",  filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Discount", field: "discountamount", filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Subtotal", field: "subtotal",     filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Tax",      field: "salestax",     filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Shipping", field: "shipping",     filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Net",      field: "netamount",    filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Received", field: "amountreceived", filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Balance",  field: "balancedue",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Terms",    field: "termsname",    filter: "agTextColumnFilter" },
  { headerName: "Warehouse", field: "warehousename", filter: "agTextColumnFilter" },
  { headerName: "Created By", field: "createby",   filter: "agTextColumnFilter" },
  { headerName: "Modified By", field: "lastmodifiedby", filter: "agTextColumnFilter" },
  {
    headerName: "Modified Date",
    field: "lastmodifieddate",
    filter: "agDateColumnFilter",
    cellRenderer: dateRenderer,
  },
  {
    headerName: "Credit Applied",
    field: "custcrediapplied",
    filter: "agTextColumnFilter",
    valueGetter: (params) => {
      if (!params.data || params.node?.rowPinned) return "";
      if (params.data.salemodename !== "Memo Credit") return "";
      return Number(params.data.custcrediapplied) === 1 ? "Yes" : "No";
    },
  },
  {
    headerName: "Actions",
    cellRenderer: (params: ICellRendererParams<MemoSummary>) => {
      if (params.node.rowPinned || !params.data) return null;
      return <MemoActions data={params.data} />;
    },
    pinned: "right",
    maxWidth: 100,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
  },
];

const MemoListComponent = () => {
  const [getMemoList] = useLazyQuery(GET_MEMO_LIST_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact<MemoSummary>>(null);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [selectedMemoNumbers, setSelectedMemoNumbers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [gridReady, setGridReady] = useState(false);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const config = getEnvironmentConfig();

  const debouncedSearchRef = useRef(debouncedSearch);
  const selectedWarehouseRef = useRef(selectedWarehouse);
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { selectedWarehouseRef.current = selectedWarehouse; }, [selectedWarehouse]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    const filters = filterVariables(params, debouncedSearchRef.current, "memonumber, customerid, companyname");
    const sf = statusFilterRef.current;
    if (sf) {
      filters.filters = [
        ...filters.filters,
        { key: "statusname", value: { filterType: "text", type: "contains", filter: sf } },
      ];
    }
    const result = await handleTryCatch(async () => {
      const { data } = await getMemoList({
        variables: {
          storeid: parsedStoreId,
          outletid: parsedOutletId,
          warehouseid: selectedWarehouseRef.current,
          ...filters,
        },
      });
      if (data?.getMemoList) {
        params.success({ rowData: data.getMemoList.data, rowCount: data.getMemoList.total });
        if (!data.getMemoList.data.length) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
        } else {
          gridRef.current?.api?.hideOverlay();
          const totals: MemoSummaryTotals = data.getMemoList.totalsRow;
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", [{
            memonumber: "Page Total" as unknown as number,
            totalamount: Number(totals?.totalamount ?? 0),
            subtotal: Number(totals?.subtotal ?? 0),
            netamount: Number(totals?.netamount ?? 0),
            amountreceived: Number(totals?.amountreceived ?? 0),
            balancedue: Number(totals?.balancedue ?? 0),
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

  const handleGridReady = useCallback((params: GridReadyEvent<MemoSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  }, []);

  useEffect(() => {
    if (gridReady) gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
  }, [gridReady, datasource]);

  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse, debouncedSearch, statusFilter]);

  const handleSelectionChanged = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows?.() || [];
    const memoNumbers = selected
      .map((r) => Number(r.memonumber))
      .filter((n) => Number.isFinite(n) && n > 0);
    setSelectedMemoNumbers(memoNumbers);
  }, []);

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "memos", sheetName: "Memos" });
  }, []);

  const handleEmailMemo = useCallback(() => {
    if (selectedMemoNumbers.length > 0) setEmailModalOpen(true);
  }, [selectedMemoNumbers]);

  const handlePrintMemo = useCallback(async () => {
    if (!parsedStoreId || selectedMemoNumbers.length === 0) return;

    setPrinting(true);
    const payload = {
      storeid: parsedStoreId,
      memonumbers: selectedMemoNumbers,
    };

    const result = await handleTryCatch(
      async () => {
        const response = await api.post(`${config.apiUrl}/store/memo/print`, payload, {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const { data } = response;
        if (data) {
          const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
          const tab = window.open(url, "_blank");
          if (!tab) {
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "memo.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
          dispatch(
            showNotification({
              message: "Memo printed successfully",
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
  }, [config.apiUrl, dispatch, parsedStoreId, selectedMemoNumbers]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("memo-list");

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_MEMO_DAILY_SUMMARY_QUERY, {
    variables: { outletid: parsedOutletId },
    skip: !parsedOutletId,
  });
  const summary = summaryData?.getMemoDailySummary ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <MemoListHeader
        selectedMemoNumbers={selectedMemoNumbers}
        onPrintMemo={handlePrintMemo}
        onEmailMemo={handleEmailMemo}
        onExport={handleExport}
      />
      {emailModalOpen && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="MEMO"
          documentNumbers={selectedMemoNumbers}
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
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Memo Daily Summary">
          <DailyStatusCards
            data={summary}
            loading={summaryLoading}
            labelOverrides={{ revenue: "Revenue Today", total: "Memos Today", avg: "Avg Memo", open: "Open Today" }}
          />
        </SummaryPanelWrapper>
      )}
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
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
              columnDefs={memoColumnDefs}
              onGridReady={handleGridReady}
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
              getRowStyle={(params) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : undefined
              }
              suppressCellFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoListComponent;
