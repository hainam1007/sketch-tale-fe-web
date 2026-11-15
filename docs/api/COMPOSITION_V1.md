# Story page CompositionJson — FE format v1

Status: implemented in Frontend source; this is an FE-owned format because Backend delegates the internal JSON structure to FE. It does not claim Mobile has implemented the renderer.

Backend transport remains the existing nullable `CompositionJson` string on page create/update/read. Never send a second endpoint or pretend nested fields are Backend columns.

Complete example fixture: [`fixtures/content-composition-v1.example.json`](fixtures/content-composition-v1.example.json). Its `cdn.example.test` media URLs and all-zero UUIDs are illustrative placeholders; replace them with durable media URLs and real page/slot/quiz IDs before using it as API data.

## Example

```json
{
  "schemaVersion": 1,
  "stage": { "aspectRatio": "16:9", "coordinates": "percent", "anchor": "center" },
  "background": { "mode": "native", "assetId": "page-background:PAGE_ID", "offsetX": 0, "offsetY": 0, "scale": 1 },
  "subtitles": [{ "id": "cue-1", "text": "A sample caption", "startMs": 0, "durationMs": 2400 }],
  "imageObjects": [],
  "animationClips": [],
  "audioTracks": [],
  "slotExtensions": {},
  "quizExtensions": {},
  "assets": [],
  "extensions": {}
}
```

## Field rules

- Legacy `null`/empty CompositionJson keeps page behavior and is migrated to v1 only when composition fields are saved.
- `subtitles: null` uses page text; `[]` deliberately hides captions; cues are `{id,text,startMs,durationMs}` in integer milliseconds with a start inclusive/end exclusive interval.
- `background.mode` is `native` (page background URL), `inherit` (story cover), `asset` (asset in manifest), or `none` (plain stage). `offsetX/Y` are percentages of the available crop overflow; `scale` is 1–3.
- Stage coordinates are percentages, origin top-left, object position is its center unless anchor says otherwise. Image objects follow the existing editor model: `{id,name,assetId,x,y,scale,rotation,flip,layer,anchor}`.
- Animation clips follow the existing animation engine shape: `{id,targetId,kind,startMs,durationMs,preset?,easing?,params?,keyframes?,points?}`. Kinds are preset/keyframes/path. Time is ms, positions are percentages. `sequence` is migrated by the existing animation helper at the editor boundary and is not emitted as a second animation source.
- Audio tracks use `{id,assetId,name,type,startMs,durationMs?,volume}`. `type` is voiceover/music/effect, time is ms, volume is 0–1. No trim/start offset into the source file is supported.
- `slotExtensions` is keyed by the Backend slot ID and only carries `{rotation,layer,anchor,assetId}`. Position/scale/flip remain in the slot API. Null/empty asset override means use the role default.
- `quizExtensions` is keyed by quiz ID and carries `{feedback}`. The FE associates it with the page containing the key. This extension is editor/reader metadata; the quiz scoring API does not consume feedback.
- `assets` is a per-page manifest `{id,kind,name,url,mimeType?,size?,width?,height?,durationMs?}`. IDs are FE asset identities, not Backend entity UUIDs. URLs must survive reload and must not be `blob:`, `data:`, `file:` or localhost. Binary bytes never belong in JSON.
- Unknown fields are preserved for round-trip within supported v1. Malformed JSON and a higher schema version are retained raw and block overwrite/publish until recovered. Max composition JSON size is a Frontend safety limit of 1 MB; it is not a Backend limit.

## Current FE module and boundaries

Audit 15/11: codec giữ asset được tham chiếu trong `slotExtensions`, bảo toàn unknown fields của rows theo ID, không hồi sinh row đã xóa; missing/null background trả validation error thay vì throw. `native` được giữ ngay cả khi URL chỉ xuất hiện sau upload. Slot extension patch phải merge field cũ trước serialize. Các ca này có trong `tests/content-integration.spec.js`; chưa có round-trip v1 trên BE runtime của truyện test.

Codec: `src/features/content/services/storyComposition.js`. Page API adapter: `src/features/content/services/contentService.js`. Editor save: `src/features/content/pages/StoryPagesPage.jsx`.

Parent integration (14/11): `parentReaderModel.js` preserves raw JSON, hydrates this codec, joins default roles/slots from reader APIs, rejects unresolved targets and unsupported versions. `ParentReaderStage.jsx` shares `StoryPageRenderer` and playback utilities with editor, and is reused by catalog preview and reader. `subtitles:null` is now accepted by the codec and uses raw page text; `[]` hides captions. Tests: `tests/parent-audit.spec.js`. This does not prove publish round-trip or Mobile support.

The codec validates structural fields and media references. Runtime slot/quiz IDs must resolve against the fetched story. Backend page `audioFile` supports one page narration. Extra audio bytes currently remain in local browser storage and are marked local-only; no cloud publish claim is made for them. The mobile app must implement the same v1 rules before this format is considered cross-client supported.
