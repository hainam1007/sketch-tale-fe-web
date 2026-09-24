import { WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";

const tabForField = (field = "") => {
  if (field.startsWith("pages")) return "pages";
  if (field.startsWith("roles")) return "roles";
  if (field.startsWith("vocabulary")) return "vocabulary";
  if (field.startsWith("quizzes")) return "quizzes";
  return "";
};

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
        return <li key={field}><Link to={`${target}#story-editor-properties-text`}>{field}: {message}</Link></li>;
      })}</ul>}
    </div>
  </div>;
}
