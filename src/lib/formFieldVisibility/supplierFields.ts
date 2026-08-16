import { HideableFieldDef } from "./types";

export const SUPPLIER_HIDEABLE_FIELDS: HideableFieldDef[] = [
  { key: "address1", label: "Address", section: "Address" },
  { key: "state", label: "State", section: "Address" },
  { key: "zipcode", label: "Zip Code", section: "Address" },
  { key: "country", label: "Country", section: "Address" },
  { key: "cellphone", label: "Cell Phone", section: "Contact Info" },
  { key: "webaddress", label: "Web Address", section: "Contact Info" },
  { key: "termsid", label: "Payment Terms", section: "Terms" },
  { key: "shippimgmethod", label: "Shipping Method", section: "Terms" },
  { key: "accountno", label: "Account #", section: "Account" },
  { key: "supplierstatus", label: "Status", section: "Status" },
  { key: "remarks", label: "Notes", section: "Notes" },
];
