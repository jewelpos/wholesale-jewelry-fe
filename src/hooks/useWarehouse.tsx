import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { GET_WAREHOUSES_BY_STORE_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";

const useWarehouse = () => {
  const dispatch = useAppDispatch();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getWarehousesByStoreId] = useLazyQuery(
    GET_WAREHOUSES_BY_STORE_ID_QUERY
  );

  const fetchWarehouseByStoreId = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getWarehousesByStoreId({
          variables: { storeid: storeId },
        });
        if (data.getWarehousesByStoreId) {
          setWarehouses(data.getWarehousesByStoreId);
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
    fetchWarehouseByStoreId,
    warehouses,
    loading: loading,
  };
};

export default useWarehouse;
