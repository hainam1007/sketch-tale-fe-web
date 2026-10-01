import { WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";

const tabForField = (field = "") => {
  if (field.startsWith("pages")) return "pages";
  if (field.startsWith("roles")) return "roles";
  if (field.startsWith("vocabulary")) return "vocabulary";
  if (field.startsWith("quizzes")) return "quizzes";
  return "";
};

function hashForField(field = "") {
  const normalized = field.toLowerCase();
  if (normalized.includes("title")) return "story-editor-title";
  if (normalized.includes("description")) return "story-editor-description";
  if (normalized.includes("category")) return "story-editor-category";
  if (normalized.includes("cover")) return "story-cover";
  if (normalized.includes("background")) return "story-editor-background";
  if (normalized.includes("narration")) return "story-editor-narration";
  if (normalized.includes("text")) return "story-editor-text";
  if (normalized.includes("word")) return "story-editor-vocabulary-word";
  if (normalized.includes("meaning")) return "story-editor-vocabulary-meaning";
  if (normalized.includes("question")) return "story-editor-quiz-question";
  if (normalized.includes("feedback")) return "story-editor-quiz-feedback";
  return "main";
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
        const tab = tabForField(field);
        const target = `/content/stories/${storyId}${tab ? `/${tab}` : ""}`;
        return <li key={field}><Link to={`${target}#${hashForField(field)}`}>{field}: {message}</Link></li>;
      })}</ul>}
    </div>
  </div>;
}
