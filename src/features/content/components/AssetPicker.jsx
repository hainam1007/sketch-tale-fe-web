import { Check, MagnifyingGlass, SpeakerHigh, UploadSimple, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { queryKeys } from "../../../lib/api/queryKeys";
import { contentService } from "../services/contentService";
import { assetCategory, validateAssetFile } from "../services/assetService";
import { useContentAssets } from "../hooks/useStoryEditor";

/** Shared asset picker with dialog and inline gallery presentations. */
export default function AssetPicker({ assets: providedAssets, value = "", onChange, label = "Tư liệu", id = "asset-picker", kind = "image", allowEmpty = true, disabled = false, showUploadHint = true, allowUpload = true, emptyLabel = "Chưa chọn tư liệu.", presentation = "dialog", category = "background" }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const assetsQuery = useContentAssets();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [uploadError, setUploadError] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [previewErrorCount, setPreviewErrorCount] = useState(0);
  const assets = useMemo(() => [...new Map([...(providedAssets || assetsQuery.data?.items || []), ...uploadedAssets].map((asset) => [asset.id, asset])).values()], [providedAssets, assetsQuery.data?.items, uploadedAssets]);
  const visibleAssets = useMemo(() => assets.filter((asset) => (kind === "all" || asset.kind === kind) && (kind !== "image" || !category || assetCategory(asset) === category) && (!search || asset.name.toLowerCase().includes(search.toLowerCase()))), [assets, kind, category, search]);
  const selectedAsset = assets.find((asset) => asset.id === value);
  useEffect(() => setPreviewErrorCount(0), [selectedAsset?.id, selectedAsset?.url, selectedAsset?.fallbackUrl]);
  const previewUrl = previewErrorCount === 0 ? selectedAsset?.url : previewErrorCount === 1 ? selectedAsset?.fallbackUrl : "";
  const canSelect = (asset) => Boolean(asset?.url) && (kind === "all" || asset.kind === kind) && asset.processingStatus !== "failed" && asset.processingStatus !== "processing";
  const uploadMutation = useMutation({
    mutationFn: (file) => contentService.uploadAsset({ file, category }),
    onSuccess: async (asset) => {
      setUploadError("");
      setUploadedAssets((previous) => [...previous, asset]);
      queryClient.setQueryData(queryKeys.assets(user.id), (previous) => ({ ...previous, items: [...(previous?.items || []).filter((item) => item.id !== asset.id), asset] }));
      onChange(asset.id, asset);
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
    },
  });

  function openDialog() {
    setDraftValue(value);
    setSearch("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSearch("");
  }

  function confirmSelection() {
    if (draftValue && !canSelect(assets.find((asset) => asset.id === draftValue))) return;
    onChange(draftValue, assets.find((asset) => asset.id === draftValue) || null);
    closeDialog();
  }

  function uploadSelectedFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled || uploadMutation.isPending) return;
    const errors = validateAssetFile(file, kind === "audio" ? "audio" : "image");
    if (Object.keys(errors).length) {
      setUploadError(Object.values(errors)[0]);
      return;
    }
    setUploadError("");
    uploadMutation.mutate(file);
  }

  if (presentation === "gallery" && kind === "image") {
    return <div className="asset-picker asset-picker-gallery">
      <span className="asset-picker-label" id={`${id}-label`}>{label}</span>
      {allowUpload && <div className="asset-picker-gallery-actions">
        <input ref={fileInputRef} aria-label={`Tải ảnh lên ${label.toLowerCase()}`} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadSelectedFile} disabled={disabled || uploadMutation.isPending} />
        <button className="asset-picker-gallery-upload" type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploadMutation.isPending}><UploadSimple size={17} aria-hidden="true" />{uploadMutation.isPending ? "Đang tải ảnh lên…" : "Tải ảnh lên"}</button>
        {allowEmpty && value && <button className="workspace-button workspace-button-quiet asset-picker-gallery-clear" type="button" onClick={() => onChange("")} disabled={disabled}><X size={15} aria-hidden="true" />Gỡ ảnh</button>}
      </div>}
      {showUploadHint && allowUpload && <small className="asset-picker-gallery-hint">PNG, JPG, WEBP hoặc GIF · tối đa 5 MB</small>}
      {(uploadError || uploadMutation.isError) && <p className="editor-field-error" role="alert">{uploadError || uploadMutation.error.message}</p>}
      <label className="asset-picker-gallery-search" htmlFor={`${id}-search`}><MagnifyingGlass size={16} aria-hidden="true" /><input id={`${id}-search`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ảnh trong kho" /></label>
      {assetsQuery.isError && !providedAssets && <p className="editor-field-error" role="alert">Không thể tải thư viện ảnh: {assetsQuery.error.message}</p>}
      {visibleAssets.length ? <div className="asset-picker-gallery-grid" aria-label="Thư viện ảnh">
        {visibleAssets.map((asset) => {
          const selectable = canSelect(asset);
          return <button className={`asset-picker-gallery-item${asset.id === value ? " selected" : ""}`} type="button" key={asset.id} onClick={() => onChange(asset.id, asset)} disabled={disabled || !selectable} aria-pressed={asset.id === value} title={asset.name}>
            <span className="asset-picker-gallery-thumb">{asset.url || asset.fallbackUrl ? <img src={asset.url || asset.fallbackUrl} alt="" loading="lazy" onError={(event) => { const image = event.currentTarget; if (asset.fallbackUrl && image.dataset.fallbackApplied !== "true") { image.dataset.fallbackApplied = "true"; image.src = asset.fallbackUrl; } else { image.style.visibility = "hidden"; } }} /> : <span aria-hidden="true">Ảnh</span>}{!selectable && <span className="asset-picker-gallery-status">{asset.processingStatus === "processing" ? "Đang xử lý" : "Không khả dụng"}</span>}</span>
            <span className="asset-picker-gallery-name"><strong>{asset.name}</strong>{asset.id === value && <Check size={15} aria-label="Đang dùng" />}</span>
          </button>;
        })}
      </div> : <p className="asset-picker-gallery-empty">{assetsQuery.isLoading ? "Đang tải thư viện ảnh…" : search ? "Không tìm thấy ảnh phù hợp." : emptyLabel}</p>}
      {!visibleAssets.length && !search && !assetsQuery.isLoading && <p className="asset-picker-gallery-empty-hint">Tải ảnh lên để thêm vào kho và dùng làm nền trang.</p>}
    </div>;
  }

  return <div className="asset-picker">
    <span className="asset-picker-label" id={`${id}-label`}>{label}</span>
    {allowUpload && <div className="asset-picker-upload-row"><input ref={fileInputRef} aria-label={`Tải lên ${label.toLowerCase()}`} type="file" hidden accept={kind === "audio" ? "audio/*" : "image/png,image/jpeg,image/webp,image/gif"} onChange={uploadSelectedFile} disabled={disabled || uploadMutation.isPending} /><button className="workspace-button workspace-button-quiet" type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploadMutation.isPending}><UploadSimple size={16} aria-hidden="true" />{uploadMutation.isPending ? "Đang tải lên…" : "Tải tệp lên"}</button>{showUploadHint && <small>{kind === "audio" ? "Âm thanh tối đa 25 MB" : "PNG, JPG, WEBP, GIF · tối đa 5 MB"}</small>}</div>}
    {allowUpload && (uploadError || uploadMutation.isError) && <p className="editor-field-error" role="alert">{uploadError || uploadMutation.error.message}</p>}
    <div className="asset-picker-entry">
      <button className="asset-picker-open" type="button" onClick={openDialog} disabled={disabled || assetsQuery.isLoading} aria-labelledby={`${id}-label`}><MagnifyingGlass size={16} aria-hidden="true" /> {selectedAsset ? "Đổi tư liệu" : "Chọn từ kho tư liệu"}</button>
      {allowEmpty && value && <button className="icon-button" type="button" onClick={() => onChange("")} disabled={disabled} aria-label={`Gỡ ${label.toLowerCase()} đã chọn`}><X size={16} aria-hidden="true" /></button>}
    </div>
    {assetsQuery.isError && !providedAssets && <small className="editor-field-error">Không thể tải thư viện: {assetsQuery.error.message}</small>}
    {selectedAsset ? <div className="asset-picker-selected">
      {selectedAsset.kind === "audio" ? selectedAsset.url ? <audio controls preload="none" src={selectedAsset.url} aria-label={`Nghe ${selectedAsset.name}`} /> : <div className="asset-picker-missing" role="alert">Tệp âm thanh này không còn khả dụng.</div> : previewUrl ? <img className="asset-picker-preview" src={previewUrl} alt={`Xem trước ${selectedAsset.fallbackName && previewErrorCount === 1 ? selectedAsset.fallbackName : selectedAsset.name}`} onError={() => setPreviewErrorCount((count) => Math.min(count + 1, 2))} /> : <div className="asset-picker-missing" role="alert">Tệp này không còn khả dụng. Hãy chọn tư liệu khác hoặc tải tệp lên lại.</div>}
      <div className="asset-picker-meta"><strong>{selectedAsset.name}</strong><small>{selectedAsset.mimeType || selectedAsset.kind} · {formatAssetSize(selectedAsset.size)}</small></div>
    </div> : <p className="asset-picker-empty">{emptyLabel}</p>}
    {dialogOpen && <div className="asset-picker-dialog-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") closeDialog(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <section className="asset-picker-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-dialog-title`}>
        <div className="asset-picker-dialog-heading"><div><p className="workspace-eyebrow">KHO TƯ LIỆU</p><h2 id={`${id}-dialog-title`}>Chọn {label.toLowerCase()}</h2><p>Tìm theo tên, nghe thử âm thanh hoặc xem trước hình ảnh.</p></div><button className="icon-button" type="button" onClick={closeDialog} aria-label="Đóng hộp chọn tư liệu"><X size={18} aria-hidden="true" /></button></div>
        <label className="asset-picker-dialog-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm trong kho tư liệu</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên tư liệu" /></label>
        {allowUpload && <div className="asset-picker-upload-row"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploadMutation.isPending}><UploadSimple size={16} aria-hidden="true" /> {uploadMutation.isPending ? "Đang tải lên…" : "Tải tệp lên"}</button>{showUploadHint && <span>Ảnh tối đa 5 MB · âm thanh tối đa 25 MB</span>}</div>}
        {allowUpload && (uploadError || uploadMutation.isError) && <p className="asset-message asset-message-error" role="alert">{uploadError || uploadMutation.error.message}</p>}
        {visibleAssets.length ? <div className="asset-picker-dialog-grid">{visibleAssets.map((asset) => <button className={`asset-picker-dialog-option${asset.id === draftValue ? " selected" : ""}`} type="button" key={asset.id} onClick={() => setDraftValue(asset.id)} disabled={!canSelect(asset)}>
          <span className="asset-picker-dialog-thumb">{asset.kind === "audio" ? <SpeakerHigh size={24} aria-hidden="true" /> : asset.url ? <img src={asset.url} alt="" /> : <span aria-hidden="true">!</span>}</span>
          <span><strong>{asset.name}</strong><small>{asset.mimeType || asset.kind}{!canSelect(asset) ? " · chưa sẵn sàng" : ""}</small></span>{asset.id === draftValue && <Check size={17} aria-label="Đang chọn" />}
        </button>)}</div> : <p className="asset-picker-dialog-empty">Không tìm thấy tư liệu phù hợp.</p>}
        <div className="asset-picker-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={closeDialog}>Hủy</button><button className="workspace-button" type="button" onClick={confirmSelection} disabled={!draftValue && !allowEmpty}>Chọn tư liệu</button></div>
      </section>
    </div>}
  </div>;
}

function formatAssetSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
