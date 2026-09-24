import { useEffect, useMemo, useState } from "react";
import { ImageSquare, TextT, UploadSimple } from "@phosphor-icons/react";
import AssetPicker from "./AssetPicker";
import { useEditorSaveState } from "../hooks/useEditorSaveState";

const emptyStory = { title: "", description: "", category: "", coverAssetId: "" };
const fallbackCategories = ["Thiên nhiên", "Gia đình", "Khám phá", "Cảm xúc"];

function validateStory(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Nhập tên truyện.";
  else if (values.title.trim().length > 80) errors.title = "Tên truyện tối đa 80 ký tự.";
  if (!values.category.trim()) errors.category = "Chọn một category.";
  return errors;
}

function categoryOptions(categories) {
  const source = categories.length ? categories : fallbackCategories;
  return source.map((category) => typeof category === "string" ? { id: category, label: category } : { id: category.id, label: category.label || category.name || category.id });
}

export default function StoryForm({ assets, categories = [], initialValues, isSaving, serverError, onSubmit, onCancel, onDirtyChange }) {
  const initialKey = JSON.stringify(initialValues || emptyStory);
  const [values, setValues] = useState(initialValues || emptyStory);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const serverFields = serverError?.fieldErrors || {};
  const dirty = JSON.stringify(values) !== initialKey;
  const options = useMemo(() => categoryOptions(categories), [categories]);
  const saveState = useEditorSaveState({ dirty, isSaving, error: serverError, onDirtyChange });

  useEffect(() => {
    function confirmLeave(event) {
      if (JSON.stringify(values) !== initialKey) event.preventDefault();
    }
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [initialKey, values]);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateStory(values);
    setErrors(nextErrors);
    setTouched({ title: true, description: true, category: true, coverAssetId: true });
    if (!Object.keys(nextErrors).length) onSubmit({ ...values, title: values.title.trim(), description: values.description.trim() });
  }

  return <form className="content-form" onSubmit={submit} noValidate>
    <div className="content-form-alerts">{serverError && <div className="parent-form-alert" role="alert"><strong>Chưa thể lưu story</strong><p>{serverError.message}</p></div>}{saveState.dirty && !saveState.isSaving && <p className="content-form-dirty" role="status">Có thay đổi chưa lưu</p>}</div>
    <div className="content-form-grid"><div>
      <div className="content-form-section"><span className="content-form-icon"><TextT size={20} aria-hidden="true" /></span><div><h2>Thông tin story</h2><p>Metadata giúp đội ngũ và Mobile hiểu đúng nội dung.</p></div></div>
      <div className="parent-field"><label htmlFor="story-title">Tên truyện <span>*</span></label><input id="story-title" value={values.title} onChange={(event) => update("title", event.target.value)} onBlur={() => setTouched((current) => ({ ...current, title: true }))} placeholder="Ví dụ: Hạt mầm đầu tiên" aria-invalid={Boolean(touched.title && (errors.title || serverFields.title))} />{touched.title && (errors.title || serverFields.title) && <p className="parent-field-error">{errors.title || serverFields.title}</p>}</div>
      <div className="parent-field"><label htmlFor="story-description">Mô tả ngắn</label><textarea id="story-description" rows="4" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Một câu mô tả giúp người khác nhận biết story." /></div>
      <div className="parent-field"><label htmlFor="story-category">Category <span>*</span></label><select id="story-category" value={values.category} onChange={(event) => update("category", event.target.value)} aria-invalid={Boolean(touched.category && (errors.category || serverFields.category))}><option value="">Chọn category</option>{options.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{touched.category && (errors.category || serverFields.category) && <p className="parent-field-error">{errors.category || serverFields.category}</p>}</div>
    </div><aside className="content-cover-picker">
      <div className="content-form-section"><span className="content-form-icon"><ImageSquare size={20} aria-hidden="true" /></span><div><h2>Ảnh cover</h2><p>Chọn asset đã có trong kho dùng chung.</p></div></div>
      <AssetPicker assets={assets} id="story-cover" label="Asset cover" value={values.coverAssetId} onChange={(value) => update("coverAssetId", value)} />
      {!assets.length && <p className="content-muted-note">Chưa có asset. Bạn vẫn có thể lưu draft rồi bổ sung sau.</p>}
    </aside></div><div className="parent-form-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { if (!dirty || window.confirm("Bạn có thay đổi chưa lưu. Rời trang?")) onCancel(); }}>Hủy</button><button className="workspace-button" type="submit" disabled={isSaving}><UploadSimple size={17} aria-hidden="true" /> {isSaving ? "Đang lưu..." : "Lưu bản nháp"}</button></div>
  </form>;
}
