import { WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";

function issueTarget(field = "") {
  const normalized = field.toLowerCase();
  const match = normalized.match(/^(pages|roles|vocabulary|quizzes)(?:\.(\d+))?(?:\.(.*))?$/);
  if (!match) {
    if (normalized.includes("title")) return { tab: "", hash: "story-title", label: "Tên truyện" };
    if (normalized.includes("description")) return { tab: "", hash: "story-description", label: "Mô tả truyện" };
    if (normalized.includes("category")) return { tab: "", hash: "story-category", label: "Chủ đề" };
    if (normalized.includes("cover")) return { tab: "", hash: "story-cover", label: "Ảnh bìa" };
    return { tab: "", hash: "main", label: field };
  }

  const [, tab, index, property = ""] = match;
  const indexLabel = index === undefined ? "" : ` ${Number(index) + 1}`;
  if (tab === "pages") {
    const hash = property.includes("text") ? "story-editor-properties-text" : property.includes("background") ? "story-editor-properties-background" : property.includes("narration") ? "story-editor-properties-narration" : "main";
    return { tab, hash, label: `Trang${indexLabel}${property ? `, ${property}` : ""}` };
  }
  if (tab === "roles") return { tab, hash: "main", label: `Vai${indexLabel}` };
  if (tab === "vocabulary") {
    const hash = property.includes("word") ? "story-editor-vocabulary-word" : property.includes("meaning") ? "story-editor-vocabulary-meaning" : "story-editor-vocabulary-page";
    return { tab, hash, label: `Từ vựng${indexLabel}` };
  }
  const hash = property.includes("question") ? "story-editor-quiz-question" : property.includes("feedback") ? "story-editor-quiz-feedback" : property.includes("options") ? "story-editor-quiz-option-0" : "story-editor-quiz-page";
  return { tab, hash, label: `Câu hỏi${indexLabel}` };
}

export default function PublishIssues({ error }) {
  const { storyId } = useParams();
  if (!error) return null;
  const fieldErrors = Object.entries(error.fieldErrors || {});
  return <div className="story-action-message story-action-error" role="alert">
    <WarningCircle size={17} aria-hidden="true" />
    <div>
      <strong>{error.message}</strong>
      {fieldErrors.length > 0 && <ul className="publish-issues-list">{fieldErrors.map(([field, message]) => {
        const issue = issueTarget(field);
        const target = `/content/stories/${storyId}${issue.tab ? `/${issue.tab}` : ""}`;
        return <li key={field}><Link to={`${target}#${issue.hash}`}>{issue.label}: {message}</Link></li>;
      })}</ul>}
    </div>
  </div>;
}
