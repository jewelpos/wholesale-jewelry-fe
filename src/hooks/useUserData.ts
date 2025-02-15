import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_ACTIVE_USER } from "@/lib/graphql/query/user";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { addUser } from "@/lib/store/slice/userDataSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useState } from "react";

const useUserData = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [getActiveUserInfo] = useLazyQuery(GET_ACTIVE_USER);

  const fetchUserData = async () => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getActiveUserInfo();
        if (data.getActiveUserInfo) {
          let userData = { ...data.getActiveUserInfo.data.user };
          if (data.getActiveUserInfo.data.user.permissions) {
            userData = {
              ...userData,
              permissions: {
                ...data.getActiveUserInfo.data.user.permissions[0],
              },
            };
          }
          dispatch(addUser(userData));
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
  };

  return {
    fetchUserData,
    loading: loading,
  };
};

export default useUserData;
