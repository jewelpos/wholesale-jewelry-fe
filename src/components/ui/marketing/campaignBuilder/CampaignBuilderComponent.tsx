"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Package, Users, Mail } from "react-feather";
import CampaignProductPicker, { CampaignItem } from "./CampaignProductPicker";
import CampaignCustomerPicker, { CampaignCustomer } from "./CampaignCustomerPicker";
import CampaignComposeForm from "./CampaignComposeForm";

const CampaignBuilderComponent = () => {
  const { storeId, outletId } = useParams();
  const storeid = parseInt(storeId as string, 10);
  const outletid = parseInt(outletId as string, 10);

  const [selectedItems, setSelectedItems] = useState<CampaignItem[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<CampaignCustomer[]>([]);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card">
        <div className="card-header d-flex align-items-center gap-2">
          <Package size={16} />
          <span className="fw-semibold">1. Select Products</span>
        </div>
        <div className="card-body">
          <CampaignProductPicker
            storeid={storeid}
            outletid={outletid}
            selectedItems={selectedItems}
            onChange={setSelectedItems}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-2">
          <Users size={16} />
          <span className="fw-semibold">2. Select Customers</span>
        </div>
        <div className="card-body">
          <CampaignCustomerPicker
            storeid={storeid}
            selectedCustomerIds={selectedCustomers.map((c) => c.customerid)}
            onChange={setSelectedCustomers}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-2">
          <Mail size={16} />
          <span className="fw-semibold">3. Compose &amp; Send</span>
        </div>
        <div className="card-body">
          <CampaignComposeForm
            storeid={storeid}
            outletid={outletid}
            selectedItems={selectedItems}
            selectedCustomers={selectedCustomers}
            onSent={() => {
              setSelectedItems([]);
              setSelectedCustomers([]);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilderComponent;
