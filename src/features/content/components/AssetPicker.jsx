import { useMemo, useState } from "react";
import { useContentAssets } from "../hooks/useStoryEditor";

/** Shared asset selector with a local search over the cached asset query. */
export default function AssetPicker({ assets: providedAssets, value = "", onChange, label = "Asset", id = "asset-picker", kind = "image", allowEmpty = true, disabled = false }) {
  const assetsQuery = useContentAssets();
  const [search, setSearch] = useState("");
  const assets = useMemo(() => providedAssets || assetsQuery.data?.items || [], [providedAssets, assetsQuery.data?.items]);
  const visibleAssets = useMemo(() => {
    const filtered = assets.filter((asset) => (kind === "all" || asset.kind === kind) && (!search || asset.name.toLowerCase().includes(search.toLowerCase())));
    const selected = assets.find((asset) => asset.id === value);
    return selected && !filtered.some((asset) => asset.id === selected.id) ? [selected, ...filtered] : filtered;
  }, [assets, kind, search, value]);
  const selectedAsset = assets.find((asset) => asset.id === value);

  return <div className="asset-picker">
    <label htmlFor={id}>{label}</label>
    <div className="asset-picker-controls">
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled || assetsQuery.isLoading}>
        <option value="" disabled={!allowEmpty}>{allowEmpty ? "Tự chọn asset đầu tiên" : "Chọn asset"}</option>
        {visibleAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}{asset.processingStatus === "failed" ? " · lỗi file local" : ""}</option>)}
      </select>
      <input aria-label="Tìm asset" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm asset" disabled={disabled} />
    </div>
    {assetsQuery.isError && !providedAssets && <small className="editor-field-error">Không thể tải asset: {assetsQuery.error.message}</small>}
    {value && selectedAsset ? <div className="asset-picker-selected">
      {selectedAsset.url ? <img className="asset-picker-preview" src={selectedAsset.url} alt={`Preview ${selectedAsset.name}`} /> : <div className="asset-picker-missing" role="alert">File local của asset này không còn tồn tại. Hãy chọn asset khác hoặc upload lại.</div>}
      <div className="asset-picker-meta"><strong>{selectedAsset.name}</strong><small>{selectedAsset.mimeType || selectedAsset.kind} · {formatAssetSize(selectedAsset.size)}</small></div>
    </div> : <p className="asset-picker-empty">Chưa chọn asset.</p>}
    <div className="asset-picker-results" aria-label="Danh sách asset">
      {visibleAssets.slice(0, 8).map((asset) => <button className={`asset-picker-option${asset.id === value ? " selected" : ""}`} type="button" key={asset.id} onClick={() => onChange(asset.id)} disabled={disabled} aria-label={`Chọn ${asset.name}`}>
        {asset.url ? <img src={asset.url} alt="" /> : <span className="asset-picker-option-missing">!</span>}
        <span>{asset.name}</span>
      </button>)}
    </div>
  </div>;
}

function formatAssetSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
