"use client";

import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const InvoiceFromSOForm = ({ salesorderno }: { salesorderno: number }) => {
  return <SalesInvoiceForm mode="NEW_INVOICE" salesorderno={salesorderno} />;
};

export default InvoiceFromSOForm;
