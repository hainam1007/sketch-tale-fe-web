import { moduleApiRequest } from "../../../lib/api/featureApi";
import { ApiError } from "../../../lib/api/errors";
import { readField } from "./parentReaderModel";

function invalid(message) { throw new ApiError({ status: 502, code: "PARENT_READER_ACTIVITIES_INVALID", message }); }
function rows(value) {
  const result = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(result)) invalid("Không đọc được hoạt động của truyện.");
  return result;
}
const sameId = (a, b) => typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();

export async function getReaderVocabulary({ pageId, signal }) {
  const data = await moduleApiRequest("parentCatalog", { path: `/story-pages/${encodeURIComponent(pageId)}/vocabularies`, signal });
  return rows(data).map(row => {
    if (!sameId(readField(row, "storyPageTemplateId"), pageId) || typeof readField(row, "id") !== "string" || typeof readField(row, "word") !== "string" || typeof readField(row, "meaning") !== "string") invalid("Từ vựng không khớp với trang đang đọc.");
    return { id: readField(row, "id"), word: readField(row, "word"), meaning: readField(row, "meaning"), audioUrl: readField(row, "audioUrl") || "" };
  });
}

export async function getReaderQuizzes({ story, signal }) {
  const data = await moduleApiRequest("parentCatalog", { path: `/story-template/${encodeURIComponent(story.id)}/quizzes`, signal });
  const owners = new Map();
  for (const page of story.pages) for (const [id, extension] of Object.entries(page.quizExtensions || {})) {
    if (owners.has(id)) invalid("Một câu hỏi đang được gắn với nhiều trang.");
    owners.set(id, { pageId: page.id, feedback: extension.feedback || "" });
  }
  return rows(data).filter(row => readField(row, "status") === 2 || String(readField(row, "status")).toLowerCase() === "active").map(row => {
    const id = readField(row, "id");
    if (!sameId(readField(row, "storyTemplateId"), story.id) || typeof id !== "string") invalid("Câu hỏi không thuộc truyện đang đọc.");
    let options = readField(row, "options");
    if (!Array.isArray(options) || !options.length) {
      try { options = JSON.parse(readField(row, "optionsJson")); } catch { invalid("Không đọc được lựa chọn trả lời."); }
    }
    const correctIndex = readField(row, "correctOptionIndex");
    if (!Array.isArray(options) || options.length < 2 || options.some(option => typeof option !== "string" || !option.trim()) || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length || typeof readField(row, "questionText") !== "string") invalid("Câu hỏi có nội dung hoặc đáp án không hợp lệ.");
    return { id, question: readField(row, "questionText"), imageUrl: readField(row, "questionPicUrl") || "", audioUrl: readField(row, "questionAudioUrl") || "", options, correctIndex, ...owners.get(id) };
  });
}
