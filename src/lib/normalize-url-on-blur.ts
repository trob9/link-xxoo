import type { FocusEvent } from "react";
import { normalizeUrlInput } from "./url-normalize";

// Shared onBlur handler for plain (uncontrolled) URL text inputs — mutates
// the field's value in place so the corrected form gets submitted, without
// needing to lift the field into controlled React state.
export function normalizeUrlOnBlur(e: FocusEvent<HTMLInputElement>) {
  const next = normalizeUrlInput(e.target.value);
  if (next !== e.target.value) {
    e.target.value = next;
  }
}
