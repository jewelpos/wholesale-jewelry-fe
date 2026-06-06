import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";
import {
  GET_ALL_INVENTORY_ITEMS_QUERY,
  GET_ALL_INVENTORY_ITEMS_WITH_STOCK_QUERY,
  SEARCH_INVENTORY_ITEMS_QUERY,
} from "@/lib/graphql/query/product";

export type ItemDetails = {
  itemid: number;

  itembarcodeid?: number;
  itemcode?: string;
  itemdescription?: string;
  detaileditemdescription?: string;
  itemunit?: string;

  itemsellprice?: number;
  itemminimumsellprice?: number;
  supplierbarcodeid?: string;
  supplieritemcode?: string;
  modelno?: string;
  manufacturer?: string;

  itemtaxable?: number;
  itemdiscount?: number;
  itempurchaseprice?: number;
  itemaveragecost?: number;
  trackinventory?: number;

  itemcategoryid?: number;
  subcategoryid?: number;
  itemstatus?: string;
  itemimagepath?: string;
  itemremarks?: string;
  supplierid?: number;

  itemtagpricecode?: string;
  itemtagprice?: number;

  adjupdatebyid?: number;
  adjdate?: string;
  adjremarks?: string;

  ringgoldweight?: number;
  itemmetalpremiume?: number;
  itemtype?: string;
  itemsetpcs?: string;
  itemlength?: string;
  itemsize?: string;
  itemcolor?: string;
  itemlabor?: string;
  itemmetal?: string;
  itemmetalpercent?: string;
  itempremium?: string;

  broakerage?: string;
  broakeragepercent?: number;
  subtituteitem?: string;

  itemalertwarning?: number;
  itemwarningmessage?: string;

  tag1?: string;
  tag2?: string;
  tag3?: string;
  tag4?: string;
  tag5?: string;
  tag6?: string;
  tag7?: string;
  tag0?: string;
  tag9?: string;
  tag10?: string;

  dshape?: string;
  dlab?: string;
  dcerno?: string;
  dcarat?: number;
  ddiameter?: string;
  dcolor?: string;
  dclarity?: string;
  dflorence?: string;
  dpolarity?: string;
  ddepth?: string;
  dtable?: string;
  dpolish?: string;
  dsymmetry?: string;
  dcrownheight?: string;
  dcrownangle?: string;
  dpavillionheight?: string;
  dpavillionangle?: string;
  dmesurement?: string;
  dsize?: string;
  dquality?: string;
  dstockno?: string;
  dvendorshortname?: string;
  dbatchno?: string;

  drapprice?: number;
  dcost?: number;
  dsaleprice?: number;
  dpricecode?: string;
  ddatepurchase?: string;
  dlastsolddate?: string;
  dlastsoldprice?: number;

  dincludeininventory?: boolean;
  dpcs?: number;
  dqty?: number;

  createddate?: string;
  createdby?: number;
  lastmodifieddate?: string;

  stockid?: number;
  itemwarehouseid?: number;
  itemlocation?: string;
  itemreorderqtypnt?: number;
  itemreorderqty?: number;
  itemquantityinhand?: number;
  itemqtybooked?: number;

  stockcreateddate?: string;
  stocklastmodifieddate?: string;
};

const useProducts = () => {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<ItemDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [getAllInventoryItems] = useLazyQuery(GET_ALL_INVENTORY_ITEMS_QUERY);
  const [getAllInventoryItemsWithStock] = useLazyQuery(
    GET_ALL_INVENTORY_ITEMS_WITH_STOCK_QUERY
  );
  const [searchItems] = useLazyQuery(SEARCH_INVENTORY_ITEMS_QUERY);

  const fetchProductsByStoreId = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getAllInventoryItems({ variables: { storeid: storeId } });
        if (data?.getAllInventoryItems) {
          setProducts(data.getAllInventoryItems as ItemDetails[]);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(
        showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
      );
    }
  }, []);

  const fetchProductsWithStockByStoreAndWarehouseId = useCallback(
    async (storeId: number, warehouseId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getAllInventoryItemsWithStock({
            variables: { storeid: storeId, warehouseid: warehouseId },
          });
          if (data?.getAllInventoryItemsWithStock) {
            setProducts(data.getAllInventoryItemsWithStock as ItemDetails[]);
          }
          return true;
        },
        () => {
          setLoading(false);
        }
      );
      if (result.error) {
        dispatch(
          showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
        );
      }
    },
    []
  );

  const searchInventoryItems = useCallback(
    async (storeId: number, warehouseId: number | null, search: string): Promise<ItemDetails[]> => {
      const { data } = await searchItems({
        variables: { storeid: storeId, warehouseid: warehouseId, search, limit: 20 },
        fetchPolicy: "network-only",
      });
      return (data?.searchInventoryItems ?? []) as ItemDetails[];
    },
    [searchItems]
  );

  return {
    products,
    loading,
    fetchProductsByStoreId,
    fetchProductsWithStockByStoreAndWarehouseId,
    searchInventoryItems,
  };
};

export default useProducts;
