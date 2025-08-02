import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useLazyQuery } from "@apollo/client";
import {
  CreditAdjustmentFormType,
  SupplierBalanceDueType,
} from "@/types/supplier";
import { GET_SUPPLIER_CREDIT_BALANCE_DUE_QUERY } from "@/lib/graphql/query/supplier";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectSupplierInvoice from "@/components/forms/SelectSupplierInvoice";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import PlaceHolder from "../../PlaceHolder";
import LabelLoader from "../../LabelLoader";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";

const CreditAdjustmentForm = ({
  storeId,
  closePaymentModal,
}: {
  storeId: number;
  closePaymentModal: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    register,
  } = useForm<CreditAdjustmentFormType>({
    defaultValues: {
      supplierid: 0,
      postingdate: dayjs(),
      paymentmodeid: 0,
      checkcardno: "", // will store selected invoice number
      amount: "",
      invoicenumber: "",
      reference: "",
    },
    mode: "all",
  });

  const [getCreditBalanceDue] = useLazyQuery(
    GET_SUPPLIER_CREDIT_BALANCE_DUE_QUERY
  );
  const [supplierInvoices, setSupplierInvoices] = useState<
    SupplierBalanceDueType[]
  >([]);
  const [balanceDueInvoices, setBalanceDueInvoices] = useState<
    SupplierBalanceDueType[]
  >([]);
  const [loading, setLoading] = useState(false);

  const supplierId = watch("supplierid");
  const selectedInvoice = watch("checkcardno");

  // Fetch credit balance due when supplier changes
  useEffect(() => {
    const fetchData = async () => {
      if (!supplierId) return;
      const result = await handleTryCatch(
        async () => {
          setLoading(true);
          const { data } = await getCreditBalanceDue({
            variables: { storeid: storeId, supplierid: supplierId },
          });
          if (data?.getSupplierCreditBalanceDue) {
            const { balanceDueSuppliers, balanceDueInvoices } =
              data.getSupplierCreditBalanceDue;
            setSupplierInvoices(balanceDueSuppliers || []);
            setBalanceDueInvoices(balanceDueInvoices || []);
          }
        },
        () => setLoading(false)
      );

      if (result.error) {
        dispatch(
          showNotification({
            message: result.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }
    };

    fetchData();
  }, [supplierId, storeId, getCreditBalanceDue, dispatch]);

  // Auto-fill amount based on selected invoice balance
  useEffect(() => {
    if (selectedInvoice) {
      const invoice = supplierInvoices.find(
        (inv) => inv.veninvoiceno === selectedInvoice
      );
      if (invoice) {
        setValue("amount", invoice.veninvamtbalance.toString());
      }
    } else {
      setValue("amount", "");
    }
  }, [selectedInvoice, supplierInvoices, setValue]);

  const onSubmit = (data: CreditAdjustmentFormType) => {
    // TODO: integrate create credit adjustment mutation when backend is ready
    dispatch(
      showNotification({
        message: "Credit adjustment feature is under development.",
        type: NOTIFICATION_TYPES.INFO,
      })
    );
    closePaymentModal();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Supplier, posting date, payment mode */}
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Supplier</label>
            <Controller
              control={control}
              name="supplierid"
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                />
              )}
            />
            {errors.supplierid && (
              <div className="invalid-feedback d-block">
                {errors.supplierid.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Posting Date</label>
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
            <label>Payment Mode</label>
            <Controller
              control={control}
              name="paymentmodeid"
              rules={{ required: "Payment mode is required" }}
              render={({ field }) => (
                <SelectPaymentMode trigger={trigger} {...field} />
              )}
            />
            {errors.paymentmodeid && (
              <div className="invalid-feedback d-block">
                {errors.paymentmodeid.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice selection, amount, reference */}
      <div className={supplierId && !loading ? "" : "opacity-50 pe-none"}>
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Invoice #" loading={loading} />
              <Controller
                control={control}
                name="checkcardno"
                rules={{ required: "Invoice is required" }}
                render={({ field }) => (
                  <SelectSupplierInvoice
                    trigger={trigger}
                    storeId={storeId}
                    supplierId={supplierId}
                    invoices={supplierInvoices}
                    hasInvoices={true}
                    {...field}
                  />
                )}
              />
              {errors.checkcardno && (
                <div className="invalid-feedback d-block">
                  {errors.checkcardno.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Amount" loading={loading} />
              <input
                type="text"
                className="form-control"
                {...register("amount", { required: "Amount is required" })}
                disabled
              />
              {errors.amount && (
                <div className="invalid-feedback d-block">
                  {errors.amount.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <label>Reference</label>
              <input
                type="text"
                className="form-control"
                {...register("reference")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice list table */}
      {loading && [1, 2, 3, 4, 5].map((i) => <PlaceHolder key={i} />)}
      {!loading && !!balanceDueInvoices.length && (
        <div className="modal-body-table">
          <div className="table-responsive">
            <table className="table datanew">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Invoice Date</th>
                  <th>Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {balanceDueInvoices.map((inv) => (
                  <tr key={inv.veninvoiceno}>
                    <td>{inv.veninvoiceno}</td>
                    <td>
                      {dayjs(Number(inv.veninvoicedate)).format(TIME_FORMAT)}
                    </td>
                    <td>${inv.veninvoicetotal}</td>
                    <td>${inv.veninvamtpaid}</td>
                    <td>${inv.veninvamtbalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action footer */}
      {!!supplierId && !loading && (
        <ActionFooter handleCancel={closePaymentModal}>
          <ButtonLoader
            loading={false}
            btnText="Save"
            loadingText="Saving ..."
            disabled={!isValid}
          />
        </ActionFooter>
      )}
    </form>
  );
};

export default CreditAdjustmentForm;
