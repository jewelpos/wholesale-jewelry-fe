"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";

import ActionFooter from "@/components/ui/ActionFooter";
import ButtonLoader from "@/components/ui/ButtonLoader";

import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useDebounce } from "@/hooks/useDebounce";

import { CREATE_INVOICE_FROM_MEMO_MUTATION } from "@/lib/graphql/mutations/sales";
import { GET_MEMO_LIST_QUERY } from "@/lib/graphql/query/sales";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import type { SelectOption } from "@/types/form";

const extractInvoiceNumber = (raw: unknown): number | undefined => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;

  if (typeof raw === "string") {
    const direct = Number(raw);
    if (Number.isFinite(direct)) return direct;
    try {
      const parsed = JSON.parse(raw);
      return extractInvoiceNumber(parsed);
    } catch {
      return undefined;
    }
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [obj.invoicenumber, obj.invoiceNumber, obj.invoice_no, obj.invoice, obj.data];
    for (const c of candidates) {
      const found = extractInvoiceNumber(c);
      if (typeof found === "number") return found;
    }
  }

  return undefined;
};

const CreateInvoiceFromMemoForm = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const searchParams = useSearchParams();

  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const memonumberRaw = searchParams.get("memonumber") ?? "";
  const memonumberFromQuery = useMemo(() => {
    const n = Number(memonumberRaw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [memonumberRaw]);

  const [selectedMemoNumber, setSelectedMemoNumber] = useState<number | undefined>(
    memonumberFromQuery
  );
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [memoSearch, setMemoSearch] = useState("");
  const debouncedMemoSearch = useDebounce(memoSearch, 500);

  useEffect(() => {
    setSelectedMemoNumber(memonumberFromQuery);
  }, [memonumberFromQuery]);

  const [getMemoList, { data: memoData, loading: memoLoading }] = useLazyQuery(
    GET_MEMO_LIST_QUERY,
    {
      fetchPolicy: "network-only",
    }
  );

  useEffect(() => {
    if (!menuIsOpen) return;
    if (!parsedStoreId || !parsedOutletId) return;

    const filters = debouncedMemoSearch
      ? [
          {
            key: "companyname",
            value: {
              filterType: "text",
              operator: "OR",
              conditions: [
                {
                  filterType: "text",
                  type: "contains",
                  filter: debouncedMemoSearch,
                },
              ],
            },
          },
        ]
      : undefined;

    void getMemoList({
      variables: {
        storeid: parsedStoreId,
        outletid: parsedOutletId,
        page: 1,
        perpage: 25,
        filters,
        sortModel: [],
        rowGroupCols: [],
        groupKeys: [],
      },
    });
  }, [debouncedMemoSearch, getMemoList, menuIsOpen, parsedOutletId, parsedStoreId]);

  const memoOptions: SelectOption[] = useMemo(() => {
    const rows = memoData?.getMemoList?.data ?? [];
    return rows
      .map((r: any) => {
        const n = Number(r?.memonumber);
        if (!Number.isFinite(n) || n <= 0) return null;
        const company = String(r?.companyname ?? "").trim();
        return {
          value: n,
          label: company ? `#${n} - ${company}` : `#${n}`,
        };
      })
      .filter(Boolean) as SelectOption[];
  }, [memoData]);

  const [createInvoiceFromMemo, { loading }] = useMutation(CREATE_INVOICE_FROM_MEMO_MUTATION);

  const canSubmit = Boolean(parsedStoreId) && Boolean(selectedMemoNumber) && !loading;

  const handleSubmit = async () => {
    if (!parsedStoreId || !selectedMemoNumber) return;

    const result = await handleTryCatch(async () => {
      const { data } = await createInvoiceFromMemo({
        variables: {
          input: {
            storeid: parsedStoreId,
            memonumber: selectedMemoNumber,
          },
        },
      });

      const response = data?.createInvoiceFromMemo;

      if (!response?.success) {
        throw new Error(response?.error || response?.message || "Failed to create invoice");
      }

      const invoiceNumber = extractInvoiceNumber(response?.data);
      dispatch(
        showNotification({
          message:
            response?.message ||
            (invoiceNumber
              ? `Invoice #${invoiceNumber} created successfully`
              : "Invoice created successfully"),
          type: NOTIFICATION_TYPES.SUCCESS,
        })
      );

      if (invoiceNumber) {
        router.push(`${basePath}/sales/${invoiceNumber}/edit`);
      } else {
        router.back();
      }

      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4 col-sm-12">
              <div className="input-block">
                <label>Memo Number</label>
                <Select<SelectOption>
                  isLoading={memoLoading}
                  options={memoOptions}
                  placeholder="Select memo"
                  isClearable
                  className="form-control p-0 select-form-custom"
                  value={
                    selectedMemoNumber
                      ? {
                          value: selectedMemoNumber,
                          label:
                            memoOptions.find((m) => Number(m.value) === selectedMemoNumber)
                              ?.label || `#${selectedMemoNumber}`,
                        }
                      : null
                  }
                  onChange={(option) => {
                    setSelectedMemoNumber(option?.value ? Number(option.value) : undefined);
                  }}
                  menuIsOpen={menuIsOpen}
                  onMenuOpen={() => setMenuIsOpen(true)}
                  onMenuClose={() => setMenuIsOpen(false)}
                  inputValue={memoSearch}
                  onInputChange={(v) => setMemoSearch(v)}
                />
              </div>
            </div>
          </div>

          {!selectedMemoNumber && (
            <div className="text-danger" style={{ marginTop: 8 }}>
              Please select a memo and try again.
            </div>
          )}
        </div>
      </div>

      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={loading}
          btnText="Create Invoice"
          loadingText="Creating..."
          type="button"
          className="btn btn-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        />
      </ActionFooter>
    </>
  );
};

export default CreateInvoiceFromMemoForm;
