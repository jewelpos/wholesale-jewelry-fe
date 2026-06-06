"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
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
import { getEnvironmentConfig } from "@/lib/config/environment";
import { useParams } from "next/navigation";
import DocumentEmailModal from "../DocumentEmailModal";
import { exportGridToExcel } from "@/lib/utils/exportGrid";

const SalesListComponent = () => {
  const [getInvoiceList] = useLazyQuery(GET_SALES_INVOICE_LIST_QUERY, { fetchPolicy: "network-only" });
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const config = getEnvironmentConfig();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact<SalesInvoiceListType>>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedInvoiceNumbers, setSelectedInvoiceNumbers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const handleOnGridReady = (params: GridReadyEvent<SalesInvoiceListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "invoicenumber, customerid, companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getInvoiceList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getInvoiceList) {
            params.success({
              rowData: data.getInvoiceList.data,
              rowCount: data.getInvoiceList.total,
            });
            if (!data.getInvoiceList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              // Clear any existing pinned bottom totals if no rows
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              // Compute grand totals for the current loaded set and pin as bottom row
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
                {
                  numberofitems: 0,
                  totalamount: 0,
                  discountamount: 0,
                  subtotal: 0,
                  salestax: 0,
                  shipping: 0,
                  netamount: 0,
                  amountreceived: 0,
                  balancedue: 0,
                }
              );
              const pinnedRow: Partial<SalesInvoiceListType> = {
                invoicenumber: "Page Total" as unknown as number,
                ...totals,
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
    [selectedOutlet, dispatch, getInvoiceList, debouncedSearch]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, selectedOutlet]);

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
          `${config.apiUrl}/store/invoice/print`,
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
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "invoice.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
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
  }, [config.apiUrl, dispatch, parsedStoreId, selectedInvoiceNumbers]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...salesInvoiceColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        width: 120,
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
        maxWidth: 150,
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
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  const handleEmailInvoice = useCallback(() => {
    if (selectedInvoiceNumbers.length > 0) setEmailModalOpen(true);
  }, [selectedInvoiceNumbers]);

  const handleExport = useCallback(() => {
    exportGridToExcel(gridRef.current?.api, { fileName: "invoices", sheetName: "Invoices" });
  }, []);

  return (
    <>
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
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              onSelectionChanged={handleSelectionChanged}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              rowSelection={{
                mode: "multiRow",
                checkboxes:   true,
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
    </>
  );
};

export default SalesListComponent;
