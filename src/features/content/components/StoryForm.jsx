import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageSquare, TextT, UploadSimple } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { useAuth } from "../../auth/useAuth";
import { featureApiModes } from "../../../lib/api/featureApi";
import { queryKeys } from "../../../lib/api/queryKeys";
import AssetPicker from "./AssetPicker";
import { useEditorSaveState } from "../hooks/useEditorSaveState";
import { validateAssetFile } from "../services/assetService";
import { contentService } from "../services/contentService";

const emptyStory = { title: "", description: "", category: "", coverAssetId: "" };
const ageGroups = [[0, "6–7 tuổi"], [1, "8–10 tuổi"], [2, "11–12 tuổi"]];

function validateStory(values, requireAgeGroup) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Nhập tên truyện.";
  else if (values.title.trim().length > 80) errors.title = "Tên truyện tối đa 80 ký tự.";
  if (!values.category.trim()) errors.category = "Chọn một danh mục.";
  if (requireAgeGroup && (values.ageGroup === undefined || values.ageGroup === null || values.ageGroup === "")) errors.ageGroup = "Chọn nhóm tuổi phù hợp.";
  return errors;
}

function categoryOptions(categories) {
  return categories.map((category) => typeof category === "string" ? { id: category, label: category } : { id: category.id, label: category.label || category.name || category.id });
}

