"use client";

import React, { useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { useQuery } from "@apollo/client";
import { GET_PAYMENT_TERMS_QUERY } from "@/lib/graphql/query/payment";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectPaymentTerms = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { loading, data } = useQuery(GET_PAYMENT_TERMS_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const paymentTermsOptions: SelectOption[] = useMemo(
    () =>
      data?.getPaymentTerms.map(
        (term: { termsid: number; termsname: string }) => ({
          value: term.termsid,
          label: term.termsname,
        })
      ),
    [data]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={paymentTermsOptions}
      placeholder="Select payment terms"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                paymentTermsOptions?.find((term) => term.value === value)
                  ?.label || "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value);
        trigger?.(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectPaymentTerms;
