"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation } from "@apollo/client";
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
import { CREATE_INVOICE_FROM_MEMO_MUTATION } from "@/lib/graphql/mutations/sales";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useRouter } from "next/navigation";
import { MemoSummary, MemoSummaryTotals } from "@/types/sales";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import MemoListHeader from "./MemoListHeader";
import MemoActions from "./MemoActions";
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
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter" },
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
  const [createInvoiceFromMemo, { loading: creditInvoiceLoading }] = useMutation(CREATE_INVOICE_FROM_MEMO_MUTATION);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { basePath } = useDefaultRoute();
  const gridRef = useRef<AgGridReact<MemoSummary>>(null);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [selectedMemoNumbers, setSelectedMemoNumbers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const config = getEnvironmentConfig();

  const handleOnGridReady = (params: GridReadyEvent<MemoSummary>) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "memonumber, customerid, companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getMemoList({
            variables: {
              storeid: parsedStoreId,
              outletid: parsedOutletId,
              warehouseid: selectedWarehouse,
              ...filters,
            },
          });

          if (data?.getMemoList) {
            params.success({
              rowData: data.getMemoList.data,
              rowCount: data.getMemoList.total,
            });

            if (!data.getMemoList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              const totals: MemoSummaryTotals = data.getMemoList.totalsRow;
              const pinnedRow: Partial<MemoSummary> = {
                memonumber: "Page Total" as unknown as number,
                totalamount: Number(totals?.totalamount ?? 0),
                subtotal: Number(totals?.subtotal ?? 0),
                netamount: Number(totals?.netamount ?? 0),
                amountreceived: Number(totals?.amountreceived ?? 0),
                balancedue: Number(totals?.balancedue ?? 0),
              };
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", [pinnedRow]);
            }
          }
          return true;
        });

        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
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
    [debouncedSearch, dispatch, getMemoList, parsedOutletId, parsedStoreId, selectedWarehouse]
  );

  const handleGridReady = useCallback(
    (params: GridReadyEvent<MemoSummary>) => {
      handleOnGridReady(params);
      params.api.setGridOption("serverSideDatasource", datasource);
    },
    [datasource]
  );

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

  const handleCreateCreditInvoice = useCallback(async () => {
    if (!parsedStoreId || selectedMemoNumbers.length !== 1) return;

    const result = await handleTryCatch(async () => {
      const { data } = await createInvoiceFromMemo({
        variables: {
          input: {
            storeid: parsedStoreId,
            memonumber: selectedMemoNumbers[0],
            creditreturn: true,
          },
        },
      });

      const response = data?.createInvoiceFromMemo;
      if (!response?.success) {
        throw new Error(response?.error || response?.message || "Failed to create credit invoice");
      }

      let invoiceNumber: number | undefined;
      const raw = response?.data;
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        invoiceNumber = Number(parsed?.invoicenumber ?? parsed ?? 0) || undefined;
      } catch {
        invoiceNumber = typeof raw === "number" ? raw : undefined;
      }

      dispatch(
        showNotification({
          message: invoiceNumber
            ? `Credit Invoice #${invoiceNumber} created successfully`
            : "Credit Invoice created successfully",
          type: NOTIFICATION_TYPES.SUCCESS,
        })
      );

      if (invoiceNumber) {
        router.push(`${basePath}/sales/${invoiceNumber}/edit?credit=1`);
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [basePath, createInvoiceFromMemo, dispatch, parsedStoreId, router, selectedMemoNumbers]);

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

  return (
    <>
      <MemoListHeader
        selectedMemoNumbers={selectedMemoNumbers}
        onPrintMemo={handlePrintMemo}
        onEmailMemo={handleEmailMemo}
        onExport={handleExport}
        onCreateCreditInvoice={handleCreateCreditInvoice}
        creditInvoiceLoading={creditInvoiceLoading}
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
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <POSGrid
            ref={gridRef}
            columnDefs={memoColumnDefs}
            onGridReady={handleGridReady}
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
            getRowStyle={(params) =>
              params.node.rowPinned === "bottom"
                ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                : undefined
            }
            suppressCellFocus
          />
        </div>
      </div>
    </>
  );
};

export default MemoListComponent;
