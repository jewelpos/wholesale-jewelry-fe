"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useSupplierPayment from "@/hooks/useSupplierPayment";
import { paymentTypes, TIME_FORMAT } from "@/lib/config/constants";
import { components } from "react-select";
import dayjs from "dayjs";
import { Divider } from "antd";
import { selectStyles } from "@/lib/styles/selectStyles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomOption = (props: any) => {
  const { data } = props;
  return (
    <>
      <components.Option {...props}>
        <div>
          <strong># {data.paymentid}</strong> <br />
          <b>Mode: </b>
          {data.paymode} <br />
          <b>Posting Date: </b>
          {dayjs(Number(data.postingdate)).format(TIME_FORMAT)} <br />
          <b>Amount: </b>${data.amountpaid}
        </div>
      </components.Option>
      <Divider className="p-0 m-0" />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomSingleValue = (props: any) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div>
        <strong>{data.paymentid}</strong>
      </div>
    </components.SingleValue>
  );
};

const SelectPayment = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  supplierId,
  disableField,
  paymentType,
  hasPayments,
  propsPayments,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchNonVoidedSupplierPaymentTransactionList, payments, loading } =
    useSupplierPayment();

  useEffect(() => {
    if (storeId && supplierId && !hasPayments) {
      if (paymentType === paymentTypes.nonvoided) {
        fetchNonVoidedSupplierPaymentTransactionList(storeId, supplierId);
      }
    }
  }, [
    fetchNonVoidedSupplierPaymentTransactionList,
    storeId,
    supplierId,
    paymentType,
    hasPayments,
  ]);

  const paymentOptions: SelectOption[] = useMemo(
    () =>
      hasPayments
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          propsPayments.map((payment: any) => ({
            value: Number(payment.paymentid),
            label: payment.paymentid,
            ...payment,
          }))
        : payments.map((payment) => ({
            value: Number(payment.paymentid),
            label: payment.paymentid,
            ...payment,
          })),
    [payments, hasPayments, propsPayments]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={paymentOptions}
      placeholder="Select payment"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={paymentOptions.find((opt) => opt.value === value)}
      components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
      onChange={(option) => {
        onChange(option?.value);
        trigger(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectPayment;
