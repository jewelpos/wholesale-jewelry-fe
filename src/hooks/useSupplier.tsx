import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";
import { GET_SUPPLIER_BY_STORE_ID_QUERY } from "@/lib/graphql/query/supplier";

const useSupplier = () => {
  const dispatch = useAppDispatch();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getSuppliersByStoreId] = useLazyQuery(GET_SUPPLIER_BY_STORE_ID_QUERY);

  const fetchSupplierByStoreId = useCallback(async (storeIds: number[]) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getSuppliersByStoreId({
          variables: { storeid: storeIds },
        });
        if (data.getSuppliersByStoreId) {
          setSuppliers(data.getSuppliersByStoreId);
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
    fetchSupplierByStoreId,
    suppliers,
    loading: loading,
  };
};

export default useSupplier;
