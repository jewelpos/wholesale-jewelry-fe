import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_FORM_FIELD_VISIBILITY_QUERY } from "@/lib/graphql/query/formFieldVisibility";
import { SAVE_FORM_FIELD_VISIBILITY_MUTATION } from "@/lib/graphql/mutations/formFieldVisibility";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { FormKey } from "@/lib/formFieldVisibility/types";
import { useMutation, useQuery } from "@apollo/client";
import { useCallback, useMemo } from "react";

const useFieldVisibility = (formkey: FormKey, storeId: number | undefined) => {
  const dispatch = useAppDispatch();
  const { data, loading, refetch } = useQuery(GET_FORM_FIELD_VISIBILITY_QUERY, {
    variables: { storeid: storeId, formkey },
    skip: !storeId,
    fetchPolicy: "cache-and-network",
  });
  const [saveFormFieldVisibility, { loading: saving }] = useMutation(
    SAVE_FORM_FIELD_VISIBILITY_MUTATION
  );

  const hiddenFields: Set<string> = useMemo(() => {
    const raw = data?.getFormFieldVisibility;
    if (!raw) return new Set();
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }, [data?.getFormFieldVisibility]);

  const isHidden = useCallback((key: string) => hiddenFields.has(key), [hiddenFields]);

  const save = useCallback(
    async (hiddenKeys: string[]) => {
      const result = await handleTryCatch(async () => {
        await saveFormFieldVisibility({
          variables: { storeid: storeId, formkey, hiddenfields: JSON.stringify(hiddenKeys) },
        });
        await refetch();
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
        return false;
      }
      dispatch(showNotification({ message: "Saved", type: NOTIFICATION_TYPES.SUCCESS }));
      return true;
    },
    [saveFormFieldVisibility, refetch, storeId, formkey, dispatch]
  );

  return { hiddenFields, isHidden, loading, save, saving };
};

export default useFieldVisibility;
