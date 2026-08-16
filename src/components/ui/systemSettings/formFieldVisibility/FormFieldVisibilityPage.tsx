"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FormFieldVisibilitySettings from "./FormFieldVisibilitySettings";
import { FormKey } from "@/lib/formFieldVisibility/types";
import { SUPPLIER_HIDEABLE_FIELDS } from "@/lib/formFieldVisibility/supplierFields";
import { CUSTOMER_HIDEABLE_FIELDS } from "@/lib/formFieldVisibility/customerFields";
import { PRODUCT_HIDEABLE_FIELDS, PRODUCT_STONE_DETAILS_BULK_TOGGLE } from "@/lib/formFieldVisibility/productFields";

// Tabs are added here incrementally as each form's manifest is wired up —
// Supplier first, then Customer, then Product.
const TABS: { key: FormKey; label: string }[] = [
  { key: "supplier", label: "Supplier" },
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
];

const FormFieldVisibilityPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FormKey>(TABS[0].key);

  const renderTabContent = () => {
    // key={formkey} is required here, not cosmetic — without it React reuses the same
    // FormFieldVisibilitySettings instance across tab switches (same component type,
    // same tree position), so its internal loadedOnce/localHidden state from whichever
    // tab loaded first never resets when the formkey prop changes underneath it.
    switch (activeTab) {
      case "supplier":
        return <FormFieldVisibilitySettings key="supplier" formkey="supplier" fields={SUPPLIER_HIDEABLE_FIELDS} />;
      case "customer":
        return <FormFieldVisibilitySettings key="customer" formkey="customer" fields={CUSTOMER_HIDEABLE_FIELDS} />;
      case "product":
        return (
          <FormFieldVisibilitySettings
            key="product"
            formkey="product"
            fields={PRODUCT_HIDEABLE_FIELDS}
            bulkToggle={PRODUCT_STONE_DETAILS_BULK_TOGGLE}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "4px 0 32px" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex justify-content-between align-items-center w-100">
          <div className="page-title">
            <h4>Form Field Visibility</h4>
            <h6>Choose which optional fields appear on entry forms for everyone at this store</h6>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>
            ← Back
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs mt-3 mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.key}>
            <button
              type="button"
              className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card">
        <div className="card-body">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default FormFieldVisibilityPage;
