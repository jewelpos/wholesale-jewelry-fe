"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import dayjs from "dayjs";
import { useLazyQuery } from "@apollo/client";

import { SelectOption } from "@/types/form";
import {
  GET_SUPPLIER_PURCHASE_ORDER_LIST_BY_STATUS_QUERY,
  GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY,
} from "@/lib/graphql/query/purchase";
import { PurchaseOrder } from "@/types/purchase";
import { useDebounce } from "@/hooks/useDebounce";
import { TIME_FORMAT } from "@/lib/config/constants";
import { selectStyles } from "@/lib/styles/selectStyles";

const formatPoDate = (raw: unknown) => {
  if (!raw) return "";
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return dayjs(asNumber).format(TIME_FORMAT);
  }
  const d = dayjs(String(raw));
  return d.isValid() ? d.format(TIME_FORMAT) : String(raw);
};

const SelectPurchaseOrder = ({
  value,
  onChange,
  onChangeAdditional,
  className,
  trigger,
  storeId,
  supplierId,
  postatus,
  disableField,
  ...field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 400);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [getPurchaseOrders, { loading }] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY
  );

  const [getPurchaseOrdersByStatus, { loading: loadingByStatus }] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_LIST_BY_STATUS_QUERY
  );

  const portalTarget = typeof window !== "undefined" ? document.body : undefined;

  const fetchPurchaseOrders = async (searchText?: string) => {
    if (!storeId) return;

    const statusId = Number(postatus);
    if (Number.isFinite(statusId) && statusId > 0) {
      const { data } = await getPurchaseOrdersByStatus({
        variables: {
          storeid: Number(storeId),
          supplierid:
            supplierId != null && Number.isFinite(Number(supplierId))
              ? Number(supplierId)
              : undefined,
          postatus: statusId,
        },
        fetchPolicy: "no-cache",
      });

      const all: PurchaseOrder[] = data?.getSupplierPurchaseOrderListByStatus || [];
      const trimmed = String(searchText || "").trim().toLowerCase();
      if (!trimmed) {
        setPurchaseOrders(all);
        return;
      }

      setPurchaseOrders(
        all.filter((po) => {
          const haystack = `${po.ponumber ?? ""} ${po.suppliername ?? ""} ${formatPoDate(po.podate)}`.toLowerCase();
          return haystack.includes(trimmed);
        })
      );
      return;
    }

    const trimmed = String(searchText || "").trim();
    const filters = trimmed
      ? [
          {
            key: "ponumber, suppliername, podate",
            value: {
              filterType: "text",
              operator: "OR",
              conditions: [
                { filterType: "text", type: "contains", filter: trimmed },
              ],
            },
          },
        ]
      : [];

    const { data } = await getPurchaseOrders({
      variables: {
        storeid: Number(storeId),
        supplierid:
          supplierId != null && Number.isFinite(Number(supplierId))
            ? Number(supplierId)
            : undefined,
        page: 1,
        perpage: 50,
        filters,
        sortModel: [],
        rowGroupCols: [],
        groupKeys: [],
      },
      fetchPolicy: "no-cache",
    });

    setPurchaseOrders(data?.getSupplierPurchaseOrderList?.data || []);
  };

  useEffect(() => {
    if (storeId) {
      fetchPurchaseOrders(debouncedInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, debouncedInput]);

  const purchaseOrderOptions: SelectOption[] = useMemo(
    () =>
      purchaseOrders.map((po) => ({
        value: Number(po.ponumber),
        label: `${po.ponumber} - ${po.suppliername || ""} - ${formatPoDate(po.podate)}`,
      })),
    [purchaseOrders]
  );

  const selectedOption: SelectOption | null = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const opt = purchaseOrderOptions.find((opt) => Number(opt.value) === n);
    return opt ? { value: opt.value, label: opt.label } : null;
  }, [purchaseOrderOptions, value]);

  return (
    <Select<SelectOption>
      isLoading={loading || loadingByStatus}
      options={purchaseOrderOptions}
      placeholder="Select PO"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      styles={selectStyles}
      value={selectedOption}
      onChange={(option) => {
        const selected = purchaseOrders.find(
          (po) => Number(po.ponumber) === Number(option?.value)
        );
        if (onChange) onChange(option?.value ? Number(option.value) : 0);
        if (onChangeAdditional) onChangeAdditional(selected);
        if (trigger && field?.name) trigger(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      {...field}
    />
  );
};

export default SelectPurchaseOrder;
