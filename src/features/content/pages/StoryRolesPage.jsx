import { useState } from "react";
import { ArrowRight, FloppyDisk, PencilSimple, Plus, Trash, UserCircle, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { EditorField, EditorMutationMessage, EditorPanel } from "../components/StoryEditorParts";
import AssetPicker from "../components/AssetPicker";
import { useContentAssets, useStoryEditorData, useStoryEditorMutation } from "../hooks/useStoryEditor";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { contentService } from "../services/contentService";
import { validateAssetFile } from "../services/assetService";
import { featureApiModes } from "../../../lib/api/featureApi";

const emptyRole = { name: "", custom: true, sensitive: false, defaultAssetId: "", defaultAssetUrl: "", defaultAssetFileName: "", storyRoleType: undefined, status: undefined };
const roleTypes = [[0, "Nhân vật chính"], [1, "Bạn đồng hành"], [2, "Nhân vật hỗ trợ"], [3, "Khác"]];
const emptySlot = { pageId: "", x: 50, y: 50, scale: 1, flip: false, layer: 1 };

function pageLabel(pages, pageId) {
  const index = pages.findIndex((page) => page.id === pageId);
  return index < 0 ? "Trang không còn tồn tại" : `Trang ${index + 1}`;
}

function validateRole(values) {
  if (!values.name.trim()) return "Nhập tên nhân vật.";
  if (values.name.trim().length > 60) return "Tên nhân vật tối đa 60 ký tự.";
  return "";
}

function validateSlot(values) {
  const x = Number(values.x); const y = Number(values.y); const scale = Number(values.scale); const layer = Number(values.layer);
  if (!values.pageId) return "Chọn trang để đặt nhân vật.";
  if (![x, y, scale, layer].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || scale < 0.1 || scale > 5 || layer < 1 || !Number.isInteger(layer)) return "Vị trí ngang và dọc phải từ 0–100%, kích thước từ 0,1–5 và lớp phải là số nguyên từ 1.";
  return "";
}

function SlotForm({ roleId, values, pages, onChange, onSubmit, isSaving }) {
  return (
    <form className="slot-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="slot-form-main">
        <EditorField label="Trang" name={`slot-page-${roleId}`} value={values.pageId} onChange={(value) => onChange("pageId", value)}>
          <select id={`story-editor-slot-page-${roleId}`} value={values.pageId} onChange={(event) => onChange("pageId", event.target.value)}>
            <option value="">Chọn trang để đặt nhân vật</option>
            {pages.map((page) => <option key={page.id} value={page.id}>Trang {page.order}</option>)}
          </select>
        </EditorField>
        <EditorField label="X (%)" name={`slot-x-${roleId}`} type="number" min="0" max="100" value={values.x} onChange={(value) => onChange("x", value)} />
        <EditorField label="Y (%)" name={`slot-y-${roleId}`} type="number" min="0" max="100" value={values.y} onChange={(value) => onChange("y", value)} />
        <EditorField label="Kích thước" name={`slot-scale-${roleId}`} type="number" min="0.1" max="5" step="0.1" value={values.scale} onChange={(value) => onChange("scale", value)} />
        <EditorField label="Lớp hiển thị" name={`slot-layer-${roleId}`} type="number" min="1" value={values.layer} onChange={(value) => onChange("layer", value)} />
      </div>
      <label className="editor-checkbox"><input type="checkbox" checked={values.flip} onChange={(event) => onChange("flip", event.target.checked)} /> Lật nhân vật theo chiều ngang</label>
      <button className="workspace-button workspace-button-quiet" type="submit" disabled={isSaving}><Plus size={16} aria-hidden="true" /> Đặt lên trang</button>
    </form>
  );
}

export default function StoryRolesPage() {
  const { story, storyId, setEditorDirty } = useStoryEditorData();
  const confirmToast = useConfirmToast();
  const assetsQuery = useContentAssets();
  const [roleDraft, setRoleDraft] = useState(emptyRole);
  const [roleInitial, setRoleInitial] = useState(emptyRole);
  const [roleFile, setRoleFile] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [slotDrafts, setSlotDrafts] = useState({});
  const [localError, setLocalError] = useState("");
  const mutation = useStoryEditorMutation(({ action, roleId, slotId, payload, revision }) => {
    if (action === "add-role") return contentService.addRole({ storyId, revision, ...payload });
    if (action === "update-role") return contentService.updateRole({ storyId, roleId, revision, ...payload });
    if (action === "add-slot") return contentService.addSlot({ storyId, roleId, revision, ...payload });
    if (action === "delete-slot") return contentService.deleteSlot({ storyId, roleId, slotId, revision });
    throw new Error("Thao tác nhân vật không được hỗ trợ.");
  });
  const assets = assetsQuery.data?.items || [];
  const mutationOutcomeBlocked = Boolean(mutation.error?.mutationAccepted || mutation.error?.mutationOutcomeUnknown);
  const roleEnumBlocked = featureApiModes.content === "real" && (roleDraft.storyRoleType == null || (editingRoleId && roleDraft.status == null));
  function slotBaseline(roleId) {
    const role = story.roles.find((item) => item.id === roleId);
    const firstAvailable = story.pages.find((page) => !(role?.slots || []).some((slot) => slot.pageId === page.id));
    return { ...emptySlot, pageId: firstAvailable?.id || "" };
  }

  function availablePages(roleId) {
    const role = story.roles.find((item) => item.id === roleId);
    return story.pages.filter((page) => !(role?.slots || []).some((slot) => slot.pageId === page.id));
  }

  const dirty = JSON.stringify(roleDraft) !== JSON.stringify(roleInitial) || Object.entries(slotDrafts).some(([roleId, draft]) => JSON.stringify(draft) !== JSON.stringify(slotBaseline(roleId)));
  useEditorSaveState({ dirty, isSaving: mutation.isPending, error: mutation.error, onDirtyChange: setEditorDirty });

  function updateRole(name, value) {
    setLocalError("");
    if (name === "defaultAssetId" && value !== roleDraft.defaultAssetId) {
      setRoleFile(null);
      setRoleDraft((current) => ({ ...current, defaultAssetFileName: "", defaultAssetUrl: "", [name]: value }));
      return;
    }
    setRoleDraft((current) => ({ ...current, [name]: value }));
  }

  function slotFor(roleId) {
    return slotDrafts[roleId] || slotBaseline(roleId);
  }

  function updateSlot(roleId, name, value) {
    setLocalError("");
    setSlotDrafts((current) => ({ ...current, [roleId]: { ...slotFor(roleId), [name]: value } }));
  }

  function saveRole() {
    if (roleEnumBlocked) return setLocalError(roleDraft.storyRoleType == null ? "Chọn loại nhân vật trước khi lưu." : "Không thể lưu thay đổi nhân vật lúc này.");
    const error = validateRole(roleDraft);
    if (error) return setLocalError(error);
    setLocalError("");
    const action = editingRoleId ? "update-role" : "add-role";
    const selectedAsset = assets.find((asset) => asset.id === roleDraft.defaultAssetId);
    mutation.mutate({ action, roleId: editingRoleId, payload: { ...roleDraft, name: roleDraft.name.trim(), defaultAssetUrl: selectedAsset?.url || roleDraft.defaultAssetUrl || "", defaultAssetFile: roleFile } }, { onSuccess: () => { setRoleDraft(emptyRole); setRoleInitial(emptyRole); setRoleFile(null); setEditingRoleId(null); } });
  }

  async function beginRoleEdit(role) {
    if (editingRoleId === role.id) return;
    if (dirty && editingRoleId !== role.id && !await confirmToast({ title: "Mở nhân vật khác?", message: "Các thay đổi chưa lưu trong biểu mẫu hiện tại sẽ bị bỏ.", confirmLabel: "Mở nhân vật", tone: "danger" })) return;
    setEditingRoleId(role.id);
    const next = { name: role.name, custom: role.custom !== false, sensitive: Boolean(role.sensitive), defaultAssetId: role.defaultAssetId || "", defaultAssetUrl: role.defaultAssetUrl || "", defaultAssetFileName: "", storyRoleType: role.storyRoleType, status: role.status };
    setRoleFile(null);
    setRoleDraft(next);
    setRoleInitial(next);
    setLocalError("");
  }

  function addSlot(roleId) {
    const payload = slotFor(roleId);
    const error = validateSlot(payload);
    if (error) return setLocalError(error);
    setLocalError("");
    mutation.mutate({ action: "add-slot", roleId, payload: { ...payload, x: Number(payload.x), y: Number(payload.y), scale: Number(payload.scale), layer: Number(payload.layer) } }, { onSuccess: () => setSlotDrafts((current) => { const next = { ...current }; delete next[roleId]; return next; }) });
  }

  async function deleteSlot(role, slot) {
    const pageName = pageLabel(story.pages, slot.pageId);
    const dirtyWarning = dirty ? " Có thay đổi chưa lưu trong biểu mẫu; thao tác xóa sẽ không lưu chúng." : "";
    if (!await confirmToast({ title: "Xóa vị trí nhân vật?", message: `Xóa vị trí của ${role.name} khỏi ${pageName}?${dirtyWarning}`, confirmLabel: "Xóa vị trí", tone: "danger" })) return;
    setLocalError("");
    mutation.mutate({ action: "delete-slot", roleId: role.id, slotId: slot.id });
  }

  return (
    <EditorPanel eyebrow="NHÂN VẬT / VỊ TRÍ" title="Nhân vật trong truyện" description="Tạo nhân vật dùng xuyên suốt truyện, rồi đặt từng tư thế lên trang và chỉnh vị trí, kích thước, hướng nhìn cùng lớp hiển thị." action={<span className="story-editor-count"><UserCircle size={17} aria-hidden="true" /> {story.roles.length} nhân vật</span>}>
      <div className="editor-form-card">
        <h3>{editingRoleId ? "Sửa nhân vật" : "Thêm nhân vật"}</h3>
        <div className="editor-form-grid">
          <EditorField label="Tên nhân vật" name="role-name" value={roleDraft.name} onChange={(value) => updateRole("name", value)} placeholder="Ví dụ: Bobby" />
          {featureApiModes.content === "real" && <label className="editor-field"><span>Loại nhân vật <b>*</b></span><select value={roleDraft.storyRoleType ?? ""} onChange={(event) => updateRole("storyRoleType", event.target.value === "" ? undefined : Number(event.target.value))}><option value="">Chọn loại</option>{roleTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}
          <div className="editor-field"><AssetPicker assets={assets} id="story-editor-role-asset" label="Tư thế mặc định" category="character" value={roleDraft.defaultAssetId} onChange={(value) => updateRole("defaultAssetId", value)} /></div>
          {featureApiModes.content === "real" && <label className="editor-field"><span>Tải ảnh nhân vật lên (không bắt buộc)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0] || null; const errors = file ? validateAssetFile(file, "image") : {}; if (Object.keys(errors).length) { setLocalError(Object.values(errors)[0]); event.target.value = ""; return; } setRoleFile(file); updateRole("defaultAssetFileName", file?.name || ""); }} /><small>Ảnh tải lên sẽ dùng làm tư thế mặc định và thay ảnh đang chọn. PNG, JPG, WEBP, GIF · tối đa 5 MB.</small></label>}
        </div>
        <div className="editor-checkboxes"><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.custom} onChange={(event) => updateRole("custom", event.target.checked)} /> Nhân vật riêng của truyện</label><label className="editor-checkbox"><input type="checkbox" checked={roleDraft.sensitive} onChange={(event) => updateRole("sensitive", event.target.checked)} /> Nội dung nhạy cảm</label></div>
        {roleEnumBlocked && <p className="editor-help" role="status">{editingRoleId && roleDraft.status == null ? "Không thể lưu thay đổi nhân vật lúc này." : "Chọn loại nhân vật trước khi lưu."}</p>}
        <button className="workspace-button" type="button" onClick={saveRole} disabled={mutation.isPending || mutationOutcomeBlocked || roleEnumBlocked}><FloppyDisk size={16} aria-hidden="true" /> {editingRoleId ? "Lưu nhân vật" : "Thêm nhân vật"}</button>
        {editingRoleId && <button className="workspace-button workspace-button-quiet" type="button" onClick={async () => { if (JSON.stringify(roleDraft) !== JSON.stringify(roleInitial) && !await confirmToast({ title: "Hủy sửa nhân vật?", message: "Các thay đổi chưa lưu của nhân vật sẽ bị bỏ.", confirmLabel: "Hủy sửa", tone: "danger" })) return; setEditingRoleId(null); setRoleDraft(emptyRole); setRoleInitial(emptyRole); setRoleFile(null); }}><X size={16} aria-hidden="true" /> Hủy sửa</button>}
      </div>
      <EditorMutationMessage mutation={mutation} showSuccess={false} />
      {localError && <div className="editor-mutation-message editor-mutation-error" role="alert"><span>{localError}</span></div>}
      {story.roles.length ? <div className="role-list">{story.roles.map((role) => (
        <article className="role-card" key={role.id}>
          <div className="role-card-heading"><div><span className="editor-item-index">NHÂN VẬT</span><h3>{role.name}</h3><p>{role.custom ? "Nhân vật riêng của truyện" : "Nhân vật có sẵn"}{role.sensitive ? " · nhạy cảm" : ""}</p></div><div className="editor-item-actions"><button className="icon-button" type="button" aria-label={`Sửa nhân vật ${role.name}`} onClick={() => beginRoleEdit(role)} disabled={mutation.isPending || mutationOutcomeBlocked}><PencilSimple size={17} aria-hidden="true" /></button></div></div>
          <div className="slot-list">{role.slots?.length ? role.slots.map((slot) => <div className="slot-row" key={slot.id}><span><strong>{pageLabel(story.pages, slot.pageId)}</strong><small>Ngang {slot.x}% · dọc {slot.y}% · kích thước {slot.scale} · lớp {slot.layer}{slot.flip ? " · lật ngang" : ""}</small></span><div className="slot-row-actions"><Link className="workspace-text-link" to={`/content/stories/${storyId}/pages?pageId=${encodeURIComponent(slot.pageId)}&slotId=${encodeURIComponent(slot.id)}`}><ArrowRight size={14} aria-hidden="true" /> Mở vị trí trên trang</Link><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa vị trí ${role.name} khỏi ${pageLabel(story.pages, slot.pageId)}`} disabled={mutation.isPending || mutationOutcomeBlocked} onClick={() => deleteSlot(role, slot)}><Trash size={16} aria-hidden="true" /></button></div></div>) : <p className="editor-help">Nhân vật này chưa được đặt lên trang nào.</p>}</div>
          {availablePages(role.id).length ? <SlotForm roleId={role.id} values={slotFor(role.id)} pages={availablePages(role.id)} onChange={(name, value) => updateSlot(role.id, name, value)} onSubmit={() => addSlot(role.id)} isSaving={mutation.isPending || mutationOutcomeBlocked} /> : story.pages.length ? <p className="editor-help">Nhân vật đã được đặt trên tất cả các trang.</p> : <p className="editor-help">Hãy tạo ít nhất một trang trước khi đặt nhân vật.</p>}
        </article>
      ))}</div> : <div className="editor-empty"><p>Truyện chưa có nhân vật.</p><p className="editor-help">Nhân vật không bắt buộc để xuất bản, nhưng cần có nếu truyện sử dụng hình minh họa nhân vật.</p></div>}
    </EditorPanel>
  );
}
