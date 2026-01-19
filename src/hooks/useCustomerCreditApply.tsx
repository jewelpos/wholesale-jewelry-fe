import { useCallback, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_CREDIT_APPLY_SUMMARY_QUERY } from "@/lib/graphql/query/customer";
import { CustomerCreditApply, CustomerCreditApplyInvoice } from "@/types/customer";

const useCustomerCreditApply = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [customerCreditInfo, setCustomerCreditInfo] =
    useState<CustomerCreditApply | null>(null);
  const [customerBalanceDue, setCustomerBalanceDue] = useState<
    CustomerCreditApplyInvoice[]
  >([]);

  const [getCustomerCreditApplySummary] = useLazyQuery(
    GET_CUSTOMER_CREDIT_APPLY_SUMMARY_QUERY
  );

  const fetchCustomerCreditApplySummary = useCallback(
    async (storeId: number, outletId: number, customerId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getCustomerCreditApplySummary({
            variables: {
              storeid: storeId,
              outletid: outletId,
              customerid: customerId,
            },
          });

          if (data?.getCustomerCreditApplySummary) {
            const info = data.getCustomerCreditApplySummary as CustomerCreditApply;
            setCustomerBalanceDue(info.balanceDueInvoices);
            setCustomerCreditInfo(info);

            if (!info?.hasCredit || (info.creditInvoices?.length ?? 0) === 0) {
              dispatch(
                showNotification({
                  message: "No credit invoices available for this customer",
                  type: NOTIFICATION_TYPES.ERROR,
                })
              );
            }

            if ((info.balanceDueInvoices?.length ?? 0) === 0) {
              dispatch(
                showNotification({
                  message: "There is no balance due for this customer",
                  type: NOTIFICATION_TYPES.ERROR,
                })
              );
            }
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
    [dispatch, getCustomerCreditApplySummary]
  );

  return {
    fetchCustomerCreditApplySummary,
    customerCreditInfo,
    customerBalanceDue,
    loading,
  };
};

export default useCustomerCreditApply;
