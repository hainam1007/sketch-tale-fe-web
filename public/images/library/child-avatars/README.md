# Child avatar library

12 transparent PNG portraits (384 × 384), extracted from the user-supplied sheet.
Source: `design/source/child-profiles/avatar-sheet.png`.
Order: first 12 portraits, left to right, then top to bottom (the source contains 15).

Recreate with `node scripts/extract-child-avatars.mjs`.
The extractor isolates each portrait using its alpha channel to avoid clipping
hair or including a neighbouring portrait. Small detached decorative fragments
are excluded. The original artwork is retained in the source sheet.

The app catalog and accessible picker labels live in
`src/features/parent/services/childAvatarLibrary.js`.
`/images/library/child-palette.webp` is a separately generated decorative palette
used behind the chosen avatar. Avatar choices continue using the existing
session-scoped demo storage; this change does not introduce a backend avatar API.
