// Shared react-select styles — import and pass as the `styles` prop on any Select/AsyncSelect.
// Amber focus ring only — no background override so it works with any DreamPOS skin or dark mode.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleBase = Record<string, any>;

export const selectStyles = {
  menuPortal: (base: StyleBase) => ({ ...base, zIndex: 9999 }),
  menu: (base: StyleBase) => ({ ...base, zIndex: 9999 }),
  control: (base: StyleBase, state: { isFocused: boolean }) => ({
    ...base,
    borderColor: state.isFocused ? "#faad14" : base.borderColor,
    boxShadow: state.isFocused ? "0 0 0 2px rgba(250, 173, 20, 0.3)" : base.boxShadow,
    transition: "border-color 0.15s ease",
  }),
};
