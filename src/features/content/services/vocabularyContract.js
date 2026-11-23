import { ApiError } from "../../../lib/api/errors";

function hasField(row, key) {
  const pascalKey = key[0].toUpperCase() + key.slice(1);
  return Object.hasOwn(row, key) || Object.hasOwn(row, pascalKey);
}

function readField(row, key) {
  const pascalKey = key[0].toUpperCase() + key.slice(1);
  if (Object.hasOwn(row, key)) return row[key];
  if (Object.hasOwn(row, pascalKey)) return row[pascalKey];
  return undefined;
}

function invalidVocabularyResponse(message = "Từ vựng trả về không đúng hợp đồng API. Hãy tải lại truyện.") {
  throw new ApiError({ status: 502, code: "VOCABULARY_RESPONSE_INVALID", message });
}

/**
 * Map an API DTO to the vocabulary model used by the editor and reader.
 * `word` is accepted only when the newer `wordVi` property is absent.
 */
export function mapVocabularyDto(row, requestedPageId) {
  if (!row || typeof row !== "object" || Array.isArray(row)) invalidVocabularyResponse();

  const id = readField(row, "id");
  const storyPageTemplateId = readField(row, "storyPageTemplateId");
  const wordKey = hasField(row, "wordVi") ? "wordVi" : "word";
  const rawWord = readField(row, wordKey);
  const meaning = readField(row, "meaning");
  const audioUrl = readField(row, "audioUrl");
  const samePage = typeof storyPageTemplateId === "string"
    && typeof requestedPageId === "string"
    && storyPageTemplateId.toLowerCase() === requestedPageId.toLowerCase();

  if (typeof id !== "string" || !id || !samePage || !hasField(row, wordKey)
    || (rawWord != null && typeof rawWord !== "string")
    || (meaning != null && typeof meaning !== "string")
    || (audioUrl != null && typeof audioUrl !== "string")) {
    invalidVocabularyResponse("Không thể xác nhận từ, nghĩa, âm thanh hoặc trang gắn với từ vựng. Hãy tải lại truyện.");
  }

  return { ...row, id, pageId: storyPageTemplateId, word: rawWord ?? "", meaning: meaning ?? "", audioUrl: audioUrl ?? "" };
}

/** Mirrors the API's NFC + trim + case-insensitive substring check. */
export function vocabularyAppearsInRawText(word, rawText) {
  if (typeof word !== "string" || typeof rawText !== "string") return false;
  const normalizedWord = word.normalize("NFC").trim().toLowerCase();
  const normalizedText = rawText.normalize("NFC").trim().toLowerCase();
  return Boolean(normalizedWord && normalizedText.includes(normalizedWord));
}

/** Mirrors the API's case-insensitive check used to decide whether a word changed. */
export function vocabularyWordsEqualIgnoreCase(left, right) {
  return typeof left === "string" && typeof right === "string"
    && left.trim().toLowerCase() === right.trim().toLowerCase();
}
