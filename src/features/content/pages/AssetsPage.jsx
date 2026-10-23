import { Check, ImageSquare, MagnifyingGlass, Plus, Trash, UploadSimple, UserCircle, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { assetCategory, ASSET_CATEGORIES, validateAssetFile } from "../services/assetService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const categories = [
  { id: ASSET_CATEGORIES.CHARACTER, label: "Asset nhân vật", icon: UserCircle },
  { id: ASSET_CATEGORIES.BACKGROUND, label: "Background / hình ảnh phụ", icon: ImageSquare },
];

export default function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const previewDialogRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(ASSET_CATEGORIES.CHARACTER);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewAssetId, setPreviewAssetId] = useState("");
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }) });
  const images = (assetsQuery.data?.items || []).filter((asset) => asset.kind === "image");
  const visibleAssets = images.filter((asset) => assetCategory(asset) === activeCategory && (!search || asset.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())));
  const previewAsset = images.find((asset) => asset.id === previewAssetId);
  const uploadMutation = useMutation({
    mutationFn: ({ file, signal, category }) => contentService.uploadAsset({ file, signal, category }),
    onSuccess: async (uploaded) => {
      setError("");
      setSuccess("Ảnh đã được lưu trong thư viện.");
      setActiveCategory(assetCategory(uploaded));
      setPreviewAssetId(uploaded.id);
      uploadControllerRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
    },
    onError: (mutationError) => {
      uploadControllerRef.current = null;
      if (mutationError?.name !== "AbortError") setError(mutationError.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (asset) => contentService.deleteAsset(asset),
    onSuccess: async (_, asset) => {
      setPreviewAssetId("");
      setSuccess("Ảnh đã bị xóa khỏi thư viện.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(user.id) });
      await queryClient.invalidateQueries({ queryKey: ["story-preview", user.id] });
    },
    onError: (mutationError) => setError(mutationError.message || "Không thể xóa ảnh."),
  });

  useEffect(() => () => uploadControllerRef.current?.abort(), []);
  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (previewAssetId && previewAsset && dialog && !dialog.open) dialog.showModal();
    if (!previewAssetId && dialog?.open) dialog.close();
  }, [previewAsset, previewAssetId]);

  function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setSuccess("");
    if (!file) return;
    const validation = validateAssetFile(file, "image");
    if (Object.keys(validation).length) {
      setError(Object.values(validation)[0]);
      return;
    }
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    uploadMutation.mutate({ file, signal: controller.signal, category: activeCategory });
  }

  if (assetsQuery.isLoading) return <LoadingState label="Đang tải thư viện ảnh" />;
  if (assetsQuery.isError) return <ErrorState message={assetsQuery.error.message} onRetry={() => assetsQuery.refetch()} />;

  return <div className="workspace-dashboard assets-page">
    <header className="workspace-page-heading asset-library-page-heading">
      <div><p className="workspace-eyebrow">CONTENT / THƯ VIỆN ẢNH</p><h1>Kho tài sản</h1><p>Ảnh đã tải lên được lưu trên thiết bị và sẵn sàng dùng trong truyện.</p></div>
      <input ref={inputRef} id="asset-file" className="asset-file-input" aria-hidden="true" tabIndex={-1} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectFile} disabled={uploadMutation.isPending} />
      <button className="workspace-button asset-upload-trigger" type="button" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}><Plus size={18} aria-hidden="true" />{uploadMutation.isPending ? "Đang lưu ảnh…" : "Tải ảnh lên"}</button>
    </header>

    <main className="asset-library-shell">
      <div className="asset-library-toolbar">
        <div className="asset-category-tabs" role="tablist" aria-label="Nhóm ảnh">
          {categories.map((category) => {
            const count = images.filter((asset) => assetCategory(asset) === category.id).length;
            return <button className={activeCategory === category.id ? "active" : ""} id={`asset-tab-${category.id}`} type="button" role="tab" aria-selected={activeCategory === category.id} aria-controls="asset-panel" key={category.id} onClick={() => { setActiveCategory(category.id); setError(""); setSuccess(""); }}><category.icon size={18} aria-hidden="true" />{category.label}<small>{count}</small></button>;
          })}
        </div>
        <label className="asset-library-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm ảnh</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm trong ảnh đã tải lên" /></label>
      </div>

      {error && <p className="asset-local-message is-error" role="alert">{error}</p>}
      {success && <p className="asset-local-message" role="status"><Check size={16} aria-hidden="true" />{success}</p>}
      <section id="asset-panel" role="tabpanel" aria-labelledby={`asset-tab-${activeCategory}`} className="asset-local-panel">
        <div className="asset-local-panel-heading"><div><h2>{categories.find((item) => item.id === activeCategory)?.label}</h2><span>{visibleAssets.length} ảnh</span></div><button type="button" className="workspace-button workspace-button-quiet" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}><UploadSimple size={16} aria-hidden="true" />{uploadMutation.isPending ? "Đang lưu ảnh…" : "Tải ảnh"}</button></div>
        {visibleAssets.length ? <div className="asset-local-grid">{visibleAssets.map((asset) => <article className="asset-local-card" key={asset.id}>
          <button type="button" className="asset-local-image" aria-label={`Xem ${asset.name}`} onClick={() => setPreviewAssetId(asset.id)}>{asset.url ? <img src={asset.url} alt={asset.name} loading="lazy" /> : <span><ImageSquare size={28} />Ảnh chưa khả dụng</span>}<span className="asset-local-open">Mở ảnh</span></button>
          <div className="asset-local-card-info"><strong title={asset.name}>{asset.name}</strong><span>{formatSize(asset.size)}</span></div>
          {!asset.readOnly && <button type="button" className="asset-local-delete" aria-label={`Xóa ${asset.name}`} title="Xóa ảnh" onClick={() => { setPreviewAssetId(asset.id); setError(""); }}><Trash size={16} aria-hidden="true" /></button>}
        </article>)}</div> : <div className="asset-local-empty"><ImageSquare size={30} aria-hidden="true" /><strong>{search ? "Không tìm thấy ảnh" : "Chưa có ảnh trong nhóm này"}</strong><p>{search ? "Thử tìm bằng tên file khác." : "Tải ảnh lên để dùng lại trong truyện."}</p><button type="button" className="workspace-button" onClick={() => inputRef.current?.click()}><UploadSimple size={16} aria-hidden="true" />Tải ảnh lên</button></div>}
      </section>
    </main>

    <dialog ref={previewDialogRef} className="asset-preview-dialog" aria-labelledby="asset-preview-title" onClose={() => setPreviewAssetId("")} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      {previewAsset && <>
        <header className="asset-preview-heading"><div><p className="workspace-eyebrow">{categories.find((item) => item.id === assetCategory(previewAsset))?.label}</p><h2 id="asset-preview-title">{previewAsset.name}</h2></div><button className="asset-preview-close" type="button" aria-label="Đóng xem trước" onClick={() => previewDialogRef.current?.close()}><X size={21} aria-hidden="true" /></button></header>
        <div className="asset-preview-stage">{previewAsset.url ? <img src={previewAsset.url} alt={previewAsset.name} /> : <span>Ảnh local không còn tồn tại. Hãy tải ảnh lên lại.</span>}</div>
        {error && <p className="asset-local-message is-error" role="alert">{error}</p>}
        <footer className="asset-preview-footer"><div><strong>{previewAsset.mimeType || "image/*"}</strong><span>{formatSize(previewAsset.size)}</span></div>{!previewAsset.readOnly && <button className="workspace-button workspace-button-danger" type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(previewAsset)}><Trash size={16} aria-hidden="true" />{deleteMutation.isPending ? "Đang xóa…" : "Xóa ảnh"}</button>}</footer>
      </>}
    </dialog>
  </div>;
}

function formatSize(bytes = 0) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
