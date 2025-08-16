"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import {
  GET_CUSTOMER_LIST_QUERY,
  GET_CUSTOMER_QUERY,
} from "@/lib/graphql/query/customer";
import { CustomersListType, CustomerType } from "@/types/customer";
import "ag-grid-enterprise";
import { customersListColumnDefs } from "./ColumnDef";
import { useParams } from "next/navigation";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import useOutlets from "@/hooks/useOutlets";
import CustomerActions from "./CustomerActions";
import CustomerListHeader from "./CustomerListHeader";
import PrintModal, { PrintPayload } from "../../PrintModal";
import CustomerPrintDetails from "./CustomerPrintDetails";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";

const CustomerListComponent = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);
  const [getCustomerList] = useLazyQuery(GET_CUSTOMER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(
    undefined
  );
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const { data: customerData, loading: customerLoading } = useQuery(
    GET_CUSTOMER_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        customerid: Number(selectedCustomerId),
      },
      skip: !storeIdParam || !selectedCustomerId,
    }
  );
  const selectedCustomer: CustomerType = customerData?.getCustomer;
  const config = getEnvironmentConfig();
  const [loading, setLoading] = useState(false);

  const handleOnGridReady = (params: GridReadyEvent<CustomersListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "fullname, custcompanyname"
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
        const result = await handleTryCatch(async () => {
          const { data } = await getCustomerList({
            variables: {
              storeid: parsedStoreId,
              ...filtersMain,
            },
          });
          if (data.getCustomerList) {
            params.success({
              rowData: data.getCustomerList.data,
              rowCount: data.getCustomerList.total,
            });
            if (!data.getCustomerList.data.length) {
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
    [parsedStoreId, dispatch, getCustomerList, debouncedSearch, selectedOutlet]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, parsedStoreId]);

  useEffect(() => {
    if (parsedStoreId && gridReady && selectedOutlet) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady, selectedOutlet]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [debouncedSearch, gridReady, datasource]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...customersListColumnDefs,
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: ICellRendererParams<CustomersListType>) =>
          params.data ? (
            <CustomerActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 120,
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

  const handlePrintSubmit = async (payload: PrintPayload) => {
    setLoading(true);
    const updatedPayload = {
      ...payload,
      customerid: selectedCustomerId,
      outletid: 123,
    };
    const result = await handleTryCatch(
      async () => {
        const response = await api.post(
          `${config.apiUrl}/store/customer/statement`,
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
          const url = window.URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "file.pdf");
          document.body.appendChild(link);
          link.click();
          link.remove();
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
      <CustomerListHeader
        selectedCustomerId={selectedCustomerId}
        setShowPrintModal={setShowPrintModal}
      />
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
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              rowSelection={{
                mode: "singleRow",
                checkboxes: true,
                headerCheckbox: true,
                suppressRowClickSelection: true,
              }}
              onSelectionChanged={() => {
                const selected = gridRef.current?.api?.getSelectedRows() || [];
                setSelectedCustomerId(selected[0]?.customerid);
              }}
            />
          </div>
        </div>
      </div>
      {showPrintModal && selectedCustomerId && (
        <PrintModal
          setShowPrintModal={setShowPrintModal}
          handlePrintSubmit={handlePrintSubmit}
          loading={loading}
        >
          <CustomerPrintDetails
            selectedCustomer={selectedCustomer}
            loading={customerLoading}
          />
        </PrintModal>
      )}
    </>
  );
};

export default CustomerListComponent;
