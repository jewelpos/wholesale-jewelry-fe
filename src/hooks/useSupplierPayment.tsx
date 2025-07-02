"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";
import {
  GET_NON_VOIDED_SUPPLIER_PAYMENT_TRANSACTION_LIST_QUERY,
  GET_APPLIED_AMOUNT_LIST_BY_SUPPLIER_PAYMENT_ID_QUERY,
} from "@/lib/graphql/query/supplier";
import { AppliedPaymentType, SupplierPayment } from "@/types/supplier";

const useSupplierPayment = () => {
  const dispatch = useAppDispatch();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [appliedAmounts, setAppliedAmounts] = useState<AppliedPaymentType[]>(
    []
  );
  const [getNonVoidedSupplierPaymentTransactionList] = useLazyQuery(
    GET_NON_VOIDED_SUPPLIER_PAYMENT_TRANSACTION_LIST_QUERY
  );
  const [getAppliedAmountListBySupplierPaymentId] = useLazyQuery(
    GET_APPLIED_AMOUNT_LIST_BY_SUPPLIER_PAYMENT_ID_QUERY
  );
  const [appliedAmountsLoading, setAppliedAmountsLoading] =
    useState<boolean>(false);

  const fetchNonVoidedSupplierPaymentTransactionList = useCallback(
    async (storeId: number, supplierId: number) => {
      if (!storeId || !supplierId) return;
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getNonVoidedSupplierPaymentTransactionList({
            variables: {
              storeid: storeId,
              supplierid: supplierId,
            },
          });
          if (data?.getNonVoidedSupplierPaymentTransactionList) {
            setPayments(data.getNonVoidedSupplierPaymentTransactionList);
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
    },
    []
  );

  const fetchAppliedAmountListBySupplierPaymentId = useCallback(
    async (storeId: number, supplierPaymentId: number) => {
      if (!storeId || !supplierPaymentId) return;
      const result = await handleTryCatch(
        async () => {
          setAppliedAmountsLoading(true);
          const { data } = await getAppliedAmountListBySupplierPaymentId({
            variables: {
              storeid: storeId,
              supplierpaymentid: supplierPaymentId,
            },
          });
          if (data?.getAppliedAmountListBySupplierPaymentId) {
            setAppliedAmounts(data.getAppliedAmountListBySupplierPaymentId);
          }
          return true;
        },
        () => {
          setAppliedAmountsLoading(false);
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
    },
    []
  );

  return {
    payments,
    fetchNonVoidedSupplierPaymentTransactionList,
    loading,
    appliedAmounts,
    fetchAppliedAmountListBySupplierPaymentId,
    appliedAmountsLoading,
  };
};

export default useSupplierPayment;
