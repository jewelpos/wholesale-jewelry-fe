"use client";

import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useLazyQuery, useMutation } from "@apollo/client";

import LabelLoader from "../../LabelLoader";
import PlaceHolder from "../../PlaceHolder";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { VOID_CUSTOMER_PAYMENT_MUTATION } from "@/lib/graphql/mutations/customer";
import { GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerCheckAppliedAmount } from "@/types/customer";

type VoidCustomerPaymentFormType = {
  postingdate: dayjs.Dayjs;
};

const VoidCustomerPaymentForm = ({
  storeId,
  closePaymentModal,
  customerpaymentid,
  transactionno,
  custcompanyname,
}: {
  storeId: number;
  closePaymentModal: () => void;
  customerpaymentid: number;
  transactionno: string;
  custcompanyname: string;
}) => {
  const dispatch = useAppDispatch();

  const [getAppliedAmounts, { data: appliedData, loading: appliedLoading }] =
    useLazyQuery(GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY);

  const [voidCustomerPayment, { loading: saving }] = useMutation(
    VOID_CUSTOMER_PAYMENT_MUTATION
  );

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<VoidCustomerPaymentFormType>({
    defaultValues: {
      postingdate: dayjs(),
    },
    mode: "all",
  });

  const appliedAmounts: CustomerCheckAppliedAmount[] = useMemo(() => {
    return appliedData?.getCustomerAppliedAmountList || [];
  }, [appliedData]);

  const totalAppliedAmount = useMemo(
    () =>
      appliedAmounts.reduce(
        (sum, item) => sum + Number(item.appliedamount || 0),
        0
      ),
    [appliedAmounts]
  );

  const parsedCustomerPaymentsId = useMemo(() => {
    const v = parseInt(String(transactionno), 10);
    return Number.isFinite(v) ? v : 0;
  }, [transactionno]);

  useEffect(() => {
    if (parsedCustomerPaymentsId && storeId) {
      getAppliedAmounts({
        variables: {
          storeid: storeId,
          customerpaymentsid: parsedCustomerPaymentsId,
        },
        fetchPolicy: "no-cache",
      });
    }
  }, [getAppliedAmounts, parsedCustomerPaymentsId, storeId]);

  const onSubmit = async (formData: VoidCustomerPaymentFormType) => {
    const payload = {
      storeid: storeId,
      customerpaymentid: customerpaymentid,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
    };

    const result = await handleTryCatch(async () => {
      const response = await voidCustomerPayment({
        variables: {
          input: payload,
        },
      });

      const { data } = response;
      if (data?.voidCustomerPayment) {
        const successData = data.voidCustomerPayment;
        dispatch(
          showNotification({
            message: successData.message,
            type: successData.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          })
        );
        if (successData.success) {
          closePaymentModal();
        }
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Customer</label>
            <input
              type="text"
              className="form-control"
              value={custcompanyname}
              disabled
            />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Posting Date" loading={false} />
            <Controller
              control={control}
              name="postingdate"
              rules={{ required: "Posting date is required" }}
              render={({ field }) => (
                <DatePicker
                  suffixIcon={<Calendar size={14} />}
                  format="YYYY-MM-DD"
                  className="form-control"
                  {...field}
                />
              )}
            />
            {errors.postingdate && (
              <div className="invalid-feedback d-block">
                {errors.postingdate.message}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Transaction #" loading={false} />
            <input
              type="text"
              className="form-control"
              value={transactionno}
              disabled
            />
          </div>
        </div>

        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Amount" loading={appliedLoading} />
            <input
              type="text"
              className="form-control"
              value={totalAppliedAmount.toFixed(2)}
              disabled
            />
          </div>
        </div>
      </div>

      {appliedLoading && [1, 2, 3, 4, 5, 6].map((i) => <PlaceHolder key={i} />)}

      {!appliedLoading && !!appliedAmounts.length && (
        <div className="modal-body-table">
          <div className="table-responsive">
            <table className="table datanew">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Applied Date</th>
                  <th>Applied Amount</th>
                  <th>Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {appliedAmounts.map((item) => {
                  const appliedDateValue = item.applieddate
                    ? dayjs(item.applieddate).format(TIME_FORMAT)
                    : "";
                  return (
                    <tr key={item.customercheckappliedamountid}>
                      <td>{item.invoicenumber}</td>
                      <td>{appliedDateValue}</td>
                      <td>${Number(item.appliedamount || 0).toFixed(2)}</td>
                      <td>{item.warehousename || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!appliedLoading && !!appliedAmounts.length && (
        <ActionFooter handleCancel={closePaymentModal}>
          <ButtonLoader
            loading={saving}
            btnText="Void"
            loadingText="Voiding ..."
            disabled={!isValid || saving}
          />
        </ActionFooter>
      )}
    </form>
  );
};

export default VoidCustomerPaymentForm;
