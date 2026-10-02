import { useState } from "react";
import { BookOpen, Heart, MagnifyingGlass, Star, Trash, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";

export default function ChildLibraryPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = ["all", "story", "character"].includes(searchParams.get("type")) ? searchParams.get("type") : "all";
  const search = searchParams.get("q") || "";
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingItemId, setPendingItemId] = useState(null);
  const libraryQuery = useQuery({ queryKey: queryKeys.childLibrary(user.id, childId, { type, search }), queryFn: ({ signal }) => childrenService.listLibrary({ childId, type, search, signal }) });
  const mutation = useMutation({ mutationFn: ({ itemId, action }) => childrenService.updateLibraryItem({ childId, itemId, action }), onMutate: ({ itemId }) => setPendingItemId(itemId), onSettled: () => setPendingItemId(null), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-library", user.id, childId] }) });
  const deleteMutation = useMutation({ mutationFn: (itemId) => childrenService.deleteLibraryItem({ childId, itemId }), onMutate: (itemId) => setPendingItemId(itemId), onSettled: () => setPendingItemId(null), onSuccess: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["child-library", user.id, childId] }); } });

  if (libraryQuery.isLoading) return <LoadingState label="Đang tải thư viện của bé" />;
  if (libraryQuery.isError) return <ErrorState title="Không thể tải thư viện" message={libraryQuery.error.message} onRetry={() => libraryQuery.refetch()} />;

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (!value && name === "type") next.delete("q");
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  return <div className="parent-library-page"><div className="parent-feature-heading"><div><p className="workspace-eyebrow">THƯ VIỆN / {child.displayName.toUpperCase()}</p><h2>Những điều bé đã chọn giữ lại</h2><p>Thao tác ở đây chỉ ảnh hưởng tới thư viện của {child.displayName}, không sửa truyện gốc.</p></div><span className="parent-feature-icon"><BookOpen size={27} aria-hidden="true" /></span></div><div className="library-toolbar"><label className="library-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm trong thư viện</span><input value={search} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Tìm truyện hoặc nhân vật" /></label><div className="library-type-tabs" role="tablist" aria-label="Loại nội dung">{[["all", "Tất cả"], ["story", "Truyện"], ["character", "Nhân vật"]].map(([value, label]) => <button aria-selected={type === value} className={type === value ? "active" : ""} type="button" role="tab" key={value} onClick={() => updateFilter("type", value === "all" ? "" : value)}>{label}</button>)}</div></div>{libraryQuery.data.items.length ? <div className="library-grid">{libraryQuery.data.items.map((item) => <article className={`library-card ${item.hidden ? "is-hidden" : ""}`} key={item.id}><img src={item.imageUrl} alt={`Ảnh ${item.title}`} width="240" height="150" /><div className="library-card-body"><div className="library-card-kicker"><span>{item.type === "story" ? "TRUYỆN" : "NHÂN VẬT"}</span>{item.favorite && <Star size={15} weight="fill" aria-label="Đã yêu thích" />}</div><h3>{item.title}</h3><p>{item.description}</p>{item.hidden && <small className="library-hidden-note">Đang ẩn khỏi thư viện chính</small>}<div className="library-card-actions"><button className="icon-button" type="button" aria-pressed={item.favorite} aria-label={item.favorite ? `Bỏ yêu thích ${item.title}` : `Yêu thích ${item.title}`} disabled={pendingItemId === item.id} onClick={() => mutation.mutate({ itemId: item.id, action: "favorite" })}><Heart size={17} weight={item.favorite ? "fill" : "regular"} /></button><button className="icon-button" type="button" aria-pressed={item.hidden} aria-label={item.hidden ? `Hiện lại ${item.title}` : `Ẩn ${item.title}`} disabled={pendingItemId === item.id} onClick={() => mutation.mutate({ itemId: item.id, action: item.hidden ? "unhide" : "hide" })}>{item.hidden ? <Eye size={17} /> : <EyeSlash size={17} />}</button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa ${item.title}`} disabled={pendingItemId === item.id} onClick={() => setDeleteTarget(item)}><Trash size={17} /></button></div></div></article>)}</div> : <EmptyState icon={BookOpen} title={search ? "Không tìm thấy nội dung" : "Thư viện đang trống"} message={search ? "Thử tìm bằng một từ khác hoặc xóa bộ lọc." : `Chưa có truyện hoặc nhân vật nào dành cho ${child.displayName}.`} action={search ? <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { updateFilter("q", ""); updateFilter("type", ""); }}>Xóa bộ lọc</button> : undefined} />}{(mutation.isError || deleteMutation.isError) && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {(mutation.error || deleteMutation.error).message}</p>}{deleteTarget && <div className="parent-dialog-backdrop" role="presentation"><div className="parent-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-library-title"><h2 id="delete-library-title">Xóa nội dung khỏi thư viện?</h2><p>Xóa <strong>{deleteTarget.title}</strong> khỏi thư viện của {child.displayName}. Nội dung gốc không bị thay đổi.</p><div className="parent-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Giữ lại</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Đang xóa..." : "Xóa khỏi thư viện"}</button></div></div></div>}</div>;
}
