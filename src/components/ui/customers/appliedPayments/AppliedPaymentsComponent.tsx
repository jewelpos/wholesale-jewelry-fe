"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_PAYMENT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerPaymentListType } from "@/types/customer";
import "ag-grid-enterprise";
import { appliedPaymentsColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import AppliedPaymentHeader from "./AppliedPaymentHeader";
import PaymentModal from "./PaymentModal";
import CustomerAppliedPaymentComponent from "./CustomerAppliedPaymentComponent";
import CustomerPaymentActions from "./CustomerPaymentActions";
import { paymentModalTypes } from "@/lib/config/constants";
import SelectCustomer from "@/components/forms/SelectCustomer";
import PaymentPrintModal from "./PaymentPrintModal";

const AppliedPaymentsComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [getCustomerPaymentList] = useLazyQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [paymentModal, setPaymentModal] = useState<string>("");
  const [showPrint, setShowPrint] = useState(false);
  const [printPayments, setPrintPayments] = useState<CustomerPaymentListType[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [printCustomerId, setPrintCustomerId] = useState<number | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const [voidRow, setVoidRow] = useState<CustomerPaymentListType | null>(null);

  const handleVoidClick = (row: CustomerPaymentListType) => {
    setVoidRow(row);
    setPaymentModalAndSyncUrl(paymentModalTypes.add_void_payment);
  };

  const setPaymentModalAndSyncUrl = (value: string) => {
    if (!value) {
      setPaymentModal("");
      router.replace(pathname);
      if (voidRow) {
        setVoidRow(null);
        gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
      }
      return;
    }
    setPaymentModal(value);
    router.replace(`${pathname}?modal=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    const modal = searchParams.get("modal");
    if (modal) setPaymentModal(modal);
  }, [searchParams]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerPaymentListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filtersMain = filterVariables(params, debouncedSearch, "transactionno, custcompanyname");

        const result = await handleTryCatch(async () => {
          const { data } = await getCustomerPaymentList({
            variables: { outletid: selectedOutlet, ...filtersMain },
          });
          if (data.getCustomerPaymentList) {
            params.success({
              rowData: data.getCustomerPaymentList.data,
              rowCount: data.getCustomerPaymentList.total,
            });
            if (!data.getCustomerPaymentList.data.length) gridRef.current?.api?.showNoRowsOverlay();
            else gridRef.current?.api?.hideOverlay();
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [selectedOutlet, dispatch, getCustomerPaymentList, debouncedSearch]
  );

  const columnDefs = useMemo(() => {
    return [
      ...appliedPaymentsColumnDefs,
      {
        headerName: "Actions",
        field: "transactionno",
        cellRenderer: (params: ICellRendererParams<CustomerPaymentListType>) =>
          params.data ? <CustomerPaymentActions data={params.data} onVoid={handleVoidClick} /> : null,
        width: 120,
        sortable: false,
        filter: false,
        maxWidth: 150,
        pinned: "right",
        suppressSizeToFit: false,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      } as ColDef<CustomerPaymentListType>,
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleVoidClick]);

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  const fetchAndPrint = async (customerid: number) => {
    setPrintLoading(true);
    const result = await handleTryCatch(async () => {
      const { data } = await getCustomerPaymentList({
        variables: {
          outletid: selectedOutlet ?? parsedOutletId,
          page: 1,
          perpage: 10000,
          filters: [{ key: "customerid", value: { filterType: "number", type: "equals", filter: customerid } }],
          sortModel: [],
          rowGroupCols: [],
          groupKeys: [],
        },
      });
      setPrintPayments(data?.getCustomerPaymentList?.data ?? []);
      return true;
    });
    setPrintLoading(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setShowCustomerPicker(false);
    setShowPrint(true);
  };

  const handlePrint = () => {
    setPrintCustomerId(null);
    setShowCustomerPicker(true);
  };

  const handleEmail = () => {
    dispatch(showNotification({ message: "Email payment statement — coming soon.", type: NOTIFICATION_TYPES.INFO }));
  };

  const handleExport = () => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `payments-${Date.now()}.csv` });
  };

  return (
    <>
      <AppliedPaymentHeader
        setPaymentModal={setPaymentModalAndSyncUrl}
        onPrint={handlePrint}
        onEmail={handleEmail}
        onExport={handleExport}
      />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            gridRef={gridRef}
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
              defaultColDef={{ filter: !debouncedSearch }}
              masterDetail
              detailCellRenderer={CustomerAppliedPaymentComponent}
              detailRowAutoHeight
              getRowStyle={(params) =>
                params.data?.voidpayment
                  ? { background: "#fef2f2", color: "#9ca3af" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {paymentModal && (
        <PaymentModal
          paymentModal={paymentModal}
          setPaymentModal={setPaymentModalAndSyncUrl}
          voidRow={voidRow}
        />
      )}

      {/* Customer picker for print */}
      {showCustomerPicker && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Select Customer to Print</h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowCustomerPicker(false)}
                />
              </div>
              <div className="modal-body pt-2 pb-3 px-3">
                <label className="form-label mb-1" style={{ fontSize: 13, fontWeight: 600 }}>
                  Customer
                </label>
                <SelectCustomer
                  className=""
                  storeId={parsedStoreId}
                  trigger={() => {}}
                  value={printCustomerId}
                  onChange={(val: number) => setPrintCustomerId(val || null)}
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCustomerPicker(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!printCustomerId || printLoading}
                  onClick={() => printCustomerId && fetchAndPrint(printCustomerId)}
                >
                  {printLoading ? "Loading…" : "Print"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrint && printCustomerId && (
        <PaymentPrintModal
          customerid={printCustomerId}
          payments={printPayments}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
};

export default AppliedPaymentsComponent;
