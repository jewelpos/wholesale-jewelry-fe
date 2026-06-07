"use client";

import SalesInvoiceForm from "@/components/ui/sales/invoiceForm/SalesInvoiceForm";

const InvoiceFromMemoForm = ({ memonumber, creditFromMemo = false }: { memonumber: number; creditFromMemo?: boolean }) => {
  return <SalesInvoiceForm mode="NEW_INVOICE" memonumber={memonumber} creditFromMemo={creditFromMemo} />;
};

export default InvoiceFromMemoForm;
