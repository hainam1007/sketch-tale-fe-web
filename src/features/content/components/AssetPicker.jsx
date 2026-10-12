import { Check, MagnifyingGlass, SpeakerHigh, UploadSimple, X } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { featureApiModes } from "../../../lib/api/featureApi";
import { queryKeys } from "../../../lib/api/queryKeys";
import { contentService } from "../services/contentService";
import { validateAssetFile } from "../services/assetService";
import { useContentAssets } from "../hooks/useStoryEditor";

/** A single entry point for choosing an asset; search and browsing live in the dialog. */
export default function AssetPicker({ assets: providedAssets, value = "", onChange, label = "Tư liệu", id = "asset-picker", kind = "image", allowEmpty = true, disabled = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const assetsQuery = useContentAssets();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [uploadError, setUploadError] = useState("");
  const assets = useMemo(() => providedAssets || assetsQuery.data?.items || [], [providedAssets, assetsQuery.data?.items]);
  const visibleAssets = useMemo(() => assets.filter((asset) => (kind === "all" || asset.kind === kind) && (!search || asset.name.toLowerCase().includes(search.toLowerCase()))), [assets, kind, search]);
  const selectedAsset = assets.find((asset) => asset.id === value);
  const canSelect = (asset) => Boolean(asset?.url) && (kind === "all" || asset.kind === kind) && asset.processingStatus !== "failed" && asset.processingStatus !== "processing";
  const uploadMutation = useMutation({
    mutationFn: (file) => contentService.uploadAsset({ file }),
    onSuccess: async (asset) => {
      setUploadError("");
      onChange(asset.id);
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
    onChange(draftValue);
    closeDialog();
  }

  function uploadSelectedFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const errors = validateAssetFile(file, kind === "audio" ? "audio" : "image");
    if (Object.keys(errors).length) {
      setUploadError(Object.values(errors)[0]);
      return;
    }
    setUploadError("");
    uploadMutation.mutate(file);
  }

  return <div className="asset-picker">
    <span className="asset-picker-label" id={`${id}-label`}>{label}</span>
    <div className="asset-picker-entry">
      <button className="asset-picker-open" type="button" onClick={openDialog} disabled={disabled || assetsQuery.isLoading} aria-labelledby={`${id}-label`}><MagnifyingGlass size={16} aria-hidden="true" /> {selectedAsset ? "Đổi tư liệu" : "Chọn từ kho tư liệu"}</button>
      {allowEmpty && value && <button className="icon-button" type="button" onClick={() => onChange("")} disabled={disabled} aria-label={`Gỡ ${label.toLowerCase()} đã chọn`}><X size={16} aria-hidden="true" /></button>}
    </div>
    {assetsQuery.isError && !providedAssets && <small className="editor-field-error">Không thể tải thư viện: {assetsQuery.error.message}</small>}
    {selectedAsset ? <div className="asset-picker-selected">
      {selectedAsset.kind === "audio" ? selectedAsset.url ? <audio controls preload="none" src={selectedAsset.url} aria-label={`Nghe ${selectedAsset.name}`} /> : <div className="asset-picker-missing" role="alert">Tệp âm thanh này không còn khả dụng.</div> : selectedAsset.url ? <img className="asset-picker-preview" src={selectedAsset.url} alt={`Xem trước ${selectedAsset.name}`} /> : <div className="asset-picker-missing" role="alert">Tệp này không còn khả dụng. Hãy chọn tư liệu khác hoặc tải tệp lên lại.</div>}
      <div className="asset-picker-meta"><strong>{selectedAsset.name}</strong><small>{selectedAsset.mimeType || selectedAsset.kind} · {formatAssetSize(selectedAsset.size)}</small></div>
    </div> : <p className="asset-picker-empty">Chưa chọn tư liệu.</p>}
    {dialogOpen && <div className="asset-picker-dialog-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") closeDialog(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <section className="asset-picker-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-dialog-title`}>
        <div className="asset-picker-dialog-heading"><div><p className="workspace-eyebrow">KHO TƯ LIỆU</p><h2 id={`${id}-dialog-title`}>Chọn {label.toLowerCase()}</h2><p>Tìm theo tên, nghe thử âm thanh hoặc xem trước hình ảnh.</p></div><button className="icon-button" type="button" onClick={closeDialog} aria-label="Đóng hộp chọn tư liệu"><X size={18} aria-hidden="true" /></button></div>
        <label className="asset-picker-dialog-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm trong kho tư liệu</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên tư liệu" /></label>
        {featureApiModes.content === "real" ? <p className="asset-picker-dialog-empty">Backend chưa có API thư viện asset dùng chung để upload.</p> : <div className="asset-picker-upload-row"><input ref={fileInputRef} type="file" hidden accept={kind === "audio" ? "audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac" : "image/png,image/jpeg,image/webp,image/gif"} onChange={uploadSelectedFile} /><button className="workspace-button workspace-button-quiet" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}><UploadSimple size={16} aria-hidden="true" /> {uploadMutation.isPending ? "Đang tải lên…" : "Tải tệp lên"}</button><span>Ảnh tối đa 5 MB · âm thanh tối đa 25 MB</span></div>}
        {(uploadError || uploadMutation.isError) && <p className="asset-message asset-message-error" role="alert">{uploadError || uploadMutation.error.message}</p>}
        {visibleAssets.length ? <div className="asset-picker-dialog-grid">{visibleAssets.map((asset) => <button className={`asset-picker-dialog-option${asset.id === draftValue ? " selected" : ""}`} type="button" key={asset.id} onClick={() => setDraftValue(asset.id)} disabled={!canSelect(asset)}>
          <span className="asset-picker-dialog-thumb">{asset.kind === "audio" ? <SpeakerHigh size={24} aria-hidden="true" /> : asset.url ? <img src={asset.url} alt="" /> : <span aria-hidden="true">!</span>}</span>
          <span><strong>{asset.name}</strong><small>{asset.mimeType || asset.kind} · {formatAssetSize(asset.size)}{!canSelect(asset) ? " · chưa sẵn sàng" : ""}</small></span>{asset.id === draftValue && <Check size={17} aria-label="Đang chọn" />}
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
