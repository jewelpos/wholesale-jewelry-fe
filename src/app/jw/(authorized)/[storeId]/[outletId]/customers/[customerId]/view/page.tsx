"use client";

import Content from "@/components/layout/Content";
import CustomerForm from "@/components/ui/customers/customerForm/CustomerForm";
import PageHeader from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";

const ViewCustomer = () => {
  const router = useRouter();
  return (
    <Content>
      <PageHeader title="View customer" showBreadcrumb />
      <CustomerForm disableField />
      <div className="card sticky-footer">
        <div className="card-body">
          <div className="text-end">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => router.back()}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Content>
  );
};

export default ViewCustomer;
