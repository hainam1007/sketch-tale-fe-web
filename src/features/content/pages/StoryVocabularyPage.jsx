import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenText, FloppyDisk, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { featureApiModes } from "../../../lib/api/featureApi";

const emptyVocabulary = (pageId = "") => ({ pageId, word: "", meaning: "", audioUrl: "" });

export default function StoryVocabularyPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const confirmToast = useConfirmToast();
  const isRealApi = featureApiModes.content === "real";
  const defaultPageId = story.pages[0]?.id || "";
  const [values, setValues] = useState(() => emptyVocabulary(defaultPageId));
  const [baseline, setBaseline] = useState(() => emptyVocabulary(defaultPageId));
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState("");
  const mutation = useStoryEditorMutation(({ action, vocabularyId, payload, revision }) => {
    if (action === "add") return contentService.addVocabulary({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateVocabulary({ storyId, vocabularyId, revision, ...payload });
    if (action === "delete") return contentService.deleteVocabulary({ storyId, vocabularyId, revision });
    throw new Error("Thao tác từ vựng không được hỗ trợ.");
  });
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const mutationOutcomeBlocked = Boolean(mutation.error?.mutationAccepted || mutation.error?.mutationOutcomeUnknown);
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function update(name, value) {
    setValidationError("");
    setValues((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    const blank = emptyVocabulary(defaultPageId);
    setValues(blank);
    setBaseline(blank);
    setEditingId(null);
    setValidationError("");
  }

  function saveVocabulary() {
    const payload = { ...values, word: values.word.trim(), meaning: values.meaning.trim(), audioUrl: values.audioUrl.trim() };
    if (!payload.pageId) return setValidationError("Chọn trang có từ này.");
    if (!payload.word) return setValidationError("Nhập từ hoặc cụm từ.");
    if (!payload.meaning) return setValidationError("Nhập nghĩa dễ hiểu cho bé.");
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, vocabularyId: editingId, payload }, { onSuccess: resetForm });
  }

  async function beginEdit(item) {
    if (editingId === item.id) return;
    if (dirty && editingId !== item.id && !await confirmToast({ title: "Mở từ vựng khác?", message: "Các thay đổi chưa lưu trong biểu mẫu hiện tại sẽ bị bỏ.", confirmLabel: "Mở từ vựng", tone: "danger" })) return;
    const next = { pageId: item.pageId || "", word: item.word || "", meaning: item.meaning || "", audioUrl: item.audioUrl || "" };
    setEditingId(item.id);
    setValues(next);
    setBaseline(next);
    setValidationError("");
  }

  async function deleteVocabulary(item) {
    const message = dirty && editingId === item.id
      ? `Xóa từ “${item.word}” khỏi truyện? Thay đổi chưa lưu trong form cũng sẽ bị bỏ.`
      : `Xóa từ “${item.word}” khỏi truyện?`;
    if (!await confirmToast({ title: "Xóa từ vựng?", message, confirmLabel: "Xóa từ", tone: "danger" })) return;
    mutation.mutate({ action: "delete", vocabularyId: item.id }, { onSuccess: () => { if (editingId === item.id) resetForm(); } });
  }

  return <EditorPanel eyebrow="TỪ VỰNG" title="Từ vựng theo ngữ cảnh" description="Gắn mỗi từ với một trang để hiển thị đúng lúc đọc; có thể bổ sung âm thanh phát âm sau." action={<span className="story-editor-count"><BookOpenText size={17} aria-hidden="true" /> {story.vocabulary.length} từ</span>}>
    {!story.pages.length ? <div className="editor-empty"><h3>Tạo trang trước khi thêm từ vựng</h3><p className="editor-help">Mỗi từ vựng cần được gắn với một trang trong truyện.</p><Link className="workspace-button" to={`/content/stories/${storyId}/pages`}>Tạo trang đầu tiên</Link></div> : <div className="editor-form-card">
      <div className="editor-form-card-heading"><div><h3>{editingId ? "Sửa từ vựng" : "Thêm từ vựng"}</h3><p className="editor-help">Từ và nghĩa nên xuất hiện đúng trong câu chuyện.</p></div>{editingId && <button className="workspace-text-link" type="button" onClick={async () => { if (!dirty || await confirmToast({ title: "Hủy sửa từ vựng?", message: "Các thay đổi chưa lưu trong từ vựng sẽ bị bỏ.", confirmLabel: "Hủy sửa", tone: "danger" })) resetForm(); }}><X size={15} aria-hidden="true" /> Hủy sửa</button>}</div>
      <div className="editor-form-grid">
        <EditorField label="Trang có từ này" name="vocabulary-page" value={values.pageId} onChange={(value) => update("pageId", value)}><select id="story-editor-vocabulary-page" value={values.pageId} disabled={isRealApi && Boolean(editingId)} onChange={(event) => update("pageId", event.target.value)}><option value="">Chọn trang</option>{story.pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}: {page.title}</option>)}</select></EditorField>
        {isRealApi && editingId && <p className="editor-help editor-field-wide">Để chuyển từ sang trang khác, hãy xóa từ này rồi thêm lại ở trang mới.</p>}
        <EditorField label="Từ / cụm từ" name="vocabulary-word" value={values.word} onChange={(value) => update("word", value)} placeholder="Ví dụ: nảy mầm" />
        <EditorField label="Nghĩa" name="vocabulary-meaning" value={values.meaning} onChange={(value) => update("meaning", value)} placeholder="Giải thích ngắn, dễ hiểu" />
        <EditorField label="Đường dẫn âm thanh (không bắt buộc)" name="vocabulary-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
      </div>
      {validationError && <p className="editor-field-error" role="alert">{validationError}</p>}
      <button className="workspace-button" type="button" onClick={saveVocabulary} disabled={mutation.isPending || mutationOutcomeBlocked || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : editingId ? "Lưu từ" : "Thêm từ"}</button>
    </div>}
    <EditorMutationMessage mutation={mutation} showSuccess={false} />
    {story.vocabulary.length ? <div className="editor-list" aria-label="Danh sách từ vựng">{story.vocabulary.map((item) => {
      const page = story.pages.find((candidate) => candidate.id === item.pageId);
      return <article className="editor-item vocabulary-item" key={item.id}><div><span className="editor-item-index">{page ? `Trang ${page.order}: ${page.title}` : "Trang không còn tồn tại"}</span><h3>{item.word || "Từ chưa có nội dung"}</h3><p>{item.meaning || "Chưa có nghĩa"}</p>{item.audioUrl && <audio controls preload="none" src={item.audioUrl} aria-label={`Nghe cách đọc ${item.word || "từ vựng"}`} />}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa từ ${item.word || "chưa có tên"}`} onClick={() => beginEdit(item)} disabled={mutation.isPending || mutationOutcomeBlocked}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label={`Xóa từ ${item.word || "chưa có tên"}`} onClick={() => deleteVocabulary(item)} disabled={mutation.isPending || mutationOutcomeBlocked}><Trash size={17} aria-hidden="true" /></button></div></article>;
    })}</div> : story.pages.length ? <div className="editor-empty"><p>Truyện chưa có từ vựng.</p><p className="editor-help">Thêm các từ xuất hiện trong câu chuyện để phần đọc cùng bé luôn đúng ngữ cảnh.</p></div> : null}
  </EditorPanel>;
}
