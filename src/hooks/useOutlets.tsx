import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";

const useOutlets = () => {
  const dispatch = useAppDispatch();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getOutlets] = useLazyQuery(GET_OUTLETS_QUERY, { fetchPolicy: 'cache-and-network' });

  const fetchOutletsList = useCallback(async (storeIds: number[]) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getOutlets({
          variables: { storeid: storeIds },
        });
        if (data.getOutlets) {
          setOutlets(data.getOutlets);
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
    fetchOutletsList,
    outlets,
    loading: loading,
  };
};

export default useOutlets;
