"use client";

import React from "react";
import { CustomerType } from "@/types/customer";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import PlaceHolder from "../../PlaceHolder";

interface CustomerPrintDetailsProps {
  selectedCustomer?: CustomerType;
  loading?: boolean;
}

const CustomerPrintDetails = ({
  selectedCustomer,
  loading,
}: CustomerPrintDetailsProps) => {
  return (
    <div className="card ">
      <div className="card-body">
        <h5 className="card-title text-primary fw-bold mb-4">
          Customer Details
        </h5>

        {loading ? (
          [1, 2, 3, 4].map((item) => <PlaceHolder key={item} />)
        ) : (
          <>
            <div className="mb-3 row">
              <div className="col-5 text-end fw-semibold text-secondary">
                Company Name:
              </div>
              <div className="col-7">
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custcompanyname}
                </div>
              </div>
            </div>

            <div className="mb-3 row">
              <div className="col-5 text-end fw-semibold text-secondary">
                Address:
              </div>
              <div className="col-7">
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custadd1}
                </div>
              </div>
            </div>

            <div className="mb-3 row">
              <div className="col-5 text-end fw-semibold text-secondary">
                City / State / Zip:
              </div>
              <div className="col-7  gap-2">
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custcity}
                </div>
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custstate}
                </div>
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custzip}
                </div>
              </div>
            </div>

            <div className="mb-3 row">
              <div className="col-5 text-end fw-semibold text-secondary">
                Phone:
              </div>
              <div className="col-7">
                <div className="bg-light px-2 py-1 rounded text-secondary">
                  {selectedCustomer?.custphone1}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerPrintDetails;
