import { useState } from "react";
import { ArrowRight, FloppyDisk, PencilSimple, Plus, Trash, UserCircle, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import AssetPicker from "../components/AssetPicker";
import { useContentAssets, useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";

const emptyRole = { name: "", custom: true, sensitive: false, defaultAssetId: "" };
const emptySlot = { pageId: "", x: 50, y: 50, scale: 1, flip: false, layer: 1 };

function validateRole(values) {
  if (!values.name.trim()) return "Nhập tên nhân vật.";
  if (values.name.trim().length > 60) return "Tên nhân vật tối đa 60 ký tự.";
  return "";
}

function validateSlot(values) {
  const x = Number(values.x); const y = Number(values.y); const scale = Number(values.scale); const layer = Number(values.layer);
  if (!values.pageId) return "Chọn trang để đặt nhân vật.";
  if (![x, y, scale, layer].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || scale <= 0 || layer < 1 || !Number.isInteger(layer)) return "Vị trí ngang và dọc phải từ 0–100%, kích thước phải lớn hơn 0 và lớp phải là số nguyên từ 1.";
  return "";
}

function SlotForm({ values, pages, onChange, onSubmit, isSaving }) {
  return (
    <form className="slot-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="slot-form-main">
        <EditorField label="Trang" name="slot-page" value={values.pageId} onChange={(value) => onChange("pageId", value)}>
          <select id="story-editor-slot-page" value={values.pageId} onChange={(event) => onChange("pageId", event.target.value)}>
            <option value="">Chọn trang để đặt nhân vật</option>
            {pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}: {page.title}</option>)}
          </select>
        </EditorField>
        <EditorField label="X (%)" name="slot-x" type="number" min="0" max="100" value={values.x} onChange={(value) => onChange("x", value)} />
        <EditorField label="Y (%)" name="slot-y" type="number" min="0" max="100" value={values.y} onChange={(value) => onChange("y", value)} />
        <EditorField label="Kích thước" name="slot-scale" type="number" min="0.1" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
        <EditorField label="Lớp hiển thị" name="slot-layer" type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
      </div>
      <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật nhân vật theo chiều ngang</label>
      <button className="workspace-button workspace-button-quiet" type="submit" disabled={isSaving}><Plus size={16} aria-hidden="true" /> Đặt lên trang</button>
    </form>
  );
}