export default function StoryForm({ assets, assetsLoading, assetsError, categories = [], initialValues, isSaving, serverError, onSubmit, onCancel, onDirtyChange, navigationGuarded = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confirmToast = useConfirmToast();
  const isRealApi = featureApiModes.content === "real";
  const initialKey = JSON.stringify(initialValues || emptyStory);
  const [values, setValues] = useState(initialValues || emptyStory);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewFile, setCoverPreviewFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [currentCoverFailed, setCurrentCoverFailed] = useState(false);
  const [uploadedCoverAsset, setUploadedCoverAsset] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverFileError, setCoverFileError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const serverFields = serverError?.fieldErrors || {};
  const currentCoverUrl = initialValues?.coverImageUrl || "";
  const showCurrentCover = isRealApi && currentCoverUrl && !coverPreviewUrl && (!initialValues?.coverAssetId || values.coverAssetId === initialValues.coverAssetId);
  const mutationOutcomeBlocked = Boolean(serverError?.mutationAccepted || serverError?.mutationOutcomeUnknown);
  const backendEnumBlocked = isRealApi && Boolean(initialValues) && initialValues.status == null;
  const dirty = JSON.stringify(values) !== initialKey || Boolean(coverFile) || isUploadingCover;
  const coverAssets = uploadedCoverAsset ? [...(assets || []), uploadedCoverAsset] : assets;
  const options = useMemo(() => categoryOptions(categories), [categories]);
  useEditorSaveState({ dirty, isSaving, error: serverError, onDirtyChange });

  useEffect(() => {
    if (!coverPreviewFile) {
      setCoverPreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(coverPreviewFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverPreviewFile]);

  useEffect(() => setCurrentCoverFailed(false), [currentCoverUrl]);


  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => {
      if (!submitAttempted && !current[name]) return current;
      const next = { ...current };
      const fieldError = validateStory({ ...values, [name]: value }, isRealApi)[name];
      if (fieldError) next[name] = fieldError;
      else delete next[name];
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validateStory(values, isRealApi);
    setErrors(nextErrors);
    setTouched({ title: true, description: true, category: true, coverAssetId: true, ageGroup: true });
    if (Object.keys(nextErrors).length) {
      const fieldName = Object.keys(nextErrors)[0];
      const fieldId = fieldName === "ageGroup" ? "story-age-group" : `story-${fieldName}`;
      window.requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
      return;
    }
    if (isUploadingCover) {
      return;
    }
    onSubmit({ ...values, ...(coverFile ? { coverFile } : {}), title: values.title.trim(), description: values.description.trim() });
  }

  return <form className="content-form content-story-form" onSubmit={submit} noValidate>
    <div className="content-form-alerts">{backendEnumBlocked && <div className="parent-form-alert" role="status"><strong>Chưa thể lưu thay đổi của truyện này lúc này.</strong></div>}{serverError && <div className="parent-form-alert" role="alert"><strong>{mutationOutcomeBlocked ? "Hãy kiểm tra trạng thái trước khi gửi lại" : "Chưa thể lưu truyện"}</strong><p>{serverError.message}</p>{mutationOutcomeBlocked && <div className="content-form-reconcile-actions"><button className="workspace-text-link" type="button" onClick={() => window.location.reload()}>Tải lại trang</button><Link className="workspace-text-link" to={serverError.storyId || serverError.createdStoryId ? `/content/stories/${serverError.storyId || serverError.createdStoryId}` : "/content/stories"} target="_blank" rel="noreferrer">{serverError.storyId || serverError.createdStoryId ? "Mở truyện để kiểm tra" : "Mở kho truyện để kiểm tra"}</Link></div>}</div>}</div>
    <div className="content-form-grid"><div>
      <div className="content-form-section"><span className="content-form-icon"><TextT size={20} aria-hidden="true" /></span><div><h2>Nội dung giới thiệu</h2><p>Giúp người đọc nhận biết truyện trong thư viện.</p></div></div>
      <div className="parent-field"><label htmlFor="story-title">Tên truyện <span>*</span></label><input id="story-title" maxLength="80" value={values.title} onChange={(event) => update("title", event.target.value)} onBlur={() => setTouched((current) => ({ ...current, title: true }))} placeholder="Ví dụ: Hạt mầm đầu tiên" aria-invalid={Boolean(touched.title && (errors.title || serverFields.title))} aria-describedby={touched.title && (errors.title || serverFields.title) ? "story-title-error" : undefined} />{touched.title && (errors.title || serverFields.title) && <p id="story-title-error" className="parent-field-error">{errors.title || serverFields.title}</p>}<small className="content-field-hint">{values.title.length}/80 ký tự</small></div>
      <div className="parent-field"><label htmlFor="story-description">Mô tả ngắn</label><textarea id="story-description" maxLength="240" rows="4" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Một câu mô tả giúp người đọc nhận biết truyện." /><small className="content-field-hint">{values.description.length}/240 ký tự</small></div>
      <div className="story-form-meta-grid">
        <div className="parent-field"><label htmlFor="story-category">Danh mục <span>*</span></label><select id="story-category" value={values.category} onChange={(event) => update("category", event.target.value)} aria-invalid={Boolean(touched.category && (errors.category || serverFields.category))} aria-describedby={touched.category && (errors.category || serverFields.category) ? "story-category-error" : undefined}><option value="">{options.length ? "Chọn danh mục" : "Chưa có danh mục"}</option>{options.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{touched.category && (errors.category || serverFields.category) && <p id="story-category-error" className="parent-field-error">{errors.category || serverFields.category}</p>}{!options.length && <small className="content-field-hint">Chưa tải được danh mục; hãy thử tải lại trước khi lưu.</small>}</div>
        {isRealApi && <div className="parent-field"><label htmlFor="story-age-group">Nhóm tuổi <span>*</span></label><select id="story-age-group" value={values.ageGroup ?? ""} onChange={(event) => update("ageGroup", event.target.value)} aria-invalid={Boolean(touched.ageGroup && errors.ageGroup)}><option value="">Chọn nhóm tuổi</option>{ageGroups.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{touched.ageGroup && errors.ageGroup && <p className="parent-field-error">{errors.ageGroup}</p>}</div>}
      </div>
    </div><aside className="content-cover-picker">
      <div className="content-form-section"><span className="content-form-icon"><ImageSquare size={20} aria-hidden="true" /></span><div><h2>Ảnh bìa</h2><p>Chọn ảnh có sẵn trong kho tư liệu hoặc tải ảnh mới trực tiếp từ máy tính.</p></div></div>
      <div className="parent-field">
        <AssetPicker assets={coverAssets} id="story-cover-library" label="Ảnh có sẵn trong kho tư liệu" value={values.coverAssetId} allowUpload={false} showUploadHint={false} disabled={isSaving || isUploadingCover} emptyLabel={showCurrentCover ? "Ảnh bìa hiện tại được lưu trực tiếp trên truyện." : undefined} onChange={(value) => {
          update("coverAssetId", value);
          setCoverFile(null);
          setCoverPreviewFile(null);
          setCoverFileError("");
        }} />
        {assetsError && coverAssets?.length ? <p className="parent-field-error" role="alert">Không thể làm mới kho tư liệu: {assetsError} Bạn vẫn có thể chọn ảnh đã tải và tải ảnh mới từ máy.</p> : assetsLoading ? <p className="content-muted-note">Đang tải kho tư liệu…</p> : !assetsError && !coverAssets?.length && <p className="content-muted-note">Chưa có tư liệu hình ảnh. Bạn vẫn có thể tải ảnh trực tiếp từ máy ở khung bên dưới.</p>}
      </div>
      <div className="parent-field">
        <label htmlFor="story-cover-file">{initialValues?.coverImageUrl ? "Tệp ảnh bìa từ máy tính (không bắt buộc)" : "Tải tệp ảnh bìa từ máy tính (không bắt buộc)"}</label>
        <div className="story-cover-file-box">
          <input id="story-cover-file" className="story-cover-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={isSaving || isUploadingCover} onChange={async (event) => {
          const file = event.target.files?.[0] || null;
          event.target.value = "";
          if (!file) return;
          const fileErrors = validateAssetFile(file, "image");
          if (Object.keys(fileErrors).length) {
            setCoverFileError(Object.values(fileErrors)[0]);
            return;
          }
          setCoverFileError("");
          setCoverPreviewFile(file);
          if (isRealApi) {
            setValues((current) => ({ ...current, coverAssetId: "" }));
            setCoverFile(file);
            setUploadedCoverAsset(null);
            return;
          }
          setIsUploadingCover(true);
          try {
            const asset = await contentService.uploadAsset({ file });
            setUploadedCoverAsset(asset);
            setValues((current) => ({ ...current, coverAssetId: asset.id }));
            setCoverFile(null);
            queryClient.setQueryData(queryKeys.assets(user.id), (previous) => ({ ...previous, items: [...(previous?.items || []).filter((item) => item.id !== asset.id), asset] }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
          } catch (error) {
            setCoverFileError(error.message || "Không thể tải ảnh lên.");
          } finally {
            setIsUploadingCover(false);
          }
        }} />
          <div className="story-cover-file-row">
            <label className="story-cover-file-button" htmlFor="story-cover-file">Chọn tệp</label>
            <span className={coverPreviewFile ? "story-cover-file-name" : "story-cover-file-name is-empty"}>{coverPreviewFile ? `${coverPreviewFile.name} · ${Math.ceil(coverPreviewFile.size / 1024)} KB` : "Chưa có tệp nào được chọn"}</span>
          </div>
          {coverPreviewUrl && <img className="story-cover-file-preview" src={coverPreviewUrl} alt={`Xem trước ảnh bìa ${coverPreviewFile?.name || "đã chọn"}`} />}
          {showCurrentCover && <div className="story-cover-current">{currentCoverFailed ? <small role="status">Ảnh bìa hiện tại đã lưu nhưng không tải được bản xem trước.</small> : <><small>Ảnh bìa hiện tại</small><img className="story-cover-file-preview" src={currentCoverUrl} alt={`Ảnh bìa hiện tại của ${initialValues?.title || "truyện"}`} onError={() => setCurrentCoverFailed(true)} /></>}</div>}
        </div>
        {isUploadingCover && <small className="content-field-hint">Đang tải ảnh lên kho tư liệu…</small>}
        {coverFileError && <p className="parent-field-error" role="alert">{coverFileError}</p>}
        <small className="content-field-hint">{values.coverImageUrl ? "Bỏ trống để giữ ảnh hiện tại. " : ""}PNG, JPG, WEBP, GIF · tối đa 5 MB.</small>
      </div>
    </aside></div><div className="parent-form-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={async () => { if (navigationGuarded || !dirty || await confirmToast({ title: "Rời trang này?", message: "Bạn có thay đổi chưa lưu. Nếu rời trang, các thay đổi này sẽ bị bỏ.", confirmLabel: "Rời trang", tone: "danger" })) onCancel(); }}>Hủy</button><button className="workspace-button" type="submit" disabled={isSaving || isUploadingCover || mutationOutcomeBlocked || backendEnumBlocked}><UploadSimple size={17} aria-hidden="true" /> {isSaving ? "Đang lưu..." : initialValues ? "Lưu thông tin truyện" : "Tạo truyện"}</button></div>
  </form>;
}
