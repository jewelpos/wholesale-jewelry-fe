export type FormKey = "customer" | "product" | "supplier";

export type HideableFieldDef = {
  key: string;
  label: string;
  section: string;
};

// Sentinel key for Product's Stone Details tab — gates the whole tab rather
// than a single react-hook-form field.
export const STONE_DETAILS_SECTION_KEY = "__section:stoneDetails";
