"use client";

import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const InvoiceFromMemoForm = ({ memonumber }: { memonumber: number }) => {
  return <SalesInvoiceForm mode="NEW_INVOICE" memonumber={memonumber} />;
};

export default InvoiceFromMemoForm;
