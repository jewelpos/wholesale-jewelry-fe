import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useLazyQuery } from "@apollo/client";
import { useCallback, useState } from "react";
import {
  GET_SUPPLIER_QUERY,
  GET_SUPPLIERS_BY_STORE_ID_QUERY,
  GET_SUPPLIER_BALANCE_DUE_QUERY,
  GET_FULL_SUPPLIER_INVOICE_LIST_QUERY,
} from "@/lib/graphql/query/supplier";
import {
  SupplierBalanceDueType,
  SupplierType,
  SupplierInvoiceType,
} from "@/types/supplier";

const useSupplier = () => {
  const dispatch = useAppDispatch();
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState<SupplierType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [getSuppliersByStoreId] = useLazyQuery(GET_SUPPLIERS_BY_STORE_ID_QUERY);
  const [getSupplierBySupplierId] = useLazyQuery(GET_SUPPLIER_QUERY);
  const [getSupplierBalanceDue] = useLazyQuery(GET_SUPPLIER_BALANCE_DUE_QUERY);
  const [getFullSupplierInvoiceList] = useLazyQuery(
    GET_FULL_SUPPLIER_INVOICE_LIST_QUERY
  );
  const [supplierBalanceDue, setSupplierBalanceDue] = useState<
    SupplierBalanceDueType[]
  >([]);
  const [supplierInvoices, setSupplierInvoices] = useState<
    SupplierInvoiceType[]
  >([]);

  const fetchSupplier = useCallback(
    async (storeId: number, supplierId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getSupplierBySupplierId({
            variables: { storeid: storeId, supplierid: supplierId },
          });
          if (data.getSupplierBySupplierId) {
            setSupplier(data.getSupplierBySupplierId);
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
    []
  );

  const fetchSuppliersByStoreId = useCallback(async (storeId: number) => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getSuppliersByStoreId({
          variables: { storeid: storeId },
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

  const fetchSupplierBalanceDue = useCallback(
    async (storeId: number, supplierId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getSupplierBalanceDue({
            variables: {
              supplierid: supplierId,
              storeid: storeId,
            },
          });
          if (data?.getSupplierBalanceDue) {
            if (data.getSupplierBalanceDue.length === 0) {
              dispatch(
                showNotification({
                  message: "There is no balance due for this supplier",
                  type: NOTIFICATION_TYPES.ERROR,
                })
              );
            }
            setSupplierBalanceDue(data.getSupplierBalanceDue);
          }
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
    []
  );

  const fetchSupplierInvoices = useCallback(
    async (storeId: number, supplierId: number) => {
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getFullSupplierInvoiceList({
            variables: {
              storeid: storeId,
              supplierid: supplierId,
            },
          });
          if (data?.getFullSupplierInvoiceList) {
            setSupplierInvoices(data.getFullSupplierInvoiceList);
          }
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
    []
  );

  return {
    fetchSuppliersByStoreId,
    suppliers,
    supplier,
    fetchSupplier,
    fetchSupplierBalanceDue,
    fetchSupplierInvoices,
    loading: loading,
    supplierBalanceDue,
    supplierInvoices,
  };
};

export default useSupplier;
