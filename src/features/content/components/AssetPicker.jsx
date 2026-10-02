import { Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useContentAssets } from "../hooks/useStoryEditor";

/** Shared asset selector with compact select and a reviewable picker dialog. */
export default function AssetPicker({ assets: providedAssets, value = "", onChange, label = "Asset", id = "asset-picker", kind = "image", allowEmpty = true, disabled = false }) {
  const assetsQuery = useContentAssets();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const assets = useMemo(() => providedAssets || assetsQuery.data?.items || [], [providedAssets, assetsQuery.data?.items]);
  const visibleAssets = useMemo(() => {
    const filtered = assets.filter((asset) => (kind === "all" || asset.kind === kind) && (!search || asset.name.toLowerCase().includes(search.toLowerCase())));
    const selected = assets.find((asset) => asset.id === (dialogOpen ? draftValue : value));
    return selected && !filtered.some((asset) => asset.id === selected.id) ? [selected, ...filtered] : filtered;
  }, [assets, kind, search, value, draftValue, dialogOpen]);
  const selectedAsset = assets.find((asset) => asset.id === value);

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
    onChange(draftValue);
    closeDialog();
  }

  return <div className="asset-picker">
    <label htmlFor={id}>{label}</label>
    <div className="asset-picker-controls">
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled || assetsQuery.isLoading}>
        <option value="" disabled={!allowEmpty}>{allowEmpty ? "Chưa chọn tư liệu" : "Chọn tư liệu"}</option>
        {visibleAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.processingStatus === "failed" ? " · lỗi file local" : ""}</option>)}
      </select>
      <input aria-label="Tìm asset" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm asset" disabled={disabled} />
    </div>
    <button className="asset-picker-open" type="button" onClick={openDialog} disabled={disabled || assetsQuery.isLoading}><MagnifyingGlass size={16} aria-hidden="true" /> Mở kho tư liệu</button>
    {assetsQuery.isError && !providedAssets && <small className="editor-field-error">Không thể tải asset: {assetsQuery.error.message}</small>}
    {value && selectedAsset ? <div className="asset-picker-selected">
      {selectedAsset.url ? <img className="asset-picker-preview" src={selectedAsset.url} alt={`Preview ${selectedAsset.name}`} /> : <div className="asset-picker-missing" role="alert">File local của asset này không còn tồn tại. Hãy chọn asset khác hoặc upload lại.</div>}
      <div className="asset-picker-meta"><strong>{selectedAsset.name}</strong><small>{selectedAsset.mimeType || selectedAsset.kind} · {formatAssetSize(selectedAsset.size)}</small></div>
    </div> : <p className="asset-picker-empty">Chưa chọn tư liệu.</p>}
    <div className="asset-picker-results" aria-label="Danh sách asset">
      {visibleAssets.slice(0, 8).map((asset) => <button className={`asset-picker-option${asset.id === value ? " selected" : ""}`} type="button" key={asset.id} onClick={() => onChange(asset.id)} disabled={disabled || asset.processingStatus === "failed"} aria-label={`Chọn ${asset.name}`}>
        {asset.url ? <img src={asset.url} alt="" /> : <span className="asset-picker-option-missing">!</span>}
        <span>{asset.name}</span>
      </button>)}
    </div>
    {dialogOpen && <div className="asset-picker-dialog-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") closeDialog(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <section className="asset-picker-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-dialog-title`}>
        <div className="asset-picker-dialog-heading"><div><p className="workspace-eyebrow">ASSET LIBRARY</p><h2 id={`${id}-dialog-title`}>Chọn {label.toLowerCase()}</h2><p>Chọn một tư liệu phù hợp với loại trường này.</p></div><button className="icon-button" type="button" onClick={closeDialog} aria-label="Đóng hộp chọn tư liệu"><X size={18} aria-hidden="true" /></button></div>
        <label className="asset-picker-dialog-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm trong kho tư liệu</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên tư liệu" /></label>
        {visibleAssets.length ? <div className="asset-picker-dialog-grid">{visibleAssets.map((asset) => <button className={`asset-picker-dialog-option${asset.id === draftValue ? " selected" : ""}`} type="button" key={asset.id} onClick={() => setDraftValue(asset.id)} disabled={asset.processingStatus === "failed" || !asset.url}><span className="asset-picker-dialog-thumb">{asset.url ? <img src={asset.url} alt="" /> : <span aria-hidden="true">!</span>}</span><span><strong>{asset.name}</strong><small>{asset.mimeType || asset.kind} · {formatAssetSize(asset.size)}</small></span>{asset.id === draftValue && <Check size={17} aria-label="Đang chọn" />}</button>)}</div> : <p className="asset-picker-dialog-empty">Không tìm thấy tư liệu phù hợp.</p>}
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
