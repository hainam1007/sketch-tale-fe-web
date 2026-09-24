import { CheckCircle, ImageSquare, MagnifyingGlass, UploadSimple, WarningCircle } from "@phosphor-icons/react";
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
  const uploadControllerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ search: "", kind: "all" });
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }) });
  const uploadMutation = useMutation({
    mutationFn: ({ file: nextFile, signal }) => contentService.uploadAsset({ file: nextFile, signal }),
    onSuccess: async () => {
      setFile(null);
      setSuccess("Asset đã được thêm vào library.");
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

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    uploadControllerRef.current?.abort();
  }, [preview]);

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

  if (assetsQuery.isLoading) return <LoadingState label="Đang tải asset library" />;
  if (assetsQuery.isError) return <ErrorState message={assetsQuery.error.message} onRetry={() => assetsQuery.refetch()} />;
  const visibleAssets = assetsQuery.data.items.filter((asset) => (filters.kind === "all" || asset.kind === filters.kind) && (!filters.search || asset.name.toLowerCase().includes(filters.search.toLowerCase())));
  return <div className="workspace-dashboard assets-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">CONTENT / ASSET LIBRARY</p><h1>Kho asset</h1><p>Asset dùng chung cho cover và slot minh họa. Upload gửi bytes multipart và giữ file khi lỗi để có thể thử lại.</p></div></div><div className="assets-layout"><section className="asset-upload-card"><div className="content-form-section"><span className="content-form-icon"><UploadSimple size={20} aria-hidden="true" /></span><div><h2>Thêm asset</h2><p>PNG, JPG, WEBP hoặc GIF · tối đa 5MB.</p></div></div><form onSubmit={submit}><label className="asset-file-label" htmlFor="asset-file"><ImageSquare size={26} aria-hidden="true" /><span>{file ? file.name : "Chọn file ảnh"}</span><small>{file ? `${Math.round(file.size / 1024)} KB · ${file.type}` : "Ảnh raster dùng chung"}</small></label><input ref={inputRef} id="asset-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectFile} />{preview && <img className="asset-upload-preview" src={preview} alt="Preview asset đang chọn" />}{error && <p className="asset-message asset-message-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {error}</p>}{uploadMutation.error && uploadMutation.error.name !== "AbortError" && <p className="asset-message asset-message-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {uploadMutation.error.message}</p>}{success && <p className="asset-message asset-message-success" role="status"><CheckCircle size={16} aria-hidden="true" /> {success}</p>}{uploadMutation.isPending && <div className="asset-upload-progress" aria-live="polite"><span>Đang tải file lên...</span><i aria-hidden="true" /></div>}<button className="workspace-button" type={uploadMutation.isPending ? "button" : "submit"} onClick={uploadMutation.isPending ? cancelUpload : undefined} disabled={!file && !uploadMutation.isPending}>{uploadMutation.isPending ? "Hủy upload" : uploadMutation.isError ? "Thử lại upload" : "Thêm vào library"}</button></form></section><section className="asset-library-grid"><div className="asset-grid-heading"><div><h2>Asset hiện có</h2><p className="asset-grid-subtitle">{visibleAssets.length}/{assetsQuery.data.items.length} file hiển thị</p></div><div className="asset-filter-row"><label className="asset-search"><MagnifyingGlass size={15} aria-hidden="true" /><span className="sr-only">Tìm tên file</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Tìm tên file" /></label><select aria-label="Lọc loại asset" value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value }))}><option value="all">Tất cả</option><option value="image">Ảnh</option><option value="audio">Audio</option></select></div></div>{visibleAssets.length ? <div className="asset-grid">{visibleAssets.map((asset) => <article className="asset-card" key={asset.id}><img src={asset.url} alt="" width="120" height="90" /><strong>{asset.name}</strong><small>{formatSize(asset.size)} · {asset.mimeType || asset.kind}</small></article>)}</div> : <div className="workspace-state workspace-state-empty"><ImageSquare size={27} aria-hidden="true" /><strong>Không có asset phù hợp</strong><p>Thử đổi từ khóa tìm kiếm hoặc bộ lọc.</p></div>}</section></div></div>;
}

function formatSize(bytes) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
