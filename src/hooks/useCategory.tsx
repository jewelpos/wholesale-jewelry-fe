import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";
import {
  GET_ITEM_CATEGORIES_QUERY,
  GET_ITEM_SUBCATEGORIES_QUERY,
} from "@/lib/graphql/query/products";
import {
  ProductItemCategoryType,
  ProductSubItemCategoryType,
} from "@/types/product";

const useCategory = () => {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<ProductItemCategoryType[]>([]);
  const [subCategories, setSubCategories] = useState<
    ProductSubItemCategoryType[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [getItemCategories] = useLazyQuery(GET_ITEM_CATEGORIES_QUERY);
  const [getItemSubcategories] = useLazyQuery(GET_ITEM_SUBCATEGORIES_QUERY);

  const fetchCategoriesByStoreId = useCallback(
    async (storeId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getItemCategories({
            variables: {
              storeid: storeId,
            },
          });
          if (data?.getItemCategories) {
            setCategories(data.getItemCategories);
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
    [getItemCategories, dispatch]
  );

  const fetchSubCategoriesByStoreId = useCallback(
    async (storeId: number, categoryId?: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getItemSubcategories({
            variables: {
              storeid: storeId,
              categoryid: categoryId,
            },
          });
          if (data?.getItemSubcategories) {
            setSubCategories(data.getItemSubcategories);
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
    [getItemSubcategories, dispatch]
  );

  return {
    fetchCategoriesByStoreId,
    fetchSubCategoriesByStoreId,
    categories,
    subCategories,
    loading,
  };
};

export default useCategory;
