import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_STORE, GET_STORES } from "@/lib/graphql/query/store";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { addStore } from "@/lib/store/slice/storeSlice";
import { addStores } from "@/lib/store/slice/storesSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";

const useStores = () => {
  const dispatch = useAppDispatch();
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [loading, setLoading] = useState<boolean>(false);
  const [getStores] = useLazyQuery(GET_STORES);
  const { loading: stroreLoading } = useQuery(GET_STORE, {
    variables: { storeid: parsedStoreId },
    skip: !storeId,
    onCompleted: (data) => {
      if (data.getStore) {
        dispatch(addStore(data.getStore));
      }
    },
    onError: (error) => {
      console.error("Error fetching user:", error.message);
    },
  });

  const fetchStoresData = useCallback(async () => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getStores();
        if (data.getStores) {
          dispatch(addStores(data.getStores));
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
    fetchStoresData,
    loading: loading || stroreLoading,
  };
};

export default useStores;
