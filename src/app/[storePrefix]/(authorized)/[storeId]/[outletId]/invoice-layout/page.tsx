import InvoiceLayoutSelector from "@/components/ui/invoiceLayout/InvoiceLayoutSelector";

const InvoiceLayoutPage = async () => {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <InvoiceLayoutSelector />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceLayoutPage;
