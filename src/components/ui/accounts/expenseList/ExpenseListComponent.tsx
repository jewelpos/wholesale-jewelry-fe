"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Plus } from "react-feather";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { GET_EXPENSE_LIST_QUERY, GET_EXPENSE_DAILY_SUMMARY_QUERY } from "@/lib/graphql/query/accounts";
import { DELETE_EXPENSE_MUTATION } from "@/lib/graphql/mutations/expenses";
import { AccountsExpenseListType } from "@/types/accounts";
import { getExpenseListColumnDefs } from "./ColumnDef";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-enterprise";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import { useParams } from "next/navigation";
import ExpenseModal from "./ExpenseModal";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../../grid/SummaryPanelWrapper";
import DailyStatusCards from "../../grid/DailyStatusCards";
import { useDebounce } from "@/hooks/useDebounce";

const ExpenseListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);

  const [getExpenseList] = useLazyQuery(GET_EXPENSE_LIST_QUERY, { fetchPolicy: "network-only" });
  const [deleteExpense] = useMutation(DELETE_EXPENSE_MUTATION);
  const dispatch = useAppDispatch();

  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<AccountsExpenseListType | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const selectedOutletRef = useRef(selectedOutlet);
  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const handleOnGridReady = (params: GridReadyEvent<AccountsExpenseListType>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const refreshGrid = useCallback(() => {
    gridRef.current?.api?.refreshServerSide({ purge: true });
  }, []);

  const handleEdit = useCallback((data: AccountsExpenseListType) => {
    setEditData(data);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (data: AccountsExpenseListType) => {
    const result = await showConfirmationDialog({
      title: "Delete Expense?",
      text: `"${data.expensedetail}" will be permanently removed.`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const deleteResult = await handleTryCatch(async () => {
      await deleteExpense({
        variables: { expenseid: data.expenseid, storeid: storeId },
      });
      dispatch(showNotification({ message: "Expense deleted", type: NOTIFICATION_TYPES.SUCCESS }));
      refreshGrid();
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [deleteExpense, storeId, dispatch, refreshGrid]);

  const columnDefs = useMemo(
    () => getExpenseListColumnDefs(handleEdit, handleDelete),
    [handleEdit, handleDelete]
  );

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    if (!selectedOutletRef.current) {
      params.success({ rowData: [], rowCount: 0 });
      gridRef.current?.api?.showNoRowsOverlay();
      return;
    }
    const filters = filterVariables(params, debouncedSearchRef.current, "expensedetail, accountdescription, expensemode");
    const result = await handleTryCatch(async () => {
      const { data } = await getExpenseList({
        variables: { outletid: selectedOutletRef.current, ...filters },
      });
      if (data.getExpenseList) {
        params.success({
          rowData: data.getExpenseList.data,
          rowCount: data.getExpenseList.total,
        });
        if (!data.getExpenseList.data.length) {
          gridRef.current?.api?.showNoRowsOverlay();
        } else {
          gridRef.current?.api?.hideOverlay();
        }
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
  }, [selectedOutlet, debouncedSearch]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("expense-list");

  const { data: summaryData, loading: summaryLoading } = useQuery(GET_EXPENSE_DAILY_SUMMARY_QUERY, {
    variables: { outletid: selectedOutlet },
    skip: !selectedOutlet,
  });
  const summary = summaryData?.getExpenseDailySummary ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <div className="page-header">
        <div className="add-item d-flex flex-column">
          <div className="page-title">
            <h4>Expense List</h4>
            <h6>Manage your business expenses</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            type="button"
            className="btn btn-added btn-primary"
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
            disabled={!selectedOutlet}
          >
            <Plus size={14} className="me-1" />
            Add Expense
          </button>
        </div>
      </div>

      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Expense Daily Summary">
          <DailyStatusCards
            data={summary}
            loading={summaryLoading}
            labelOverrides={{
              revenue: "Total Spent Today",
              total: "Expenses Today",
              avg: "Avg Expense",
              open: "Pending Approval",
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
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
                          />
          </div>
        </div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={refreshGrid}
        editData={editData}
        outletId={selectedOutlet ?? 0}
      />
    </div>
  );
};

export default ExpenseListComponent;
