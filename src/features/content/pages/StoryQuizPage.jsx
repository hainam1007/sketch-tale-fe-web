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

  function resetForm(force = false) {
    if (!force && dirty && !window.confirm("Bạn có thay đổi câu hỏi chưa lưu. Hủy sửa sẽ bỏ chúng?")) return;
    const blank = blankQuiz(defaultPageId);
    setValues(blank);
    setBaseline(blank);
    setEditingId(null);
    setValidationError("");
    setPreviewChoice(null);
  }

  function saveQuiz() {
    const options = values.options.map((option) => option.trim());
    if (!values.pageId) return setValidationError("Chọn trang chứa câu hỏi này.");
    if (!values.question.trim()) return setValidationError("Nhập câu hỏi.");
    if (options.some((option) => !option)) return setValidationError("Mỗi lựa chọn cần có nội dung.");
    const correctIndex = values.correctIndex === null || values.correctIndex === "" ? null : Number(values.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return setValidationError("Chọn đúng một đáp án trước khi lưu.");
    const payload = { ...values, question: values.question.trim(), options, feedback: values.feedback.trim(), audioUrl: values.audioUrl.trim(), correctIndex };
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, quizId: editingId, payload }, { onSuccess: () => resetForm(true) });
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

  function deleteQuiz(quiz) {
    if (dirty && !window.confirm("Bạn có thay đổi câu hỏi chưa lưu. Xóa câu hỏi sẽ bỏ chúng?")) return;
    if (!window.confirm(`Xóa câu hỏi “${quiz.question}”?`)) return;
    mutation.mutate({ action: "delete", quizId: quiz.id }, { onSuccess: () => { if (editingId === quiz.id) resetForm(true); } });
  }

  return <EditorPanel eyebrow="CÂU HỎI" title="Câu hỏi sau khi đọc" description="Thêm câu hỏi trắc nghiệm, các lựa chọn, đáp án đúng và lời giải thích cho bé." action={<span className="story-editor-count"><Question size={17} aria-hidden="true" /> {story.quizzes.length} câu</span>}>
    <div className="editor-form-card">
      <div className="editor-form-card-heading"><div><h3>{editingId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3><p className="editor-help">Đánh dấu đáp án đúng để tránh mặc định chọn phương án đầu tiên.</p></div>{editingId && <button className="workspace-text-link" type="button" onClick={resetForm}><X size={15} aria-hidden="true" /> Hủy sửa</button>}</div>
      <div className="editor-form-grid">
        <EditorField label="Trang có câu hỏi" name="quiz-page" value={values.pageId} onChange={(value) => update("pageId", value)}><select id="story-editor-quiz-page" value={values.pageId} onChange={(event) => update("pageId", event.target.value)}><option value="">Chọn trang</option>{story.pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}: {page.title}</option>)}</select></EditorField>
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-question">Câu hỏi</label><textarea id="story-editor-quiz-question" rows="3" value={values.question} onChange={(event) => update("question", event.target.value)} placeholder="Bé vừa nhìn thấy điều gì?" /></div>
        {values.options.map((option, index) => <div className="editor-field quiz-option-field" key={index}><label htmlFor={`story-editor-quiz-option-${index}`}>Đáp án {index + 1}</label><div className="quiz-option-input"><input id={`story-editor-quiz-option-${index}`} value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder="Nhập đáp án" /><label className="quiz-correct-radio"><input type="radio" name="quiz-correct-answer" checked={values.correctIndex !== null && Number(values.correctIndex) === index} onChange={() => update("correctIndex", index)} /> Đúng</label></div></div>)}
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-feedback">Lời giải thích sau khi trả lời</label><textarea id="story-editor-quiz-feedback" rows="3" value={values.feedback} onChange={(event) => update("feedback", event.target.value)} placeholder="Một lời động viên ngắn cho bé." /></div>
        <EditorField label="Đường dẫn âm thanh (không bắt buộc)" name="quiz-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
      </div>
      {validationError && <p className="editor-field-error" role="alert">{validationError}</p>}
      <div className="quiz-form-actions"><button className="workspace-button" type="button" onClick={saveQuiz} disabled={mutation.isPending || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : editingId ? "Lưu câu hỏi" : "Thêm câu hỏi"}</button><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setPreviewChoice(null)} disabled={!values.options.some(Boolean)}>Thử câu hỏi</button></div>
      {values.options.some(Boolean) && <div className="quiz-live-preview"><div><p className="workspace-eyebrow">THỬ CÂU HỎI</p><strong>{values.question || "Câu hỏi chưa có nội dung"}</strong></div><div className="quiz-live-options">{values.options.map((option, index) => <button className={previewChoice === index ? "selected" : ""} type="button" key={index} onClick={() => setPreviewChoice(index)}>{option || `Lựa chọn ${index + 1}`}</button>)}</div>{previewChoice !== null && <p className={previewChoice === Number(values.correctIndex) && values.correctIndex !== null ? "quiz-preview-feedback quiz-preview-correct" : "quiz-preview-feedback"}>{previewChoice === Number(values.correctIndex) && values.correctIndex !== null ? "Đúng theo đáp án đang chọn." : (values.feedback || "Đây là bản thử nội bộ, chưa ghi kết quả.")}</p>}</div>}
    </div>
    <EditorMutationMessage mutation={mutation} />
      {story.quizzes.length ? <div className="editor-list" aria-label="Danh sách câu hỏi">{story.quizzes.map((quiz) => <article className="editor-item quiz-item" key={quiz.id}><div><span className="editor-item-index">{story.pages.find((page) => page.id === quiz.pageId)?.title || "Trang không còn tồn tại"}</span><h3>{quiz.question}</h3><ol>{quiz.options.map((option, index) => <li className={index === quiz.correctIndex ? "quiz-answer-correct" : ""} key={`${quiz.id}-${index}`}>{option}{index === quiz.correctIndex && <CheckCircle size={15} aria-label="Đáp án đúng" />}</li>)}</ol>{quiz.feedback && <p>{quiz.feedback}</p>}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa câu hỏi ${quiz.question}`} onClick={() => beginEdit(quiz)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa câu hỏi ${quiz.question}`} onClick={() => deleteQuiz(quiz)}><Trash size={17} aria-hidden="true" /></button></div></article>)}</div> : <div className="editor-empty"><p>Truyện chưa có câu hỏi.</p><p className="editor-help">Câu hỏi không bắt buộc, nhưng cần có một đáp án đúng hợp lệ trước khi xuất bản.</p></div>}
  </EditorPanel>;
}
