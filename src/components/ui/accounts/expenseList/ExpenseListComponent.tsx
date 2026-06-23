"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { Plus } from "react-feather";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";
import { GET_EXPENSE_LIST_QUERY } from "@/lib/graphql/query/accounts";
import { DELETE_EXPENSE_MUTATION } from "@/lib/graphql/mutations/expenses";
import { AccountsExpenseListType } from "@/types/accounts";
import { getExpenseListColumnDefs } from "./ColumnDef";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-enterprise";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import { useParams } from "next/navigation";
import ExpenseModal from "./ExpenseModal";

const ExpenseListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);

  const [getExpenseList] = useLazyQuery(GET_EXPENSE_LIST_QUERY);
  const [deleteExpense] = useMutation(DELETE_EXPENSE_MUTATION);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<AccountsExpenseListType | null>(null);

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

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data } = await getExpenseList({
            variables: {
              outletid: selectedOutlet,
              ...filters,
            },
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
    [selectedOutlet, dispatch, getExpenseList]
  );

  useEffect(() => {
    if (selectedOutlet && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady]);

  return (
    <>
      <div className="card-body p-2">
        <div className="table-top mb-2">
          <div className="search-set">
            <div className="search-input">
              <OutletsFilter
                fetchOutletsList={fetchOutletsList}
                outlets={outlets}
                loading={outletsLoading}
                setSelectedOutlet={setSelectedOutlet}
                selectedOutlet={selectedOutlet}
              />
            </div>
          </div>
          <div className="table-top-head">
            <button
              type="button"
              className="btn btn-added"
              onClick={() => { setEditData(null); setIsModalOpen(true); }}
              disabled={!selectedOutlet}
            >
              <Plus size={14} className="me-1" />
              Add Expense
            </button>
          </div>
        </div>
        <POSGrid
          ref={gridRef}
          columnDefs={columnDefs}
          onGridReady={handleOnGridReady}
        />
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={refreshGrid}
        editData={editData}
        outletId={selectedOutlet ?? 0}
      />
    </>
  );
};

export default ExpenseListComponent;
