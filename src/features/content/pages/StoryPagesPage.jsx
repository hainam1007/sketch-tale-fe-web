import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FloppyDisk, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import AssetPicker from "../components/AssetPicker";
import StoryPageRenderer from "../components/StoryPageRenderer";
import { useContentAssets, useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";

const emptyPage = { title: "", text: "", backgroundAssetId: "", narration: "" };
const emptySlot = { pageId: "", x: 50, y: 50, scale: 1, flip: false, layer: 1, anchor: "center", assetId: "" };

function pageValues(page) {
  return page ? { title: page.title || "", text: page.text || "", backgroundAssetId: page.backgroundAssetId || "", narration: page.narration || "" } : emptyPage;
}

function slotValues(slot) {
  return slot ? { pageId: slot.pageId, x: slot.x, y: slot.y, scale: slot.scale, flip: Boolean(slot.flip), layer: slot.layer, anchor: slot.anchor || "center", assetId: slot.assetId || "" } : emptySlot;
}

function PageFields({ values, onChange, assets, prefix = "" }) {
  return (
    <div className="editor-form-grid">
      <EditorField label="Tiêu đề page" name={`${prefix}title`} value={values.title} onChange={(value) => onChange("title", value)} placeholder="Ví dụ: Một cánh cửa xanh" />
      <div className="editor-field"><AssetPicker assets={assets} id={`story-editor-${prefix}background`} label="Background asset" value={values.backgroundAssetId} onChange={(value) => onChange("backgroundAssetId", value)} /></div>
      <div className="editor-field editor-field-wide">
        <label htmlFor={`story-editor-${prefix}text`}>Nội dung page</label>
        <textarea id={`story-editor-${prefix}text`} rows="5" value={values.text} onChange={(event) => onChange("text", event.target.value)} placeholder="Nội dung hiển thị cho bé trong page này..." />
      </div>
      <div className="editor-field editor-field-wide">
        <label htmlFor={`story-editor-${prefix}narration`}>Narration / voice-over</label>
        <textarea id={`story-editor-${prefix}narration`} rows="3" value={values.narration} onChange={(event) => onChange("narration", event.target.value)} placeholder="Tuỳ chọn: lời đọc cho page." />
      </div>
    </div>
  );
}

function PageForm({ values, onChange, onSubmit, onCancel, isSaving, assets, submitLabel, prefix = "" }) {
  return (
    <form className="editor-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <PageFields values={values} onChange={onChange} assets={assets} prefix={prefix} />
      <div className="editor-form-actions">
        {onCancel && <button className="workspace-button workspace-button-quiet" type="button" onClick={onCancel}><X size={16} aria-hidden="true" /> Huỷ</button>}
        <button className="workspace-button" type="submit" disabled={isSaving}><FloppyDisk size={16} aria-hidden="true" /> {isSaving ? "Đang lưu..." : submitLabel}</button>
      </div>
    </form>
  );
}

function SlotFields({ values, pages, assets, onChange, onSubmit, isSaving }) {
  return (
    <form className="editor-form slot-properties-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="editor-form-grid">
        <EditorField label="Page" name="selected-slot-page" value={values.pageId} onChange={(value) => onChange("pageId", value)}>
          <select id="story-editor-selected-slot-page" value={values.pageId} onChange={(event) => onChange("pageId", event.target.value)}>
            {pages.map((page) => <option key={page.id} value={page.id}>Page {page.order}: {page.title}</option>)}
          </select>
        </EditorField>
        <div className="editor-field editor-field-wide"><AssetPicker assets={assets} id="story-editor-selected-slot-asset" label="Asset override" value={values.assetId} onChange={(value) => onChange("assetId", value)} /></div>
        <EditorField label="X (%)" name="selected-slot-x" type="number" min="0" max="100" value={values.x} onChange={(value) => onChange("x", value)} />
        <EditorField label="Y (%)" name="selected-slot-y" type="number" min="0" max="100" value={values.y} onChange={(value) => onChange("y", value)} />
        <EditorField label="Scale" name="selected-slot-scale" type="number" min="0.1" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
        <EditorField label="Layer" name="selected-slot-layer" type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
        <EditorField label="Anchor" name="selected-slot-anchor" value={values.anchor} onChange={(value) => onChange("anchor", value)}>
          <select id="story-editor-selected-slot-anchor" value={values.anchor} onChange={(event) => onChange("anchor", event.target.value)}>
            <option value="center">Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option>
          </select>
        </EditorField>
      </div>
      <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật ngang asset</label>
      <button className="workspace-button" type="submit" disabled={isSaving}><FloppyDisk size={16} aria-hidden="true" /> {isSaving ? "Đang lưu..." : "Lưu vị trí"}</button>
    </form>
  );
}

export default function StoryPagesPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const [showAdd, setShowAdd] = useState(false);
  const [newPage, setNewPage] = useState(emptyPage);
  const [selectedPageId, setSelectedPageId] = useState(story.pages[0]?.id || "");
  const [pageDraft, setPageDraft] = useState(pageValues(story.pages[0]));
  const [pageInitial, setPageInitial] = useState(pageValues(story.pages[0]));
  const [editingId, setEditingId] = useState(null);
  const [editingPage, setEditingPage] = useState(emptyPage);
  const [editingInitial, setEditingInitial] = useState(emptyPage);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slotDraft, setSlotDraft] = useState(emptySlot);
  const [slotInitial, setSlotInitial] = useState(emptySlot);
  const mutation = useStoryEditorMutation(({ action, pageId, roleId, slotId, payload, revision }) => {
    if (action === "add") return contentService.addPage({ storyId, revision, ...payload });
    if (action === "update") return contentService.updatePage({ storyId, pageId, revision, ...payload });
    if (action === "delete") return contentService.deletePage({ storyId, pageId, revision });
    if (action === "update-slot") return contentService.updateSlot({ storyId, roleId, slotId, revision, ...payload });
    return contentService.reorderPages({ storyId, pageIds: payload, revision });
  });
  const assets = assetsQuery.data?.items || [];
  const selectedPage = story.pages.find((page) => page.id === selectedPageId) || story.pages[0];
  const selectedSlot = useMemo(() => story.roles.flatMap((role) => (role.slots || []).map((slot) => ({ role, slot }))).find(({ slot }) => slot.id === selectedSlotId), [selectedSlotId, story.roles]);
  const dirty = (showAdd && JSON.stringify(newPage) !== JSON.stringify(emptyPage)) || JSON.stringify(pageDraft) !== JSON.stringify(pageInitial) || (editingId !== null && JSON.stringify(editingPage) !== JSON.stringify(editingInitial)) || (selectedSlot && JSON.stringify(slotDraft) !== JSON.stringify(slotInitial));
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  useEffect(() => {
    if (!story.pages.some((page) => page.id === selectedPageId)) {
      const next = story.pages[0];
      setSelectedPageId(next?.id || "");
      setPageDraft(pageValues(next));
      setPageInitial(pageValues(next));
    }
  }, [selectedPageId, story.pages]);

  function selectPage(page) {
    setSelectedPageId(page.id);
    const next = pageValues(page);
    setPageDraft(next);
    setPageInitial(next);
    setSelectedSlotId(null);
  }

  function selectSlot(slotId) {
    const nextSlot = story.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === slotId);
    setSelectedSlotId(slotId);
    const next = slotValues(nextSlot);
    setSlotDraft(next);
    setSlotInitial(next);
  }

  function updatePage(setter, name, value) {
    setter((current) => ({ ...current, [name]: value }));
  }

  function addPage() {
    mutation.mutate({ action: "add", payload: newPage }, { onSuccess: (nextStory) => {
      const next = nextStory.pages.at(-1);
      setNewPage(emptyPage); setShowAdd(false);
      if (next) selectPage(next);
    } });
  }

  function saveSelectedPage() {
    if (!selectedPage) return;
    mutation.mutate({ action: "update", pageId: selectedPage.id, payload: pageDraft }, { onSuccess: (nextStory) => {
      const next = nextStory.pages.find((page) => page.id === selectedPage.id) || nextStory.pages[0];
      setPageDraft(pageValues(next)); setPageInitial(pageValues(next));
    } });
  }

  function updatePageItem() {
    mutation.mutate({ action: "update", pageId: editingId, payload: editingPage }, { onSuccess: () => { setEditingId(null); setEditingInitial(emptyPage); } });
  }

  function beginEdit(page) {
    const nextEditing = pageValues(page);
    setEditingId(page.id); setEditingPage(nextEditing); setEditingInitial(nextEditing); selectPage(page);
  }

  function removePage(page) {
    if (!window.confirm(`Xoá page “${page.title}”? Các slot trỏ vào page này cũng sẽ được gỡ.`)) return;
    mutation.mutate({ action: "delete", pageId: page.id }, { onSuccess: (nextStory) => {
      const next = nextStory.pages[Math.max(0, page.order - 2)] || nextStory.pages[0];
      if (next) selectPage(next); else { setSelectedPageId(""); setPageDraft(emptyPage); setPageInitial(emptyPage); }
    } });
  }

  function movePage(index, direction) {
    const next = [...story.pages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    mutation.mutate({ action: "reorder", payload: next.map((page) => page.id) });
  }

  function saveSlot() {
    if (!selectedSlot) return;
    mutation.mutate({ action: "update-slot", roleId: selectedSlot.role.id, slotId: selectedSlot.slot.id, payload: { ...slotDraft, x: Number(slotDraft.x), y: Number(slotDraft.y), scale: Number(slotDraft.scale), layer: Number(slotDraft.layer) } }, { onSuccess: (nextStory) => {
      const nextSlot = nextStory.roles.flatMap((role) => role.slots || []).find((slot) => slot.id === selectedSlot.slot.id);
      const next = slotValues(nextSlot); setSlotDraft(next); setSlotInitial(next);
    } });
  }

  return (
    <EditorPanel eyebrow="PAGES" title="Nhịp kể của story" description="Mỗi page có nội dung, nền và narration riêng. Chọn page để xem ngay trên canvas; tọa độ slot dùng phần trăm và ID page ổn định." action={<button className="workspace-button" type="button" onClick={() => setShowAdd((current) => !current)}><Plus size={17} aria-hidden="true" /> {showAdd ? "Đóng form" : "Thêm page"}</button>}>
      {showAdd && <div className="editor-form-card"><h3>Page mới</h3><PageForm values={newPage} onChange={(name, value) => updatePage(setNewPage, name, value)} onSubmit={addPage} onCancel={() => setShowAdd(false)} isSaving={mutation.isPending} assets={assets} submitLabel="Thêm page" prefix="new-" /></div>}
      <EditorMutationMessage mutation={mutation} />
      {assetsQuery.isLoading && <p className="editor-help">Đang tải danh sách asset...</p>}
      <div className="story-pages-workspace">
        <aside className="story-pages-list" aria-label="Danh sách pages">
          <div className="story-pages-list-label">CÁC PAGE</div>
          {story.pages.length ? story.pages.map((page, index) => <button type="button" key={page.id} className={page.id === selectedPage?.id ? "active" : ""} onClick={() => selectPage(page)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{page.title || "Untitled page"}</strong><small>{page.text?.slice(0, 42) || "Chưa có nội dung"}</small></button>) : <p className="editor-help">Chưa có page.</p>}
        </aside>
        <div className="story-pages-canvas">
          {selectedPage ? <><div className="story-pages-canvas-toolbar"><span>Page {selectedPage.order} · {selectedSlot ? `Đang chọn ${selectedSlot.role.name}` : "Chọn slot trên canvas để sửa"}</span><div><button className="icon-button" type="button" aria-label={`Đưa ${selectedPage.title} lên`} disabled={selectedPage.order === 1 || mutation.isPending} onClick={() => movePage(selectedPage.order - 1, -1)}><ArrowUp size={17} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label={`Đưa ${selectedPage.title} xuống`} disabled={selectedPage.order === story.pages.length || mutation.isPending} onClick={() => movePage(selectedPage.order - 1, 1)}><ArrowDown size={17} aria-hidden="true" /></button></div></div><StoryPageRenderer story={story} page={selectedPage} assets={assets} selectedSlotId={selectedSlotId} onSlotSelect={selectSlot} /></> : <div className="editor-empty"><p>Story chưa có page nào.</p><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setShowAdd(true)}><Plus size={16} aria-hidden="true" /> Tạo page đầu tiên</button></div>}
        </div>
        <aside className="story-pages-properties">
          {selectedPage ? <><div className="story-pages-properties-heading"><span className="story-pages-list-label">PROPERTIES</span><h3>{selectedSlot ? `Slot · ${selectedSlot.role.name}` : "Page properties"}</h3></div>{selectedSlot ? <SlotFields values={slotDraft} pages={story.pages} assets={assets} onChange={(name, value) => updatePage(setSlotDraft, name, value)} onSubmit={saveSlot} isSaving={mutation.isPending} /> : <PageForm values={pageDraft} onChange={(name, value) => updatePage(setPageDraft, name, value)} onSubmit={saveSelectedPage} isSaving={mutation.isPending} assets={assets} submitLabel="Lưu page" prefix="properties-" />}</> : <p className="editor-help">Chọn hoặc tạo page để mở thuộc tính.</p>}
        </aside>
      </div>
      {story.pages.length ? <div className="editor-list story-pages-secondary-list">{story.pages.map((page, index) => <article className="editor-item" key={page.id}><div className="editor-item-heading"><div><span className="editor-item-index">PAGE {String(index + 1).padStart(2, "0")}</span><h3>{page.title}</h3><p>{page.text}</p></div><div className="editor-item-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => beginEdit(page)}><PencilSimple size={15} aria-hidden="true" /> Sửa nhanh</button><button className="icon-button icon-button-danger" type="button" aria-label={`Xoá ${page.title}`} onClick={() => removePage(page)}><Trash size={17} aria-hidden="true" /></button></div></div>{editingId === page.id && <PageForm values={editingPage} onChange={(name, value) => updatePage(setEditingPage, name, value)} onSubmit={updatePageItem} onCancel={() => setEditingId(null)} isSaving={mutation.isPending} assets={assets} submitLabel="Lưu page" prefix="edit-" />}</article>)}</div> : null}
    </EditorPanel>
  );
}
