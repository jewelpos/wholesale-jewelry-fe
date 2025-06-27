import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_PAYMENT_MODE_LIST_QUERY } from "@/lib/graphql/query/paymentMode";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";

export interface PaymentModeType {
  paymentmodeid: number;
  paymode: string;
  paymodedescription: string;
  warehouseid: number;
  createddate: string;
}

const usePaymentMode = () => {
  const dispatch = useAppDispatch();
  const [paymentModes, setPaymentModes] = useState<PaymentModeType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getPaymentExpenseModes] = useLazyQuery(GET_PAYMENT_MODE_LIST_QUERY);

  const fetchPaymentModes = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getPaymentExpenseModes({
          variables: { storeid: storeId },
        });
        if (data?.getPaymentExpenseModes) {
          setPaymentModes(data.getPaymentExpenseModes);
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

  return { paymentModes, fetchPaymentModes, loading };
};

export default usePaymentMode;
