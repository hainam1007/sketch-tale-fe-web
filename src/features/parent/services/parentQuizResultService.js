import { ApiError } from "../../../lib/api/errors";
import { moduleApiRequest, moduleApiModes } from "../../../lib/api/featureApi";

function read(value, camelName, pascalName = `${camelName[0].toUpperCase()}${camelName.slice(1)}`) {
  return value?.[camelName] ?? value?.[pascalName];
}

function invalidResponse() {
  return new ApiError({
    status: 502,
    code: "PARENT_QUIZ_RESULTS_RESPONSE_INVALID",
    message: "Backend trả về lịch sử quiz không đúng định dạng.",
  });
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function mapAnswer(answer, childProfileId) {
  const id = read(answer, "id");
  const answerChildId = read(answer, "childProfileId");
  const readingLogId = read(answer, "readingLogId");
  const questionId = read(answer, "storyQuizTemplateId");
  const selectedOptionIndex = read(answer, "selectedOptionIndex");
  const correctOptionIndex = read(answer, "correctOptionIndex");
  const responseTimeSeconds = read(answer, "responseTimeSeconds");
  const options = read(answer, "options");
  const questionText = read(answer, "questionText");
  const questionPicUrl = read(answer, "questionPicUrl");
  const isCorrect = read(answer, "isCorrect");
  if (
    typeof id !== "string" ||
    typeof answerChildId !== "string" ||
    answerChildId.toLowerCase() !== childProfileId.toLowerCase() ||
    typeof readingLogId !== "string" ||
    typeof questionId !== "string" ||
    !Number.isInteger(selectedOptionIndex) ||
    !Number.isInteger(correctOptionIndex) ||
    selectedOptionIndex < 0 ||
    correctOptionIndex < 0 ||
    !Number.isInteger(responseTimeSeconds) ||
    responseTimeSeconds < 0 ||
    typeof questionText !== "string" && questionText != null ||
    typeof questionPicUrl !== "string" && questionPicUrl != null ||
    typeof isCorrect !== "boolean" ||
    !Array.isArray(options) ||
    options.some((option) => typeof option !== "string") ||
    selectedOptionIndex >= options.length || correctOptionIndex >= options.length
  ) {
    throw invalidResponse();
  }

  return {
    id,
    readingLogId,
    questionText: questionText ?? "",
    questionPicUrl: questionPicUrl ?? "",
    options,
    selectedOptionIndex,
    correctOptionIndex,
    isCorrect,
    responseTimeSeconds,
  };
}

function mapSummary(summary, childProfileId) {
  const readingLogId = read(summary, "readingLogId");
  const responseChildId = read(summary, "childProfileId");
  const totalQuestions = read(summary, "totalQuestions");
  const totalAnswered = read(summary, "totalAnswered");
  const totalCorrectAnswers = read(summary, "totalCorrectAnswers");
  const completionPercentage = read(summary, "completionPercentage");
  const accuracyPercentage = read(summary, "accuracyPercentage");
  const stars = read(summary, "stars");
  const rawAnswers = read(summary, "answers");
  if (
    typeof readingLogId !== "string" ||
    typeof responseChildId !== "string" ||
    responseChildId.toLowerCase() !== childProfileId.toLowerCase() ||
    !Number.isInteger(totalQuestions) ||
    !Number.isInteger(totalAnswered) ||
    !Number.isInteger(totalCorrectAnswers) ||
    totalQuestions < 0 ||
    totalAnswered < 0 ||
    totalCorrectAnswers < 0 ||
    totalCorrectAnswers > totalAnswered ||
    totalAnswered > totalQuestions ||
    !finiteNumber(completionPercentage) ||
    !finiteNumber(accuracyPercentage) ||
    completionPercentage < 0 ||
    completionPercentage > 100 ||
    accuracyPercentage < 0 ||
    accuracyPercentage > 100 ||
    !Number.isInteger(stars) ||
    stars < 0 ||
    stars > 3 ||
    typeof read(summary, "isQuizCompleted") !== "boolean" ||
    !Array.isArray(rawAnswers)
  ) {
    throw invalidResponse();
  }

  const answers = rawAnswers.map((answer) => mapAnswer(answer, childProfileId));
  if (answers.some((answer) => answer.readingLogId.toLowerCase() !== readingLogId.toLowerCase()) || new Set(answers.map((answer) => answer.id.toLowerCase())).size !== answers.length) throw invalidResponse();
  return {
    readingLogId,
    totalQuestions,
    totalAnswered,
    totalCorrectAnswers,
    completionPercentage,
    accuracyPercentage,
    isQuizCompleted: read(summary, "isQuizCompleted"),
    stars,
    answers,
  };
}

export const parentQuizResultService = {
  async listForChild({ childProfileId, signal }) {
    if (moduleApiModes.parentQuizResults !== "real") {
      throw new ApiError({
        status: 503,
        code: "PARENT_QUIZ_RESULTS_API_DISABLED",
        message: "API kết quả quiz của bé chưa được bật trong cấu hình này.",
      });
    }
    if (typeof childProfileId !== "string" || !childProfileId) {
      throw new ApiError({ status: 400, code: "CHILD_PROFILE_ID_MISSING", message: "Không tìm thấy hồ sơ bé cần tải kết quả quiz." });
    }

    const response = await moduleApiRequest("parentQuizResults", {
      path: `/child-quiz-answers/child-profiles/${encodeURIComponent(childProfileId)}`,
      signal,
    });
    if (!Array.isArray(response)) throw invalidResponse();
    return response.map((summary) => mapSummary(summary, childProfileId));
  },
};
