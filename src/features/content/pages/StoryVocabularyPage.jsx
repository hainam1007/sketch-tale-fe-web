import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenText, FloppyDisk, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { featureApiModes } from "../../../lib/api/featureApi";
import { vocabularyAppearsInRawText, vocabularyWordsEqualIgnoreCase } from "../services/vocabularyContract";

const emptyVocabulary = (pageId = "") => ({ pageId, word: "", meaning: "", audioUrl: "" });

export default function StoryVocabularyPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const confirmToast = useConfirmToast();
  const isRealApi = featureApiModes.content === "real";
  const defaultPageId = story.pages[0]?.id || "";
  const [values, setValues] = useState(() => emptyVocabulary(defaultPageId));
  const [baseline, setBaseline] = useState(() => emptyVocabulary(defaultPageId));
  const [editingId, setEditingId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isCheckingSavedText, setIsCheckingSavedText] = useState(false);
  const submitLock = useRef(false);
  const mutation = useStoryEditorMutation(({ action, vocabularyId, payload, revision }) => {
    if (action === "add") return contentService.addVocabulary({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateVocabulary({ storyId, vocabularyId, revision, ...payload });
    if (action === "delete") return contentService.deleteVocabulary({ storyId, vocabularyId, revision });
    throw new Error("Thao tác từ vựng không được hỗ trợ.");
  });
  useEffect(() => {
    if (editingId) document.getElementById("story-editor-vocabulary-word")?.focus();
  }, [editingId]);

  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const mutationOutcomeBlocked = Boolean(mutation.error?.mutationAccepted || mutation.error?.mutationOutcomeUnknown);
  useEditorSaveState({ dirty, isSaving: mutation.isPending || isCheckingSavedText, error: mutation.error, onDirtyChange: setEditorDirty });

  function update(name, value) {
    setValidationErrors({});
    setValues((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    const blank = emptyVocabulary(defaultPageId);
    setValues(blank);
    setBaseline(blank);
    setEditingId(null);
    setValidationErrors({});
  }

  async function saveVocabulary() {
    if (submitLock.current) return;
    const payload = { ...values, word: values.word.trim(), meaning: values.meaning.trim(), audioUrl: values.audioUrl.trim() };
    const errors = {};
    if (!payload.pageId) errors.pageId = "Chọn trang có từ này.";
    if (!payload.word) errors.word = "Nhập từ hoặc cụm từ.";
    if (!payload.meaning) errors.meaning = "Nhập nghĩa dễ hiểu cho bé.";
    if (Object.keys(errors).length) return setValidationErrors(errors);

    const wordDiffers = editingId
      ? !vocabularyWordsEqualIgnoreCase(payload.word, baseline.word)
      : true;
    const pageDiffers = Boolean(editingId && payload.pageId !== baseline.pageId);
    if (editingId && !wordDiffers && payload.word !== baseline.word) {
      return setValidationErrors({ word: "Backend hiện giữ nguyên từ khi chỉ đổi chữ hoa/thường. Hãy khôi phục cách viết cũ hoặc đổi nội dung từ rồi lưu." });
    }

    const action = editingId ? "update" : "add";
    submitLock.current = true;
    setIsCheckingSavedText(true);
    setValidationErrors({});
    try {
      if (wordDiffers || pageDiffers) {
        // The backend validates against the persisted page. Do not use a local
        // editor draft here and never save the page as a side effect.
        const rawText = await contentService.getSavedPageRawText({ storyId, pageId: payload.pageId });
        if (!rawText.trim()) {
          setValidationErrors({ word: "Trang chưa có RawText đã lưu trên máy chủ. Hãy lưu nội dung trang rồi quay lại; bản nháp chưa lưu không được tính." });
          return;
        }
        if (!vocabularyAppearsInRawText(payload.word, rawText)) {
          setValidationErrors({ word: "Từ chưa xuất hiện trong RawText đã lưu của trang. Hãy lưu nội dung trang rồi thử lại; kiểm tra này dùng NFC, không phân biệt hoa/thường và khớp chuỗi con." });
          return;
        }
      }
      await mutation.mutateAsync({ action, vocabularyId: editingId, payload });
      resetForm();
    } catch (error) {
      const message = error?.message || "Không thể lưu từ vựng.";
      if (error?.status === 400 || error?.status === 422) {
        const lowered = message.toLowerCase();
        const field = error?.fieldErrors && Object.keys(error.fieldErrors).some((key) => /meaning/i.test(key))
          || /nghĩa/.test(lowered)
          ? "meaning"
          : error?.fieldErrors && Object.keys(error.fieldErrors).some((key) => /word|vocab/i.test(key))
            || /từ vựng|rawtext|nội dung văn bản/.test(lowered)
            ? "word"
            : "form";
        setValidationErrors({ [field]: message });
      } else {
        setValidationErrors({ form: message });
      }
    } finally {
      submitLock.current = false;
      setIsCheckingSavedText(false);
    }
  }

  async function beginEdit(item) {
    if (editingId === item.id) return;
    if (dirty && editingId !== item.id && !await confirmToast({ title: "Mở từ vựng khác?", message: "Các thay đổi chưa lưu trong biểu mẫu hiện tại sẽ bị bỏ.", confirmLabel: "Mở từ vựng", tone: "danger" })) return;
    const next = { pageId: item.pageId || "", word: item.word || "", meaning: item.meaning || "", audioUrl: item.audioUrl || "" };
    setEditingId(item.id);
    setValues(next);
    setBaseline(next);
    setValidationErrors({});
  }

  async function deleteVocabulary(item) {
    const message = dirty && editingId === item.id
      ? `Xóa từ “${item.word}” khỏi truyện? Thay đổi chưa lưu trong form cũng sẽ bị bỏ.`
      : `Xóa từ “${item.word}” khỏi truyện?`;
    if (!await confirmToast({ title: "Xóa từ vựng?", message, confirmLabel: "Xóa từ", tone: "danger" })) return;
    mutation.mutate({ action: "delete", vocabularyId: item.id }, { onSuccess: () => { if (editingId === item.id) resetForm(); } });
  }

  return <EditorPanel className="story-collection-editor" isSaving={mutation.isPending || isCheckingSavedText} eyebrow="TỪ VỰNG" title="Từ vựng theo ngữ cảnh" description="Gắn mỗi từ với một trang để hiển thị đúng lúc đọc; có thể bổ sung âm thanh phát âm sau." action={<span className="story-editor-count"><BookOpenText size={17} aria-hidden="true" /> {story.vocabulary.length} từ</span>}>
    {!story.pages.length ? <div className="editor-empty"><h3>Tạo trang trước khi thêm từ vựng</h3><p className="editor-help">Mỗi từ vựng cần được gắn với một trang trong truyện.</p><Link className="workspace-button" to={`/content/stories/${storyId}/pages`}>Tạo trang đầu tiên</Link></div> : <div className="editor-form-card">
      <div className="editor-form-card-heading"><div><h3>{editingId ? "Sửa từ vựng" : "Thêm từ vựng"}</h3><p className="editor-help">Từ phải có trong RawText đã lưu trên máy chủ. Bản nháp chưa lưu ở Dựng truyện không được tính; hãy lưu trang trước rồi quay lại. SketchTale không tự lưu trang khi thêm từ.</p></div>{editingId && <button className="workspace-text-link" type="button" onClick={async () => { if (!dirty || await confirmToast({ title: "Hủy sửa từ vựng?", message: "Các thay đổi chưa lưu trong từ vựng sẽ bị bỏ.", confirmLabel: "Hủy sửa", tone: "danger" })) resetForm(); }}><X size={15} aria-hidden="true" /> Hủy sửa</button>}</div>
      <div className="editor-form-grid">
        <EditorField label="Trang có từ này" name="vocabulary-page" value={values.pageId} error={validationErrors.pageId} onChange={(value) => update("pageId", value)}><select id="story-editor-vocabulary-page" value={values.pageId} disabled={isRealApi && Boolean(editingId)} onChange={(event) => update("pageId", event.target.value)}><option value="">Chọn trang</option>{story.pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}</option>)}</select></EditorField>
        {isRealApi && editingId && <p className="editor-help editor-field-wide">Để chuyển từ sang trang khác, hãy xóa từ này rồi thêm lại ở trang mới.</p>}
        <EditorField label="Từ / cụm từ" name="vocabulary-word" value={values.word} error={validationErrors.word} onChange={(value) => update("word", value)} placeholder="Ví dụ: nảy mầm" />
        <EditorField label="Nghĩa" name="vocabulary-meaning" value={values.meaning} error={validationErrors.meaning} onChange={(value) => update("meaning", value)} placeholder="Giải thích ngắn, dễ hiểu" />
        <EditorField label="Đường dẫn âm thanh (không bắt buộc)" name="vocabulary-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
      </div>
      {validationErrors.form && <p className="editor-field-error" role="alert">{validationErrors.form}</p>}
      <div className="editor-form-actions"><button className="workspace-button" type="button" onClick={saveVocabulary} disabled={mutation.isPending || isCheckingSavedText || mutationOutcomeBlocked || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {isCheckingSavedText ? "Đang kiểm tra trang đã lưu..." : mutation.isPending ? "Đang lưu..." : editingId ? "Lưu từ" : "Thêm từ"}</button></div>
    </div>}
    {!(mutation.isError && [400, 422].includes(mutation.error?.status)) && <EditorMutationMessage mutation={mutation} showSuccess={false} />}
    {story.vocabulary.length ? <div className="editor-list" aria-label="Danh sách từ vựng">{story.vocabulary.map((item) => {
      const page = story.pages.find((candidate) => candidate.id === item.pageId);
      return <article className="editor-item vocabulary-item" key={item.id}><div><span className="editor-item-index">{page ? `Trang ${page.order}` : "Trang không còn tồn tại"}</span><h3>{item.word || "Từ chưa có nội dung"}</h3><p>{item.meaning || "Chưa có nghĩa"}</p>{item.audioUrl && <audio controls preload="none" src={item.audioUrl} aria-label={`Nghe cách đọc ${item.word || "từ vựng"}`} />}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa từ ${item.word || "chưa có tên"}`} onClick={() => beginEdit(item)} disabled={mutation.isPending || mutationOutcomeBlocked}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label={`Xóa từ ${item.word || "chưa có tên"}`} onClick={() => deleteVocabulary(item)} disabled={mutation.isPending || mutationOutcomeBlocked}><Trash size={17} aria-hidden="true" /></button></div></article>;
    })}</div> : story.pages.length ? <div className="editor-empty"><p>Truyện chưa có từ vựng.</p><p className="editor-help">Thêm các từ xuất hiện trong câu chuyện để phần đọc cùng bé luôn đúng ngữ cảnh.</p></div> : null}
  </EditorPanel>;
}
