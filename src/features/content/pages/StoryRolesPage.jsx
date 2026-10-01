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
  if (!values.name.trim()) return "Nhập tên role.";
  if (values.name.trim().length > 60) return "Tên role tối đa 60 ký tự.";
  return "";
}

function validateSlot(values) {
  const x = Number(values.x); const y = Number(values.y); const scale = Number(values.scale); const layer = Number(values.layer);
  if (!values.pageId) return "Chọn page để đặt slot.";
  if (![x, y, scale, layer].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || scale <= 0 || layer < 1 || !Number.isInteger(layer)) return "X/Y phải từ 0–100%, scale > 0 và layer là số nguyên từ 1.";
  return "";
}

function SlotForm({ values, pages, onChange, onSubmit, isSaving }) {
  return (
    <form className="slot-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="slot-form-main">
        <EditorField label="Page" name="slot-page" value={values.pageId} onChange={(value) => onChange("pageId", value)}>
          <select id="story-editor-slot-page" value={values.pageId} onChange={(event) => onChange("pageId", event.target.value)}>
            <option value="">Chọn page để đặt slot</option>
            {pages.map((page) => <option key={page.id} value={page.id}>Page {page.order}: {page.title}</option>)}
          </select>
        </EditorField>
        <EditorField label="X (%)" name="slot-x" type="number" min="0" max="100" value={values.x} onChange={(value) => onChange("x", value)} />
        <EditorField label="Y (%)" name="slot-y" type="number" min="0" max="100" value={values.y} onChange={(value) => onChange("y", value)} />
        <EditorField label="Scale" name="slot-scale" type="number" min="0.1" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
        <EditorField label="Layer" name="slot-layer" type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
      </div>
      <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật ngang asset</label>
      <button className="workspace-button workspace-button-quiet" type="submit" disabled={isSaving}><Plus size={16} aria-hidden="true" /> Thêm slot</button>
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
    if (dirty && editingRoleId !== role.id && !window.confirm("Bạn có thay đổi chưa lưu. Mở role khác sẽ bỏ chúng?")) return;
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
    <EditorPanel eyebrow="ROLES / SLOTS" title="Nhân vật và vị trí xuất hiện" description="Role là dữ liệu ổn định của story. Slot đặt asset theo page bằng tọa độ phần trăm, scale, flip và layer; backend sẽ kiểm tra giới hạn trước khi lưu." action={<span className="story-editor-count"><UserCircle size={17} aria-hidden="true" /> {story.roles.length} roles</span>}>
      <div className="editor-form-card">
        <h3>{editingRoleId ? "Sửa role" : "Thêm role"}</h3>
        <div className="editor-form-grid">
          <EditorField label="Tên role" name="role-name" value={roleDraft.name} onChange={(value) => updateRole("name", value)} placeholder="Ví dụ: Mầm xanh" />
          <div className="editor-field"><AssetPicker assets={assets} id="story-editor-role-asset" label="Default asset" value={roleDraft.defaultAssetId} onChange={(value) => updateRole("defaultAssetId", value)} /></div>
        </div>
        <div className="editor-checkboxes"><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.custom} onChange={(event) => updateRole("custom", event.target.checked)} /> Role custom</label><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.sensitive} onChange={(event) => updateRole("sensitive", event.target.checked)} /> Nội dung nhạy cảm</label></div>
        <button className="workspace-button" type="button" onClick={saveRole} disabled={mutation.isPending}><FloppyDisk size={16} aria-hidden="true" /> {editingRoleId ? "Lưu role" : "Thêm role"}</button>
        {editingRoleId && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setEditingRoleId(null); setRoleDraft(emptyRole); setRoleInitial(emptyRole); }}><X size={16} aria-hidden="true" /> Huỷ sửa</button>}
      </div>
      <EditorMutationMessage mutation={mutation} />
      {localError && <div className="editor-mutation-message editor-mutation-error" role="alert"><span>{localError}</span></div>}
      {story.roles.length ? <div className="role-list">{story.roles.map((role) => (
        <article className="role-card" key={role.id}>
          <div className="role-card-heading"><div><span className="editor-item-index">ROLE</span><h3>{role.name}</h3><p>{role.custom ? "Custom role" : "Role hệ thống"}{role.sensitive ? " · sensitive" : ""}</p></div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa role ${role.name}`} onClick={() => beginRoleEdit(role)}><PencilSimple size={17} aria-hidden="true" /></button><button className="icon-button icon-button-danger" type="button" aria-label={`Xoá role ${role.name}`} onClick={() => { if (window.confirm(`Xoá role “${role.name}” và toàn bộ slot?`)) mutation.mutate({ action: "delete-role", roleId: role.id }); }}><Trash size={17} aria-hidden="true" /></button></div></div>
          <div className="slot-list">{role.slots?.length ? role.slots.map((slot) => <div className="slot-row" key={slot.id}><span><strong>{story.pages.find((page) => page.id === slot.pageId)?.title || "Page không còn tồn tại"}</strong><small>X {slot.x}% · Y {slot.y}% · scale {slot.scale} · layer {slot.layer}{slot.flip ? " · flipped" : ""}</small></span><div className="slot-row-actions"><Link className="workspace-text-link" to={`/content/stories/${storyId}/pages`} onClick={(event) => { if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Rời tab sẽ bỏ chúng?")) event.preventDefault(); }}><ArrowRight size={14} aria-hidden="true" /> Mở page</Link><button className="icon-button icon-button-danger" type="button" aria-label="Xoá slot" onClick={() => mutation.mutate({ action: "delete-slot", roleId: role.id, slotId: slot.id })}><Trash size={15} aria-hidden="true" /></button></div></div>) : <p className="editor-help">Role này chưa có slot.</p>}</div>
          {story.pages.length ? <SlotForm values={slotFor(role.id)} pages={story.pages} onChange={(name, value) => updateSlot(role.id, name, value)} onSubmit={() => addSlot(role.id)} isSaving={mutation.isPending} /> : <p className="editor-help">Tạo ít nhất một page trước khi đặt slot.</p>}
        </article>
      ))}</div> : <div className="editor-empty"><p>Story chưa có role nào.</p><p className="editor-help">Role không bắt buộc để publish, nhưng cần khi story có nhân vật tương tác.</p></div>}
    </EditorPanel>
  );
}
