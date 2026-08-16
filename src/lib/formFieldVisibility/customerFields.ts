import { HideableFieldDef } from "./types";

export const CUSTOMER_HIDEABLE_FIELDS: HideableFieldDef[] = [
  { key: "custlname", label: "Last Name", section: "Contact Person" },
  { key: "custphone2", label: "Secondary Phone", section: "Contact Info" },
  { key: "termsid", label: "Payment Terms", section: "Terms" },
  { key: "custshippingmethod", label: "Shipping Method", section: "Terms" },
  { key: "default_salesrep_userid", label: "Sales Representative", section: "Sales Representative" },
  { key: "custcreditlimit", label: "Credit Limit", section: "Financials" },
  { key: "custdiscount", label: "Discount %", section: "Financials" },
  { key: "custsalestax", label: "Sales Tax %", section: "Financials" },
  { key: "status", label: "Status", section: "Status" },
  { key: "custalert", label: "Alert", section: "Alerts" },
  { key: "custalertremarks", label: "Alert Remarks", section: "Alerts" },
  { key: "marketingoptin", label: "Marketing Opt-in", section: "Marketing" },
  { key: "custremarks", label: "Notes", section: "Notes" },
];
