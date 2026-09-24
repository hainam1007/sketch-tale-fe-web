import { useState } from "react";
import { BookOpen, Heart, MagnifyingGlass, Star, Trash, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";

export default function ChildLibraryPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const libraryQuery = useQuery({ queryKey: queryKeys.childLibrary(user.id, childId, { type, search }), queryFn: ({ signal }) => childrenService.listLibrary({ childId, type, search, signal }) });
  const mutation = useMutation({ mutationFn: ({ itemId, action }) => childrenService.updateLibraryItem({ childId, itemId, action }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-library", user.id, childId] }) });
  const deleteMutation = useMutation({ mutationFn: (itemId) => childrenService.deleteLibraryItem({ childId, itemId }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-library", user.id, childId] }) });

  if (libraryQuery.isLoading) return <LoadingState label="Đang tải thư viện của bé" />;
  if (libraryQuery.isError) return <ErrorState title="Không thể tải thư viện" message={libraryQuery.error.message} onRetry={() => libraryQuery.refetch()} />;

  return <div className="parent-library-page"><div className="parent-feature-heading"><div><p className="workspace-eyebrow">THƯ VIỆN / {child.displayName.toUpperCase()}</p><h2>Những điều bé đã chọn giữ lại</h2><p>Thao tác ở đây chỉ ảnh hưởng tới thư viện của {child.displayName}, không sửa story template chung.</p></div><span className="parent-feature-icon"><BookOpen size={27} aria-hidden="true" /></span></div><div className="library-toolbar"><label className="library-search"><MagnifyingGlass size={17} aria-hidden="true" /><span className="sr-only">Tìm trong thư viện</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm truyện hoặc nhân vật" /></label><div className="library-type-tabs">{[["all", "Tất cả"], ["story", "Truyện"], ["character", "Nhân vật"]].map(([value, label]) => <button className={type === value ? "active" : ""} type="button" key={value} onClick={() => setType(value)}>{label}</button>)}</div></div>{libraryQuery.data.items.length ? <div className="library-grid">{libraryQuery.data.items.map((item) => <article className={`library-card ${item.hidden ? "is-hidden" : ""}`} key={item.id}><img src={item.imageUrl} alt="" width="240" height="150" /><div className="library-card-body"><div className="library-card-kicker"><span>{item.type === "story" ? "TRUYỆN" : "NHÂN VẬT"}</span>{item.favorite && <Star size={15} weight="fill" aria-label="Đã yêu thích" />}</div><h3>{item.title}</h3><p>{item.description}</p>{item.hidden && <small className="library-hidden-note">Đang ẩn khỏi thư viện chính</small>}<div className="library-card-actions"><button className="icon-button" type="button" aria-label={item.favorite ? `Bỏ yêu thích ${item.title}` : `Yêu thích ${item.title}`} onClick={() => mutation.mutate({ itemId: item.id, action: "favorite" })}><Heart size={17} weight={item.favorite ? "fill" : "regular"} /></button><button className="icon-button" type="button" aria-label={item.hidden ? `Hiện lại ${item.title}` : `Ẩn ${item.title}`} onClick={() => mutation.mutate({ itemId: item.id, action: item.hidden ? "unhide" : "hide" })}>{item.hidden ? <Eye size={17} /> : <EyeSlash size={17} />}</button><button className="icon-button icon-button-danger" type="button" aria-label={`Xóa ${item.title}`} onClick={() => { if (window.confirm(`Xóa ${item.title} khỏi thư viện của ${child.displayName}?`)) deleteMutation.mutate(item.id); }}><Trash size={17} /></button></div></div></article>)}</div> : <EmptyState icon={BookOpen} title="Thư viện đang trống" message={search ? "Không tìm thấy nội dung phù hợp." : `Chưa có truyện hoặc nhân vật nào dành cho ${child.displayName}.`} />}{(mutation.isError || deleteMutation.isError) && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {(mutation.error || deleteMutation.error).message}</p>}</div>;
}