export default function StoryRolesPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const [roleDraft, setRoleDraft] = useState(emptyRole);
  const [roleInitial, setRoleInitial] = useState(emptyRole);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [slotDrafts, setSlotDrafts] = useState({});
  const [localError, setLocalError] = useState("");
  const mutation = useStoryEditorMutation(({ action, roleId, slotId, payload, revision }) => {
    if (action === "add-role") return contentService.addRole({ storyId, revision, ...payload });
    if (action === "update-role") return contentService.updateRole({ storyId, roleId, revision, ...payload });
    if (action === "delete-role") return contentService.deleteRole({ storyId, roleId, revision });
    if (action === "add-slot") return contentService.addSlot({ storyId, roleId, revision, ...payload });
    return contentService.deleteSlot({ storyId, roleId, slotId, revision });
  });
  const assets = assetsQuery.data?.items || [];
  const dirty = JSON.stringify(roleDraft) !== JSON.stringify(roleInitial) || Object.values(slotDrafts).some((draft) => JSON.stringify(draft) !== JSON.stringify({ ...emptySlot, pageId: story.pages[0]?.id || "" }));
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function updateRole(name, value) {
    setLocalError("");
    setRoleDraft((current) => ({ ...current, [name]: value }));
  }

  function slotFor(roleId) {
    return slotDrafts[roleId] || { ...emptySlot, pageId: story.pages[0]?.id || "" };
  }

  function updateSlot(roleId, name, value) {
    setLocalError("");
    setSlotDrafts((current) => ({ ...current, [roleId]: { ...slotFor(roleId), [name]: value } }));
  }

  function saveRole() {
    const error = validateRole(roleDraft);
    if (error) return setLocalError(error);
    setLocalError("");
    const action = editingRoleId ? "update-role" : "add-role";
    mutation.mutate({ action, roleId: editingRoleId, payload: { ...roleDraft, name: roleDraft.name.trim() } }, { onSuccess: () => { setRoleDraft(emptyRole); setRoleInitial(emptyRole); setEditingRoleId(null); } });
  }

  function beginRoleEdit(role) {
    if (dirty && editingRoleId !== role.id && !window.confirm("Bạn có thay đổi chưa lưu. Mở nhân vật khác sẽ bỏ chúng?")) return;
    setEditingRoleId(role.id);
    const next = { name: role.name, custom: role.custom !== false, sensitive: Boolean(role.sensitive), defaultAssetId: role.defaultAssetId || "" };
    setRoleDraft(next);
    setRoleInitial(next);
    setLocalError("");
  }

  function addSlot(roleId) {
    const payload = slotFor(roleId);
    const error = validateSlot(payload);
    if (error) return setLocalError(error);
    setLocalError("");
    mutation.mutate({ action: "add-slot", roleId, payload: { ...payload, x: Number(payload.x), y: Number(payload.y), scale: Number(payload.scale), layer: Number(payload.layer) } }, { onSuccess: () => setSlotDrafts((current) => ({ ...current, [roleId]: { ...emptySlot, pageId: story.pages[0]?.id || "" } })) });
  }

  return (
    <EditorPanel eyebrow="NHÂN VẬT / VỊ TRÍ" title="Nhân vật trong truyện" description="Tạo nhân vật dùng xuyên suốt truyện, rồi đặt từng tư thế lên trang và chỉnh vị trí, kích thước, hướng nhìn cùng lớp hiển thị." action={<span className="story-editor-count"><UserCircle size={17} aria-hidden="true" /> {story.roles.length} nhân vật</span>}>
      <div className="editor-form-card">
        <h3>{editingRoleId ? "Sửa nhân vật" : "Thêm nhân vật"}</h3>
        <div className="editor-form-grid">
          <EditorField label="Tên nhân vật" name="role-name" value={roleDraft.name} onChange={(value) => updateRole("name", value)} placeholder="Ví dụ: Bobby" />
          <div className="editor-field"><AssetPicker assets={assets} id="story-editor-role-asset" label="Tư thế mặc định" value={roleDraft.defaultAssetId} onChange={(value) => updateRole("defaultAssetId", value)} /></div>
        </div>
        <div className="editor-checkboxes"><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.custom} onChange={(event) => updateRole("custom", event.target.checked)} /> Nhân vật riêng của truyện</label><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.sensitive} onChange={(event) => updateRole("sensitive", event.target.checked)} /> Nội dung nhạy cảm</label></div>
        <button className="workspace-button" type="button" onClick={saveRole} disabled={mutation.isPending}><FloppyDisk size={16} aria-hidden="true" /> {editingRoleId ? "Lưu nhân vật" : "Thêm nhân vật"}</button>
        {editingRoleId && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setEditingRoleId(null); setRoleDraft(emptyRole); setRoleInitial(emptyRole); }}><X size={16} aria-hidden="true" /> Hủy sửa</button>}
      </div>
      <EditorMutationMessage mutation={mutation} />
      {localError && <div className="editor-mutation-message editor-mutation-error" role="alert"><span>{localError}</span></div>}
      {story.roles.length ? <div className="role-list">{story.roles.map((role) => (
        <article className="role-card" key={role.id}>
          <div className="role-card-heading"><div><span className="editor-item-index">NHÂN VẬT</span><h3>{role.name}</h3><p>{role.custom ? "Nhân vật riêng của truyện" : "Nhân vật có sẵn"}{role.sensitive ? " · nhạy cảm" : ""}</p></div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa nhân vật ${role.name}`} onClick={() => beginRoleEdit(role)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa nhân vật ${role.name}`} onClick={() => { if (window.confirm(`Xóa nhân vật “${role.name}” và mọi vị trí xuất hiện?`)) mutation.mutate({ action: "delete-role", roleId: role.id }); }}><Trash size={17} aria-hidden="true" /></button></div></div>
          <div className="slot-list">{role.slots?.length ? role.slots.map((slot) => <div className="slot-row" key={slot.id}><span><strong>{story.pages.find((page) => page.id === slot.pageId)?.title || "Trang không còn tồn tại"}</strong><small>Ngang {slot.x}% · dọc {slot.y}% · kích thước {slot.scale} · lớp {slot.layer}{slot.flip ? " · lật ngang" : ""}</small></span><div className="slot-row-actions"><Link className="workspace-text-link" to={`/content/stories/${storyId}/pages?pageId=${encodeURIComponent(slot.pageId)}&slotId=${encodeURIComponent(slot.id)}`} onClick={(event) => { if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Rời trang sẽ bỏ chúng?")) event.preventDefault(); }}><ArrowRight size={14} aria-hidden="true" /> Mở vị trí trên trang</Link><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa vị trí ở trang ${story.pages.find((page) => page.id === slot.pageId)?.title || "truyện"}`} onClick={() => { if (window.confirm("Xóa vị trí xuất hiện này?")) mutation.mutate({ action: "delete-slot", roleId: role.id, slotId: slot.id }); }}><Trash size={15} aria-hidden="true" /></button></div></div>) : <p className="editor-help">Nhân vật này chưa được đặt lên trang nào.</p>}</div>
          {story.pages.length ? <SlotForm values={slotFor(role.id)} pages={story.pages} onChange={(name, value) => updateSlot(role.id, name, value)} onSubmit={() => addSlot(role.id)} isSaving={mutation.isPending} /> : <p className="editor-help">Hãy tạo ít nhất một trang trước khi đặt nhân vật.</p>}
        </article>
      ))}</div> : <div className="editor-empty"><p>Truyện chưa có nhân vật.</p><p className="editor-help">Nhân vật không bắt buộc để xuất bản, nhưng cần có nếu truyện sử dụng hình minh họa nhân vật.</p></div>}
    </EditorPanel>
  );
}
