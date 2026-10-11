import { CheckCircle, ImageSquare, MagnifyingGlass, SpeakerHigh, Trash, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { validateAssetFile } from "../services/assetService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

export default function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const previewDialogRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ search: "", kind: "all" });
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [previewAssetId, setPreviewAssetId] = useState("");
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }) });
  const uploadMutation = useMutation({
    mutationFn: ({ file: nextFile, signal }) => contentService.uploadAsset({ file: nextFile, signal }),
    onSuccess: async (uploaded) => {
      setSelectedAssetId(uploaded?.id || "");
      setFile(null);
      setSuccess("Đã thêm tư liệu vào thư viện.");
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
      if (inputRef.current) inputRef.current.value = "";
      uploadControllerRef.current = null;
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
    },
    onError: (mutationError) => {
      uploadControllerRef.current = null;
      if (mutationError?.name !== "AbortError") setError(mutationError.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (assetId) => contentService.deleteAsset({ assetId }),
    onSuccess: async () => {
      setSelectedAssetId("");
      setSuccess("Đã xóa tư liệu khỏi thư viện.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
    },
  });

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    uploadControllerRef.current?.abort();
  }, [preview]);

  const previewAsset = assetsQuery.data?.items.find((asset) => asset.id === previewAssetId);

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (previewAssetId && previewAsset && dialog && !dialog.open) dialog.showModal();
    if (!previewAssetId && dialog?.open) dialog.close();
  }, [previewAsset, previewAssetId]);

  function selectFile(event) {
    const selected = event.target.files?.[0];
    setSuccess("");
    setError("");
    uploadMutation.reset();
    if (!selected) return;
    const validationErrors = validateAssetFile(selected);
    if (Object.keys(validationErrors).length) return setError(Object.values(validationErrors)[0]);
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function submit(event) {
    event.preventDefault();
    const validationErrors = validateAssetFile(file);
    if (Object.keys(validationErrors).length) return setError(Object.values(validationErrors)[0]);
    setError("");
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    uploadMutation.mutate({ file, signal: controller.signal });
  }

  function cancelUpload() {
    uploadControllerRef.current?.abort();
    uploadControllerRef.current = null;
    uploadMutation.reset();
    setError("Đã hủy upload. File vẫn được giữ để thử lại.");
  }

  if (assetsQuery.isLoading) return <LoadingState label="Đang tải thư viện tư liệu" />;
  if (assetsQuery.isError) return <ErrorState message={assetsQuery.error.message} onRetry={() => assetsQuery.refetch()} />;
  const visibleAssets = assetsQuery.data.items.filter((asset) => (filters.kind === "all" || asset.kind === filters.kind) && (!filters.search || asset.name.toLowerCase().includes(filters.search.toLowerCase())));
  const selectedAsset = assetsQuery.data.items.find((asset) => asset.id === selectedAssetId);
  return (
    <div className="workspace-dashboard assets-page">
      <div className="workspace-page-heading">
        <div><p className="workspace-eyebrow">CONTENT / KHO TƯ LIỆU</p><h1>Kho tư liệu</h1><p>Quản lý ảnh nền, nhân vật và âm thanh dùng trong truyện.</p></div>
      </div>

      <div className="assets-layout">
        <section className="asset-upload-card" aria-labelledby="asset-upload-title">
          <div className="content-form-section">
            <span className="content-form-icon"><UploadSimple size={20} aria-hidden="true" /></span>
            <div><h2 id="asset-upload-title">Thêm tư liệu</h2><p>Ảnh tối đa 5MB; âm thanh MP3, WAV, OGG, WEBM hoặc AAC tối đa 25MB.</p></div>
          </div>
          <form onSubmit={submit}>
            <label className="asset-file-label" htmlFor="asset-file">
              <ImageSquare size={23} aria-hidden="true" />
              <span>{file ? file.name : "Chọn ảnh hoặc file âm thanh"}</span>
              <small>{file ? `${Math.round(file.size / 1024)} KB · ${file.type}` : "Ảnh và audio dùng chung cho truyện"}</small>
            </label>
            <input ref={inputRef} id="asset-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/aac" onChange={selectFile} />
            <button className="workspace-button" type={uploadMutation.isPending ? "button" : "submit"} onClick={uploadMutation.isPending ? cancelUpload : undefined} disabled={!file && !uploadMutation.isPending}>
              {uploadMutation.isPending ? "Hủy upload" : uploadMutation.isError ? "Thử lại upload" : "Thêm vào thư viện"}
            </button>
            {preview && (file?.type.startsWith("audio/") ? <audio className="asset-upload-preview-audio" controls src={preview} aria-label="Nghe file âm thanh đang chọn" /> : <img className="asset-upload-preview" src={preview} alt="Xem trước ảnh đang chọn" />)}
            {error && <p className="asset-message asset-message-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {error}</p>}
            {uploadMutation.error && uploadMutation.error.name !== "AbortError" && !error && <p className="asset-message asset-message-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {uploadMutation.error.message}</p>}
            {success && <p className="asset-message asset-message-success" role="status"><CheckCircle size={16} aria-hidden="true" /> {success}</p>}
            {uploadMutation.isPending && <div className="asset-upload-progress" aria-live="polite"><span>Đang tải file lên...</span><i aria-hidden="true" /></div>}
          </form>
        </section>

        <section className="asset-library-grid" aria-labelledby="asset-library-title">
          <div className="asset-grid-heading">
            <div><h2 id="asset-library-title">Tư liệu hiện có</h2><p className="asset-grid-subtitle">{visibleAssets.length}/{assetsQuery.data.items.length} file hiển thị</p></div>
            <div className="asset-filter-row">
              <label className="asset-search"><MagnifyingGlass size={15} aria-hidden="true" /><span className="sr-only">Tìm tên file</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Tìm tên file" /></label>
              <select aria-label="Lọc loại asset" value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value }))}><option value="all">Tất cả</option><option value="image">Ảnh</option><option value="audio">Audio</option></select>
            </div>
          </div>

          {visibleAssets.length ? <div className="asset-grid">
            {visibleAssets.map((asset) => <button className={`asset-card${selectedAsset?.id === asset.id ? " selected" : ""}`} type="button" key={asset.id} onClick={() => { setSelectedAssetId(asset.id); setPreviewAssetId(asset.id); }} aria-label={`Xem ${asset.name}`}>
              <span className="asset-card-thumb">{asset.kind === "audio" ? <span className="asset-card-audio"><SpeakerHigh size={20} aria-hidden="true" /> Audio</span> : asset.url ? <img src={asset.url} alt="" width="120" height="90" /> : <span className="asset-card-missing">File không khả dụng</span>}</span>
              <strong>{asset.name}</strong><small>{formatSize(asset.size)} · {asset.mimeType || asset.kind}</small>
            </button>)}
          </div> : <div className="workspace-state workspace-state-empty"><ImageSquare size={27} aria-hidden="true" /><strong>Không có asset phù hợp</strong><p>Thử đổi từ khóa tìm kiếm hoặc bộ lọc.</p></div>}
        </section>
      </div>

      <dialog ref={previewDialogRef} className="asset-preview-dialog" aria-labelledby="asset-preview-title" onClose={() => setPreviewAssetId("")} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        {previewAsset && <>
          <header className="asset-preview-heading">
            <div><p className="workspace-eyebrow">CHI TIẾT TƯ LIỆU</p><h2 id="asset-preview-title">{previewAsset.name}</h2></div>
            <button className="asset-preview-close" type="button" aria-label="Đóng xem trước" onClick={() => previewDialogRef.current?.close()}><X size={21} aria-hidden="true" /></button>
          </header>
          <div className="asset-preview-stage">
            {previewAsset.kind === "audio" ? <audio controls preload="none" src={previewAsset.url} aria-label={`Nghe ${previewAsset.name}`} /> : previewAsset.url ? <img src={previewAsset.url} alt={previewAsset.name} /> : <span>File local không còn tồn tại</span>}
          </div>
          <footer className="asset-preview-footer">
            <div><strong>{previewAsset.mimeType || previewAsset.kind}</strong><span>{formatSize(previewAsset.size)} · ID: {previewAsset.id}</span></div>
            {deleteMutation.isError && <p className="asset-message asset-message-error" role="alert">{deleteMutation.error.message}</p>}
            <button className="workspace-button workspace-button-danger" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Xóa ${previewAsset.name} khỏi thư viện? Tư liệu đang được truyện sử dụng sẽ không thể xóa.`)) { previewDialogRef.current?.close(); deleteMutation.mutate(previewAsset.id); } }}><Trash size={15} aria-hidden="true" /> {deleteMutation.isPending ? "Đang xóa…" : "Xóa tư liệu"}</button>
          </footer>
        </>}
      </dialog>
    </div>
  );
}

function formatSize(bytes) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
