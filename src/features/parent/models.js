/**
 * Child data exposed to Parent Portal. A Child is now an account holder; the
 * relationship/link fields remain optional until the Backend contract is
 * finalized.
 * @typedef {{ id: string, accountId?: string, displayName: string, birthDate: string, avatar: string, linkStatus?: "pending"|"active"|"revoked" }} ChildProfile
 */
/** @typedef {{ plan: string, childProfileLimit: number|null, usedChildProfiles: number, resetAt: string|null, timezone: string }} Entitlement */
