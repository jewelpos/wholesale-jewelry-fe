// Normalizes a name to Proper Case (Title Case) regardless of how it was entered —
// e.g. "ABC JEWELRY LLC" or "abc jewelry llc" both become "Abc Jewelry Llc". Lowercases
// first so ALL-CAPS input is actually normalized, not just left alone with the first
// letter re-capitalized.
export function toProperCase(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
