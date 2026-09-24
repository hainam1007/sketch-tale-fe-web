import { useState } from "react";
import { CheckCircle, FloppyDisk, PencilSimple, Question, Trash, X } from "@phosphor-icons/react";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";

function emptyQuiz(pageId = "") {
  return { pageId, question: "", options: ["", "", ""], correctIndex: 0, feedback: "", audioUrl: "" };
}

export default function StoryQuizPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const [values, setValues] = useState(emptyQuiz(story.pages[0]?.id || ""));
  const [editingId, setEditingId] = useState(null);
  const mutation = useStoryEditorMutation(({ action, quizId, payload, revision }) => {
    if (action === "add") return contentService.addQuiz({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateQuiz({ storyId, quizId, revision, ...payload });
    return contentService.deleteQuiz({ storyId, quizId, revision });
  });
  const defaultPageId = story.pages[0]?.id || "";
  const dirty = values.question !== "" || values.feedback !== "" || values.options.some(Boolean) || values.pageId !== defaultPageId;
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateOption(index, value) {
    setValues((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
  }

  function saveQuiz() {
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, quizId: editingId, payload: { ...values, correctIndex: Number(values.correctIndex) } }, { onSuccess: () => { setValues(emptyQuiz(story.pages[0]?.id || "")); setEditingId(null); } });
  }

  function beginEdit(quiz) {
    setEditingId(quiz.id);
    setValues({ pageId: quiz.pageId, question: quiz.question, options: [...quiz.options], correctIndex: quiz.correctIndex, feedback: quiz.feedback || "", audioUrl: quiz.audioUrl || "" });
  }

  return (
    <EditorPanel eyebrow="QUIZ" title="Câu hỏi sau khi đọc" description="Quiz dùng chung schema với mobile: câu hỏi, danh sách options, đáp án đúng và feedback. Không dùng index của page làm ID tham chiếu." action={<span className="story-editor-count"><Question size={17} aria-hidden="true" /> {story.quizzes.length} câu</span>}>
      <div className="editor-form-card">
        <h3>{editingId ? "Sửa quiz" : "Thêm quiz"}</h3>
        <div className="editor-form-grid">
          <EditorField label="Page chứa quiz" name="quiz-page" value={values.pageId} onChange={(value) => update("pageId", value)}>
            <select id="story-editor-quiz-page" value={values.pageId} onChange={(event) => update("pageId", event.target.value)}>
              <option value="">Chọn page</option>
              {story.pages.map((page) => <option key={page.id} value={page.id}>Page {page.order}: {page.title}</option>)}
            </select>
          </EditorField>
          <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-question">Câu hỏi</label><textarea id="story-editor-quiz-question" rows="3" value={values.question} onChange={(event) => update("question", event.target.value)} placeholder="Bé vừa nhìn thấy điều gì?" /></div>
          {values.options.map((option, index) => <EditorField key={index} label={`Đáp án ${index + 1}`} name={`quiz-option-${index + 1}`} value={option} onChange={(value) => updateOption(index, value)} placeholder="Nhập đáp án" />)}
          <EditorField label="Đáp án đúng" name="quiz-correct" value={values.correctIndex} onChange={(value) => update("correctIndex", value)}>
            <select id="story-editor-quiz-correct" value={values.correctIndex} onChange={(event) => update("correctIndex", event.target.value)}>{values.options.map((_, index) => <option key={index} value={index}>Đáp án {index + 1}</option>)}</select>
          </EditorField>
          <div className="editor-field editor-field-wide"><label htmlFor="story-editor-quiz-feedback">Feedback sau khi trả lời</label><textarea id="story-editor-quiz-feedback" rows="3" value={values.feedback} onChange={(event) => update("feedback", event.target.value)} placeholder="Một lời động viên ngắn cho bé." /></div>
          <EditorField label="Audio URL (tuỳ chọn)" name="quiz-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
        </div>
        <button className="workspace-button" type="button" onClick={saveQuiz} disabled={mutation.isPending || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {editingId ? "Lưu quiz" : "Thêm quiz"}</button>
        {editingId && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setEditingId(null); setValues(emptyQuiz(story.pages[0]?.id || "")); }}><X size={16} aria-hidden="true" /> Huỷ sửa</button>}
      </div>
      <EditorMutationMessage mutation={mutation} />
      {story.quizzes.length ? <div className="editor-list" aria-label="Danh sách quiz">{story.quizzes.map((quiz) => <article className="editor-item quiz-item" key={quiz.id}><div><span className="editor-item-index">{story.pages.find((page) => page.id === quiz.pageId)?.title || "Page không còn tồn tại"}</span><h3>{quiz.question}</h3><ol>{quiz.options.map((option, index) => <li className={index === quiz.correctIndex ? "quiz-answer-correct" : ""} key={`${quiz.id}-${index}`}>{option}{index === quiz.correctIndex && <CheckCircle size={15} aria-label="Đáp án đúng" />}</li>)}</ol>{quiz.feedback && <p>{quiz.feedback}</p>}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label="Sửa quiz" onClick={() => beginEdit(quiz)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label="Xoá quiz" onClick={() => mutation.mutate({ action: "delete", quizId: quiz.id })}><Trash size={17} aria-hidden="true" /></button></div></article>)}</div> : <div className="editor-empty"><p>Chưa có quiz trong story.</p><p className="editor-help">Quiz là optional, nhưng nếu có thì luôn phải có một correctIndex hợp lệ trước khi publish.</p></div>}
    </EditorPanel>
  );
}
