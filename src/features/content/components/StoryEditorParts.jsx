import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

export function EditorPanel({ eyebrow, title, description, action, children }) {
  return (
    <section className="story-editor-panel">
      <div className="story-editor-panel-heading">
        <div>
          <p className="workspace-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EditorMutationMessage({ mutation }) {
  if (mutation.isError) {
    return (
      <div className="editor-mutation-message editor-mutation-error" role="alert">
        <WarningCircle size={17} aria-hidden="true" />
        <div>
          <strong>{mutation.error.message}</strong>
          {mutation.error.fieldErrors && (
            <ul>
              {Object.entries(mutation.error.fieldErrors).map(([field, message]) => (
                <li key={field}>{field}: {message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
  if (mutation.isSuccess) {
    return (
      <p className="editor-mutation-message editor-mutation-success" role="status">
        <CheckCircle size={17} aria-hidden="true" /> Đã lưu thay đổi vào draft.
      </p>
    );
  }
  return null;
}

export function EditorField({ label, name, value, onChange, error, children, ...props }) {
  const id = `story-editor-${name}`;
  return (
    <div className="editor-field">
      <label htmlFor={id}>{label}</label>
      {children || <input id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} {...props} />}
      {error && <small className="editor-field-error">{error}</small>}
    </div>
  );
}
