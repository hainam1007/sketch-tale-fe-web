import { useState } from "react";
import { BookOpenText, FloppyDisk, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import { useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";

const emptyVocabulary = { pageId: "", word: "", meaning: "", audioUrl: "" };

export default function StoryVocabularyPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const [values, setValues] = useState({ ...emptyVocabulary, pageId: story.pages[0]?.id || "" });
  const [editingId, setEditingId] = useState(null);
  const mutation = useStoryEditorMutation(({ action, vocabularyId, payload, revision }) => {
    if (action === "add") return contentService.addVocabulary({ storyId, revision, ...payload });
    if (action === "update") return contentService.updateVocabulary({ storyId, vocabularyId, revision, ...payload });
    return contentService.deleteVocabulary({ storyId, vocabularyId, revision });
  });
  const defaultPageId = story.pages[0]?.id || "";
  const dirty = values.word !== "" || values.meaning !== "" || values.audioUrl !== "" || values.pageId !== defaultPageId;
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function saveVocabulary() {
    const action = editingId ? "update" : "add";
    mutation.mutate({ action, vocabularyId: editingId, payload: values }, { onSuccess: () => { setValues({ ...emptyVocabulary, pageId: story.pages[0]?.id || "" }); setEditingId(null); } });
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setValues({ pageId: item.pageId, word: item.word, meaning: item.meaning, audioUrl: item.audioUrl || "" });
  }

  return (
    <EditorPanel eyebrow="VOCABULARY" title="Từ vựng theo ngữ cảnh" description="Mỗi từ gắn với một page để mobile có thể hiển thị đúng lúc đọc và mở rộng sang audio sau này." action={<span className="story-editor-count"><BookOpenText size={17} aria-hidden="true" /> {story.vocabulary.length} từ</span>}>
      <div className="editor-form-card">
        <h3>{editingId ? "Sửa từ vựng" : "Thêm từ vựng"}</h3>
        <div className="editor-form-grid">
          <EditorField label="Page chứa từ" name="vocabulary-page" value={values.pageId} onChange={(value) => update("pageId", value)}>
            <select id="story-editor-vocabulary-page" value={values.pageId} onChange={(event) => update("pageId", event.target.value)}>
              <option value="">Chọn page</option>
              {story.pages.map((page) => <option key={page.id} value={page.id}>Page {page.order}: {page.title}</option>)}
            </select>
          </EditorField>
          <EditorField label="Từ / cụm từ" name="vocabulary-word" value={values.word} onChange={(value) => update("word", value)} placeholder="Ví dụ: nảy mầm" />
          <EditorField label="Nghĩa" name="vocabulary-meaning" value={values.meaning} onChange={(value) => update("meaning", value)} placeholder="Giải thích ngắn, dễ hiểu" />
          <EditorField label="Audio URL (tuỳ chọn)" name="vocabulary-audio" value={values.audioUrl} onChange={(value) => update("audioUrl", value)} placeholder="https://..." />
        </div>
        <button className="workspace-button" type="button" onClick={saveVocabulary} disabled={mutation.isPending || !story.pages.length}><FloppyDisk size={16} aria-hidden="true" /> {editingId ? "Lưu từ" : "Thêm từ"}</button>
        {editingId && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setEditingId(null); setValues({ ...emptyVocabulary, pageId: story.pages[0]?.id || "" }); }}><X size={16} aria-hidden="true" /> Huỷ sửa</button>}
      </div>
      <EditorMutationMessage mutation={mutation} />
      {story.vocabulary.length ? <div className="editor-list" aria-label="Danh sách từ vựng">{story.vocabulary.map((item) => <article className="editor-item vocabulary-item" key={item.id}><div><span className="editor-item-index">{story.pages.find((page) => page.id === item.pageId)?.title || "Page không còn tồn tại"}</span><h3>{item.word}</h3><p>{item.meaning}</p>{item.audioUrl && <small>{item.audioUrl}</small>}</div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa từ ${item.word}`} onClick={() => beginEdit(item)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label={`Xoá từ ${item.word}`} onClick={() => mutation.mutate({ action: "delete", vocabularyId: item.id })}><Trash size={17} aria-hidden="true" /></button></div></article>)}</div> : <div className="editor-empty"><p>Chưa có từ vựng trong story.</p><p className="editor-help">Thêm các từ thật sự xuất hiện trong câu chuyện để phần đọc cùng bé không bị rời ngữ cảnh.</p></div>}
    </EditorPanel>
  );
}
