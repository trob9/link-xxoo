// One place to change the facts the legal pages assert. They're referenced
// from the policy prose rather than retyped, so a change to the contact
// address or the effective date can't leave one page contradicting the other.

export const SITE_NAME = "link.xxoo.ooo";

/** Where privacy requests, deletion requests and complaints go. */
export const CONTACT_EMAIL = "tom@tomtom.fyi";

/**
 * Shown on both policies. Bump this whenever the substance changes — not for
 * typo fixes, since a new date implies users should re-read.
 */
export const LEGAL_EFFECTIVE_DATE = "6 August 2026";

/** Governing law for the terms. */
export const JURISDICTION = "Victoria, Australia";
