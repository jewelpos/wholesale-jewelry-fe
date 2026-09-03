import type { KeyboardEvent } from "react";

const ENTER_AS_TAB_FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Pressing Enter in a plain text/number field submits the form by default (since the
// form has a submit button) — cashiers used to tabbing between fields kept hitting
// Enter mid-entry and accidentally saving the document. This makes Enter behave like
// Tab instead: move focus to the next focusable field without submitting.
export const handleEnterAsTab = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const form = e.currentTarget.closest("form");
  if (!form) return;
  const focusable = Array.from(
    form.querySelectorAll<HTMLElement>(ENTER_AS_TAB_FOCUSABLE_SELECTOR)
  ).filter((el) => el.offsetParent !== null);
  const currentIndex = focusable.indexOf(e.currentTarget);
  const next = focusable[currentIndex + 1];
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement) next.select();
  }
};
