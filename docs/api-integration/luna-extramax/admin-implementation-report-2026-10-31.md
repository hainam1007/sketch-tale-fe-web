# Admin API integration — 31/10/2026

Status: **PARTIAL — frontend wired; live contract still needs confirmation**

## Implemented

- Added the six Swagger /users operation templates to the route allowlist. The Admin account list and detail now read /users; parent subscription fields are joined separately by userId.
- Added account creation using the documented AdminCreateUserDto.
- Replaced browser-only lock/unlock with PATCH /users/{id}/status and the documented { isLocked, reason } body. The UI asks for confirmation, accepts an optional reason, and refreshes user, overview, and audit queries.
- Added PUT /users/{id} profile editing when the GET response contains all seven fields in AdminUpdateUserDto. The form sends all seven current values, including the existing role and explicit nulls. Role is read-only until backend role policy and PUT omission/null semantics are verified; the editor stays disabled when GET omits a field.
- Kept plan changes on the Parent profile ID, and hid that action for accounts without a linked Parent profile.
- Exposed a list warning when the separate Parent profile lookup fails, and distinguished a failed lookup from a confirmed missing profile on the account detail page.
- Added the haveParentProfileSub plan field. Existing records that do not return the property preserve it as unspecified until an editor explicitly selects true or false.
- Report list failures now remain errors instead of becoming an empty successful list.
- Removed demo revenue and credit values from the Admin overview. Missing aggregate data shows as unavailable, and failed sources show their errors rather than zero counts.
- Removed localStorage and seeded account overrides from Admin user, report, and audit identity mapping.

## Contract limits

- Swagger provides no response schemas for the new /users operations. The UI currently accepts a JSON array or an { items } collection with account id; if the live response differs, the adapter reports an error rather than guessing.
- Lock/unlock is available only when the user response includes boolean isLocked or a recognized status.
- PUT profile editing is available only when the detail response includes firstName, lastName, email, phoneNumber, dob, gender, and role as own properties. Role changes remain blocked pending backend role policy and null behavior.
- Revenue, paid transaction totals, and credit-used aggregates still need a backend capability; the frontend now labels them as unavailable.
- No authenticated staging request or live mutation was made.

## Verification

- npm run lint: exit 0. Existing warnings remain in Content Manager, Admin Restrictions, Audit, and Story Pages; no warnings were reported in the edited Admin files.
- npm run build: exit 0. Vite reports the existing large JavaScript chunk warning (1,236.39 kB).
- Playwright and live smoke checks were not run.

## Next

1. Confirm and publish the /users list/detail response schemas and examples.
2. Verify the live create, update, and lock status contracts with a staging Admin account, then exercise the list and detail flows in Playwright.
3. Implement an overview aggregate for payments/revenue and credit usage before restoring those dashboard charts.
