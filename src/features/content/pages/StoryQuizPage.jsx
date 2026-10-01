import { useState } from "react";
import { CheckCircle, FloppyDisk, PencilSimple, Question, Trash, X } from "@phosphor-icons/react";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";

const blankQuiz = (pageId = "") => ({ pageId, question: "", options: ["", "", ""], correctIndex: null, feedback: "", audioUrl: "" });

export default function StoryQuizPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const defaultPageId = story.pages[0]?.id || "";
  const [values, setValues] = useState(blankQuiz(defaultPageId));
  const [baseline, setBaseline] = useState(blankQuiz(defaultPageId));
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [previewChoice, setPreviewChoice] = useState(null);
  const mutation = useStoryEditorMutation(({ action, quizId, payload, revision }) => {
    if (action === "add") return contentService.addQuiz({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateQuiz({ storyId, quizId, revision, ...payload });
    return contentService.deleteQuiz({ storyId, quizId, revision });
  });
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function update(name, value) {
    setValidationError("");
    setPreviewChoice(null);
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateOption(index, value) {
    setValidationError("");
    setPreviewChoice(null);
    setValues((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
  }

  function resetForm() {
    const blank = blankQuiz(defaultPageId);
    setValues(blank);
    setBaseline(blank);
    setEditingId(null);
    setValidationError("");
    setPreviewChoice(null);
  }

  function saveQuiz() {
    const options = values.options.map((option) => option.trim());
    if (!values.pageId) return setValidationError("Chọn page chứa câu hỏi này.");
    if (!values.question.trim()) return setValidationError("Nhập câu hỏi.");
    if (options.some((option) => !option)) return setValidationError("Mỗi lựa chọn cần có nội dung.");
    if (!Number.isInteger(Number(values.correctIndex)) || Number(values.correctIndex) < 0 || Number(values.correctIndex) >= options.length) return setValidationError("Chọn đúng một đáp án trước khi lưu.");
    const payload = { ...values, question: values.question.trim(), options, feedback: values.feedback.trim(), audioUrl: values.audioUrl.trim(), correctIndex: Number(values.correctIndex) };
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, quizId: editingId, payload }, { onSuccess: resetForm });
  }

  function beginEdit(quiz) {
    if (dirty && editingId !== quiz.id && !window.confirm("Bạn có thay đổi chưa lưu. Mở câu hỏi khác sẽ bỏ chúng?")) return;
    const next = { pageId: quiz.pageId || "", question: quiz.question || "", options: [...quiz.options], correctIndex: Number.isInteger(quiz.correctIndex) ? quiz.correctIndex : null, feedback: quiz.feedback || "", audioUrl: quiz.audioUrl || "" };
    setEditingId(quiz.id);
    setValues(next);
    setBaseline(next);
    setValidationError("");
    setPreviewChoice(null);
  }

  return <EditorPanel eyebrow="QUIZ" title="Câu hỏi sau khi đọc" description="Quiz dùng chung schema với mobile: câu hỏi, danh sách options, đáp án đúng và feedback." action={<span className="story-editor-count"><Question size={17} aria-hidden="true" /> {story.quizzes.length} câu</span>}>
    <div className="editor-form-card">
      <div className="editor-form-card-heading"><div><h3>{editingId ? "Sửa quiz" : "Thêm quiz"}</h3><p className="editor-help">Chọn đáp án đúng bằng radio, không mặc định âm thầm đáp án đầu tiên.</p></div>{editingId && <button className="workspace-text-link" type="button" onClick={resetForm}><X size={15} aria-hidden="true" /> Hủy sửa</button>}</div>
      <div className="editor-form-grid">
        <EditorField label="Page chứa quiz" name="quiz-page" value={values.pageId} onChange={(value) => update("pageId", value)}><select id="story-editor-quiz-page" value={values.pageId} onChange={(event) => update("pageId", event.target.value)}><option value="">Chọn page</option>{story.pages.map((page) => <option key={page.id} value={page.id}>Page {page.order}: {page.title}</option>)}</select></EditorField>
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-question">Câu hỏi</label><textarea id="story-editor-quiz-question" rows="3" value={values.question} onChange={(event) => update("question", event.target.value)} placeholder="Bé vừa nhìn thấy điều gì?" /></div>
        {values.options.map((option, index) => <div className="editor-field quiz-option-field" key={index}><label htmlFor={`story-editor-quiz-option-${index}`}>Lựa chọn {index + 1}</label><div className="quiz-option-input"><input id={`story-editor-quiz-option-${index}`} value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder="Nhập đáp án" /><label className="quiz-correct-radio"><input type="radio" name="quiz-correct-answer" checked={Number(values.correctIndex) === index} onChange={() => update("correctIndex", index)} /> Đúng</label></div></div>)}
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-feedback">Feedback sau khi trả lời</label><textarea id="story-editor-quiz-feedback" rows="3" value={values.feedback} onChange={(event) => update("feedback", event.target.value)} placeholder="Một lời động viên ngắn cho bé." /></div>
        <EditorField label="Audio URL (tuỳ chọn)" name="quiz-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
      </div>
      {validationError && <p className="editor-field-error" role="alert">{validationError}</p>}
      <div className="quiz-form-actions"><button className="workspace-button" type="button" onClick={saveQuiz} disabled={mutation.isPending || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : editingId ? "Lưu quiz" : "Thêm quiz"}</button><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setPreviewChoice(null)} disabled={!values.options.some(Boolean)}>Thử câu hỏi</button></div>
      {values.options.some(Boolean) && <div className="quiz-live-preview"><div><p className="workspace-eyebrow">THỬ CÂU HỎI</p><strong>{values.question || "Câu hỏi chưa có nội dung"}</strong></div><div className="quiz-live-options">{values.options.map((option, index) => <button className={previewChoice === index ? "selected" : ""} type="button" key={index} onClick={() => setPreviewChoice(index)}>{option || `Lựa chọn ${index + 1}`}</button>)}</div>{previewChoice !== null && <p className={previewChoice === Number(values.correctIndex) ? "quiz-preview-feedback quiz-preview-correct" : "quiz-preview-feedback"}>{previewChoice === Number(values.correctIndex) ? "Đúng theo đáp án đang chọn." : (values.feedback || "Đây là bản thử nội bộ, chưa ghi kết quả.")}</p>}</div>}
    </div>
    <EditorMutationMessage mutation={mutation} />
    {story.quizzes.length ? <div className="editor-list" aria-label="Danh sách quiz">{story.quizzes.map((quiz) => <article className="editor-item quiz-item" key={quiz.id}><div><span className="editor-item-index">{story.pages.find((page) => page.id === quiz.pageId)?.title || "Page không còn tồn tại"}</span><h3>{quiz.question}</h3><ol>{quiz.options.map((option, index) => <li className={index === quiz.correctIndex ? "quiz-answer-correct" : ""} key={`${quiz.id}-${index}`}>{option}{index === quiz.correctIndex && <CheckCircle size={15} aria-label="Đáp án đúng" />}</li>)}</ol>{quiz.feedback && <p>{quiz.feedback}</p>}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label="Sửa quiz" onClick={() => beginEdit(quiz)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label="Xoá quiz" onClick={() => mutation.mutate({ action: "delete", quizId: quiz.id })}><Trash size={17} aria-hidden="true" /></button></div></article>)}</div> : <div className="editor-empty"><p>Chưa có quiz trong story.</p><p className="editor-help">Quiz là optional, nhưng nếu có thì luôn phải có một correct answer hợp lệ trước khi publish.</p></div>}
  </EditorPanel>;
}
