# Content Manager contract v0.1

> Updated 2026-09-23: the frontend-first tool plan below is provisional. It does not declare new fields implemented or the backend/mobile contract approved.

This is the frontend-owned contract used by the editor, mock adapter and preview spike. The backend adapter may translate endpoint names or response envelopes, but IDs and relationships remain stable.

## Ownership and permissions

Only `content_manager` is granted authoring permissions in the frontend matrix. The backend remains authoritative for ownership and authorization. Parent and admin are not assumed to inherit story authoring access.

| Permission | Scope |
| --- | --- |
| read | story list/detail, assets, preview |
| edit | story metadata, pages, roles, slots, vocabulary, quizzes |
| publish | validate and publish a draft version |
| hide | remove a published story from the catalog |
| upload | create an asset upload |
| statistics | content statistics |

## Stable relationships

- A page is referenced by `pageId`; reorder must not change page IDs.
- A slot belongs to a role and references a page by `pageId`.
- Vocabulary and quiz entries reference a page by `pageId`.
- A published version keeps an immutable `snapshot`; editing the draft does not mutate older versions.
- `draftDirty` means saved draft content differs from the latest published version. It is not the same as unsaved form state.

## Save and revision

- Every authoring mutation sends the current story `revision` as an expected revision.
- The server increments the revision atomically after a successful mutation and returns the updated story.
- A stale expected revision returns `409 REVISION_CONFLICT`; the editor keeps the current input and asks the user to reload before retrying.
- Publish, validate and hide are coordinated with the same story mutation scope. Publish is disabled while the metadata form has unsaved changes.

## Fixture

`story-contract-multi-role` contains three pages, two roles, layered slots on multiple pages, vocabulary and a quiz. It is available in mock mode at `/content/stories/story-contract-multi-role/preview` and is used to verify that preview renders every role on the current page.

## Frontend-first authoring tools: proposed boundary

Implementation order and acceptance criteria: [Content Manager plan, section 10](CONTENT_MANAGER_IMPLEMENTATION_PLAN.md#10-đợt-ưu-tiên-bộ-công-cụ-dựng-truyện-trên-frontend-23092026). UI depends on service/domain shapes; mock persistence and real transport remain behind the service boundary. Existing routes remain unchanged.

### Assets

| Field / concern | Frontend convention for the first tool release |
| --- | --- |
| Identity | Stable `id`; story references use IDs, never file names or temporary object URLs |
| Existing metadata | `name`, `kind` (`image`/`audio`), `mimeType`, `size`, `url`; optional width/height/duration/processingStatus |
| Proposed classification | Optional `usage`: `cover`, `background`, `character`, `narration`, `vocabulary`, `quiz`; filter hint, not a permission or a replacement for MIME/kind; missing usage means unclassified |
| Local storage | Mock-only Blob store in IndexedDB; metadata and draft remain linked by asset ID; resolve a runtime URL when rendering |
| Real storage | Server supplies durable identity, readiness and a resolvable URL; signed URL expiry must be refreshed without changing story references |
| Selection | Image-only for cover/background/default role image; audio playback uses audio UI when implemented; reject incompatible or not-ready assets |
| Failure | Missing record, missing local Blob, URL load failure and processing failure are visible; never substitute an unrelated image silently |

The current mock upload reads FormData metadata but returns `/images/hero.webp` for every file. Multipart support in `assetService.js` therefore does not yet prove local file persistence or a working backend upload. F1 must preserve actual selected bytes. Keep local Blob writes and metadata writes consistent with rollback/cleanup; namespace by demo account and reset together. Object URLs are runtime resources: release them when unused and do not serialize them into draft/version snapshots. Local storage is browser-specific and is not a mobile-accessible upload service.

No asset deletion/replacement tool in this first scope. A later deletion feature must check draft and published references; replacing bytes behind an existing ID must not mutate the appearance of an immutable published version. Real asset retention/versioning remains a backend review item.

### Canvas conventions pending Mobile review

These rules target F0–F5 and must be recorded in the shared renderer/config, rather than copied across forms. Existing CSS is a spike, not proof of Mobile fidelity.

- Stage aspect ratio: provisional 16:9; origin top-left; slot X/Y are percentages from 0 to 100 of the stage, locating the slot center.
- Anchor: center only in the first tool release. Normalize absent/null to center for rendering; reject unsupported anchors visibly rather than ignoring them.
- Scale: finite and positive; horizontal flip around the center. Proposed unscaled slot box is 19% of stage width, square, with image fit `contain`; remove viewport-dependent minimum width from the story geometry. Validate actual supported scale/bounds with Mobile before integration.
- Layer: integer; lower renders first, ties resolve by stable slot ID. Layer controls role slots; background is below them, story text uses a separate readable overlay. Layer buttons must produce a deterministic order.
- Background: fit `cover`, centered. An absent page background may explicitly inherit the story cover; an explicit broken background ID must show an error instead of silently inheriting cover.
- Renderer is shared by live form preview and saved preview. Unsaved preview receives a local composed draft; saved preview uses the persisted story and shows its revision. Neither preview mutates the draft.

### Mutations and save state to complete

Keep `pageId`/`roleId`/`slotId` stable. Add slot update to the service and mock adapter using the same expected revision semantics as existing mutations; do not emulate update by deleting/recreating a slot. Vocabulary/quiz updates follow in the subsequent completion phase.

Every editable form must contribute dirty/pending state before publishing can be treated as safe. Existing metadata dirty handling is a starting point, not evidence of all-form coverage. Validation results apply only to their story/revision; any content save invalidates them. Proposed issues retain `code`, `message`, `tab`, `entityId`, `fieldPath` so the UI can navigate to the failing control.

Frontend validation, revision conflicts and mock snapshots support tool development. Backend ownership, atomic publish, durable media and GeneratedStory/version behavior require separate real integration evidence.
