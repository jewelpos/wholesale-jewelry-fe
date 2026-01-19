import { useCallback, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY } from "@/lib/graphql/query/customer";
import { CustomerBalanceDueInvoiceType } from "@/types/customer";

const useCustomerBalanceDue = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<CustomerBalanceDueInvoiceType[]>([]);
  const [getCustomerBalanceDueInvoices] = useLazyQuery(
    GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY
  );

  const fetchCustomerBalanceDueInvoices = useCallback(
    async (
      storeId: number,
      outletId: number,
      warehouseId: number,
      customerId: number,
      isCredit = true
    ) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getCustomerBalanceDueInvoices({
            variables: {
              storeid: storeId,
              outletid: outletId,
              warehouseid: warehouseId,
              customerid: customerId,
              isCredit,
            },
          });
          if (data?.getCustomerBalanceDueInvoices) {
            if (data.getCustomerBalanceDueInvoices.length === 0) {
              dispatch(
                showNotification({
                  message: "There is no balance due for this customer",
                  type: NOTIFICATION_TYPES.ERROR,
                })
              );
            }
            setInvoices(data.getCustomerBalanceDueInvoices);
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
    [dispatch, getCustomerBalanceDueInvoices]
  );

  return {
    invoices,
    loading,
    fetchCustomerBalanceDueInvoices,
  };
};

export default useCustomerBalanceDue;
