import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, FloppyDisk, PencilSimple, Question, Trash, X } from "@phosphor-icons/react";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { validateAssetFile } from "../services/assetService";
import { featureApiModes } from "../../../lib/api/featureApi";

const emptyQuiz = (pageId = "") => ({ pageId, question: "", options: ["", "", ""], correctIndex: null, feedback: "", audioUrl: "", questionPicUrl: "" });

export default function StoryQuizPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const confirmToast = useConfirmToast();
  const isRealApi = featureApiModes.content === "real";
  const defaultPageId = story.pages[0]?.id || "";
  const [values, setValues] = useState(() => emptyQuiz(defaultPageId));
  const [baseline, setBaseline] = useState(() => emptyQuiz(defaultPageId));
  const [mediaFiles, setMediaFiles] = useState({ questionFile: null, audioFile: null });
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [previewChoice, setPreviewChoice] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const mutation = useStoryEditorMutation(({ action, quizId, payload, revision }) => {
    if (action === "add") return contentService.addQuiz({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateQuiz({ storyId, quizId, revision, ...payload });
    if (action === "delete") return contentService.deleteQuiz({ storyId, quizId, revision });
    throw new Error("Thao tác câu hỏi không được hỗ trợ.");
  });
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const mutationOutcomeBlocked = Boolean(mutation.error?.mutationAccepted || mutation.error?.mutationOutcomeUnknown);
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

  async function resetForm(force = false) {
    if (!force && dirty && !await confirmToast({ title: "Hủy sửa câu hỏi?", message: "Các thay đổi chưa lưu trong câu hỏi sẽ bị bỏ.", confirmLabel: "Hủy sửa", tone: "danger" })) return;
    const blank = emptyQuiz(defaultPageId);
    setValues(blank);
    setBaseline(blank);
    setMediaFiles({ questionFile: null, audioFile: null });
    setEditingId(null);
    setValidationError("");
    setPreviewChoice(null);
  }

  function saveQuiz() {
    const options = values.options.map((option) => option.trim());
    if (!values.pageId) return setValidationError("Chọn trang chứa câu hỏi này.");
    if (!values.question.trim()) return setValidationError("Nhập câu hỏi.");
    if (options.length < 2) return setValidationError("Cần ít nhất hai lựa chọn.");
    if (options.some((option) => !option)) return setValidationError("Mỗi lựa chọn cần có nội dung.");
    const correctIndex = values.correctIndex === null || values.correctIndex === "" ? null : Number(values.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return setValidationError("Chọn đúng một đáp án trước khi lưu.");
    for (const [file, kind] of [[mediaFiles.questionFile, "image"], [mediaFiles.audioFile, "audio"]]) {
      if (!file) continue;
      const errors = validateAssetFile(file, kind);
      if (Object.keys(errors).length) return setValidationError(Object.values(errors)[0]);
    }
    const payload = {
      ...values,
      question: values.question.trim(),
      options,
      feedback: values.feedback.trim(),
      audioUrl: values.audioUrl.trim(),
      correctIndex,
      ...mediaFiles,
    };
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, quizId: editingId, payload }, { onSuccess: () => resetForm(true) });
  }

  async function beginEdit(quiz) {
    if (editingId === quiz.id) return;
    if (dirty && editingId !== quiz.id && !await confirmToast({ title: "Mở câu hỏi khác?", message: "Các thay đổi chưa lưu trong biểu mẫu hiện tại sẽ bị bỏ.", confirmLabel: "Mở câu hỏi", tone: "danger" })) return;
    const next = {
      pageId: quiz.pageId || defaultPageId,
      question: quiz.question || "",
      options: Array.isArray(quiz.options) ? [...quiz.options] : [],
      correctIndex: Number.isInteger(quiz.correctIndex) ? quiz.correctIndex : null,
      feedback: quiz.feedback || "",
      audioUrl: quiz.audioUrl || "",
      questionPicUrl: quiz.questionPicUrl || "",
      ...(quiz.status === undefined ? {} : { status: quiz.status }),
    };
    setEditingId(quiz.id);
    setMediaFiles({ questionFile: null, audioFile: null });
    setValues(next);
    setBaseline(next);
    setValidationError("");
    setPreviewChoice(null);
  }

  async function deleteQuiz(quiz) {
    const message = dirty && editingId === quiz.id
      ? `Xóa câu hỏi “${quiz.question || "chưa có nội dung"}” khỏi truyện? Thay đổi chưa lưu trong form cũng sẽ bị bỏ.`
      : `Xóa câu hỏi “${quiz.question || "chưa có nội dung"}” khỏi truyện?`;
    if (!await confirmToast({ title: "Xóa câu hỏi?", message, confirmLabel: "Xóa câu hỏi", tone: "danger" })) return;
    mutation.mutate({ action: "delete", quizId: quiz.id }, { onSuccess: () => { if (editingId === quiz.id) resetForm(true); } });
  }

  return <EditorPanel eyebrow="CÂU HỎI" title="Câu hỏi sau khi đọc" description="Thêm câu hỏi trắc nghiệm và đánh dấu một đáp án đúng để bé ôn lại nội dung truyện." action={<span className="story-editor-count"><Question size={17} aria-hidden="true" /> {story.quizzes.length} câu</span>}>
    {!story.pages.length ? <div className="editor-empty"><h3>Tạo trang trước khi thêm câu hỏi</h3><p className="editor-help">Mỗi câu hỏi cần được gắn với một trang trong truyện.</p><Link className="workspace-button" to={`/content/stories/${storyId}/pages`}>Tạo trang đầu tiên</Link></div> : <div className="editor-form-card">
      <div className="editor-form-card-heading"><div><h3>{editingId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3><p className="editor-help">Đánh dấu đáp án đúng; hệ thống không tự chọn đáp án mặc định.</p></div>{editingId && <button className="workspace-text-link" type="button" onClick={() => { void resetForm(); }}><X size={15} aria-hidden="true" /> Hủy sửa</button>}</div>
      <div className="editor-form-grid">
        <EditorField label="Trang có câu hỏi" name="quiz-page" value={values.pageId} onChange={(value) => update("pageId", value)}><select id="story-editor-quiz-page" value={values.pageId} onChange={(event) => update("pageId", event.target.value)}><option value="">Chọn trang</option>{story.pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}: {page.title}</option>)}</select></EditorField>
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-question">Câu hỏi</label><textarea id="story-editor-quiz-question" rows="3" value={values.question} onChange={(event) => update("question", event.target.value)} placeholder="Bé vừa nhìn thấy điều gì?" /></div>
        {values.options.map((option, index) => <div className="editor-field quiz-option-field" key={index}><label htmlFor={`story-editor-quiz-option-${index}`}>Đáp án {index + 1}</label><div className="quiz-option-input"><input id={`story-editor-quiz-option-${index}`} value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder="Nhập đáp án" /><label className="quiz-correct-radio"><input type="radio" name="quiz-correct-answer" checked={values.correctIndex !== null && Number(values.correctIndex) === index} onChange={() => update("correctIndex", index)} /> Đúng</label></div></div>)}
        <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-feedback">Lời giải thích sau khi trả lời</label><textarea id="story-editor-quiz-feedback" rows="3" value={values.feedback} onChange={(event) => update("feedback", event.target.value)} placeholder="Một lời động viên ngắn cho bé." /></div>
        {isRealApi ? <>
          <label className="editor-field"><span>Ảnh minh họa (không bắt buộc)</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0] || null; setMediaFiles((current) => ({ ...current, questionFile: file })); update("questionImageFileName", file?.name || ""); }} />{values.questionPicUrl && !mediaFiles.questionFile && <small>Đang dùng ảnh đã lưu. Chọn tệp mới sẽ thay ảnh này.</small>}{mediaFiles.questionFile && <small>Tệp mới: {mediaFiles.questionFile.name}</small>}</label>
          <label className="editor-field"><span>Âm thanh câu hỏi (không bắt buộc)</span><input type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0] || null; setMediaFiles((current) => ({ ...current, audioFile: file })); update("audioFileName", file?.name || ""); }} />{values.audioUrl && !mediaFiles.audioFile && <small>Đang dùng âm thanh đã lưu. Chọn tệp mới sẽ thay âm thanh này.</small>}{mediaFiles.audioFile && <small>Tệp mới: {mediaFiles.audioFile.name}</small>}</label>
        </> : <EditorField label="Đường dẫn âm thanh (không bắt buộc)" name="quiz-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />}
      </div>
      {validationError && <p className="editor-field-error" role="alert">{validationError}</p>}
      <div className="quiz-form-actions"><button className="workspace-button" type="button" onClick={saveQuiz} disabled={mutation.isPending || mutationOutcomeBlocked || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : editingId ? "Lưu câu hỏi" : "Thêm câu hỏi"}</button><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setPreviewOpen((open) => !open); setPreviewChoice(null); }} aria-expanded={previewOpen} aria-controls="quiz-live-preview" disabled={!values.options.some(Boolean)}>{previewOpen ? "Đóng bản thử" : "Thử câu hỏi"}</button></div>
      {previewOpen && values.options.some(Boolean) && <div id="quiz-live-preview" className="quiz-live-preview"><div><p className="workspace-eyebrow">THỬ CÂU HỎI</p><strong>{values.question || "Câu hỏi chưa có nội dung"}</strong></div><div className="quiz-live-options">{values.options.map((option, index) => <button className={previewChoice === index ? "selected" : ""} type="button" key={index} onClick={() => setPreviewChoice(index)}>{option || `Lựa chọn ${index + 1}`}</button>)}</div>{previewChoice !== null && <p className={previewChoice === Number(values.correctIndex) && values.correctIndex !== null ? "quiz-preview-feedback quiz-preview-correct" : "quiz-preview-feedback"}>{previewChoice === Number(values.correctIndex) && values.correctIndex !== null ? "Đúng theo đáp án đang chọn." : (values.feedback || "Đây là bản thử nội bộ, chưa ghi kết quả.")}</p>}</div>}
    </div>}
    <EditorMutationMessage mutation={mutation} showSuccess={false} />
    {story.quizzes.length ? <div className="editor-list" aria-label="Danh sách câu hỏi">{story.quizzes.map((quiz) => {
      const answerIsValid = Number.isInteger(quiz.correctIndex) && quiz.correctIndex >= 0 && quiz.correctIndex < quiz.options.length;
      const page = story.pages.find((candidate) => candidate.id === quiz.pageId);
      return <article className="editor-item quiz-item" key={quiz.id}><div><span className="editor-item-index">{page ? `Trang ${page.order}: ${page.title}` : "Trang chưa được gắn"}</span><h3>{quiz.question || "Câu hỏi chưa có nội dung"}</h3><ol>{quiz.options.map((option, index) => <li className={index === quiz.correctIndex ? "quiz-answer-correct" : ""} key={`${quiz.id}-${index}`}>{option}{index === quiz.correctIndex && <CheckCircle size={15} aria-label="Đáp án đúng" />}</li>)}</ol>{!answerIsValid && <p className="editor-field-error">Cần chọn một đáp án đúng trước khi lưu hoặc xuất bản.</p>}{quiz.feedback && <p>{quiz.feedback}</p>}{quiz.audioUrl && <audio controls preload="none" src={quiz.audioUrl} aria-label={`Nghe câu hỏi ${quiz.question || "trắc nghiệm"}`} />}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa câu hỏi ${quiz.question || "chưa có nội dung"}`} onClick={() => beginEdit(quiz)} disabled={mutation.isPending || mutationOutcomeBlocked}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label={`Xóa câu hỏi ${quiz.question || "chưa có nội dung"}`} onClick={() => deleteQuiz(quiz)} disabled={mutation.isPending || mutationOutcomeBlocked}><Trash size={17} aria-hidden="true" /></button></div></article>;
    })}</div> : story.pages.length ? <div className="editor-empty"><p>Truyện chưa có câu hỏi.</p><p className="editor-help">Câu hỏi không bắt buộc, nhưng cần có một đáp án đúng hợp lệ trước khi xuất bản.</p></div> : null}
  </EditorPanel>;
}
