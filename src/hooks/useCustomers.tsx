import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMERS_QUERY } from "@/lib/graphql/query/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";

const useCustomers = () => {
  const dispatch = useAppDispatch();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getCustomers] = useLazyQuery(GET_CUSTOMERS_QUERY);

  const fetchCustomersByStoreId = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getCustomers({
          variables: { storeid: storeId },
        });
        if (data.getCustomers) {
          setCustomers(data.getCustomers);
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
  }, []);

  return {
    fetchCustomersByStoreId,
    customers,
    loading: loading,
  };
};

export default useCustomers;
