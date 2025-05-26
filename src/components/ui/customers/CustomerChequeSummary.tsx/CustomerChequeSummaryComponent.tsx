"use client";

import React, { useEffect, useRef, useState } from "react";
import POSGridClient from "../../grid/POSGridClient";
import { customerChequeSummaryColumnDefs } from "./ColumnDef";
import { AgGridReact } from "ag-grid-react";
import { CustomerChequeSummaryListType } from "@/types/customer";
import { GridReadyEvent } from "ag-grid-enterprise";
import { useLazyQuery } from "@apollo/client";
import { GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/customer";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useParams } from "next/navigation";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import SelectCustomer from "@/components/forms/SelectCustomer";
import SelectYear from "@/components/forms/SelectYear";
import OnHandChecksComponent from "../onHandChecks/OnHandChecksComponent";
import CustomerChequeSummaryHeader from "./CustomerChequeSummaryHeader";
import AddOnHandChequeModal from "./AddOnHandChequeModal";

const CustomerChequeSummaryComponent = () => {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<CustomerChequeSummaryListType[]>([]);
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [openAddChequeModal, setOpenAddChequeModal] = useState<boolean>(false);

  const [getCustomerChequeSummaryList] = useLazyQuery(
    GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY
  );

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerChequeSummaryListType>
  ) => {
    params?.api?.autoSizeAllColumns?.();
  };

  const fetchChequeSummary = async (
    storeid: number,
    customerid: number | null,
    year: number | null,
    warehouseid: number | null
  ) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getCustomerChequeSummaryList({
          variables: {
            storeid: storeid,
            customerid: customerid ? Number(customerid) : null,
            year: year ? Number(year) : null,
            warehouseid: warehouseid ? Number(warehouseid) : null,
          },
        });
        if (data.getCustomerChequeSummaryList) {
          setRowData(data.getCustomerChequeSummaryList);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  useEffect(() => {
    fetchChequeSummary(
      parsedStoreId,
      selectedCustomer,
      selectedYear,
      selectedWarehouse
    );
  }, [parsedStoreId, selectedCustomer, selectedYear, selectedWarehouse]);

  return (
    <>
      <CustomerChequeSummaryHeader setShowPrintModal={setOpenAddChequeModal} />
      <div className="barcode-content-list">
        <div className="row">
          <div className="col-lg-12 col-12">
            <div className="row seacrh-barcode-item">
              <div className="col-lg-4 mb-3 seacrh-barcode-item-one">
                <label className="form-label">Select customer</label>
                <SelectCustomer
                  className=""
                  trigger={() => {}}
                  setValue={() => {}}
                  storeId={parsedStoreId}
                  value={selectedCustomer}
                  onChange={(value: React.SetStateAction<number>) =>
                    setSelectedCustomer(value)
                  }
                />
              </div>
              <div className="col-lg-4 mb-3 seacrh-barcode-item-one">
                <label className="form-label">Select year</label>
                <SelectYear
                  className=""
                  trigger={() => {}}
                  setValue={() => {}}
                  storeId={parsedStoreId}
                  value={selectedYear}
                  onChange={(value: React.SetStateAction<number>) =>
                    setSelectedYear(value)
                  }
                  totalYears={10}
                />
              </div>
              <div className="col-lg-4 mb-3 seacrh-barcode-item-one">
                <label className="form-label">Select warehouse</label>
                <SelectWarehouse
                  className=""
                  trigger={() => {}}
                  setValue={() => {}}
                  storeId={parsedStoreId}
                  value={selectedWarehouse}
                  onChange={(value: React.SetStateAction<number>) =>
                    setSelectedWarehouse(value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-12">
            <div className="ag-theme-quartz custom-theme">
              <POSGridClient
                ref={gridRef}
                columnDefs={customerChequeSummaryColumnDefs}
                onGridReady={handleOnGridReady}
                rowData={rowData}
                loading={loading}
                masterDetail
                detailCellRenderer={OnHandChecksComponent}
              />
            </div>
          </div>
        </div>
      </div>
      {openAddChequeModal && (
        <AddOnHandChequeModal
          setShowPrintModal={setOpenAddChequeModal}
          triggerFetchSummary={() =>
            fetchChequeSummary(
              parsedStoreId,
              selectedCustomer,
              selectedYear,
              selectedWarehouse
            )
          }
        />
      )}
    </>
  );
};

export default CustomerChequeSummaryComponent;
