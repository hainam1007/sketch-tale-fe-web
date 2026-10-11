import { useState } from "react";
import { BookOpen, CheckCircle, MagnifyingGlass, PaperPlaneTilt, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-library.css";

export default function ParentLibraryPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const catalog = useQuery({ queryKey: ["parent-stories", user.id], queryFn: ({ signal }) => childrenService.storyCatalog({ signal }) });
  const search = params.get("q") || "";
  const category = params.get("category") || "";
  const stories = catalog.data?.items || [];
  const selected = stories.find((story) => story.id === params.get("story"));
  const categories = [...new Set(stories.map((story) => story.category).filter(Boolean))];
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const filtered = stories.filter((story) => (!category || story.category === category) && normalize(`${story.title} ${story.description}`).includes(normalize(search)));
  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    setParams(next, { replace: name !== "story" });
  }

  return <div className="parent-page parent-catalog">
    <header className="catalog-heading"><div><p className="workspace-eyebrow">PHỤ HUYNH / THƯ VIỆN TRUYỆN</p><h1>Cùng bé chọn câu chuyện tiếp theo</h1><p>Đọc trước những câu chuyện nhỏ, tìm điều bé yêu thích và gửi một gợi ý vào thư viện của bé.</p></div><img src="/images/seed.webp" alt="" /></header>
    {selected ? <StoryDetail key={selected.id} story={selected} userId={user.id} onBack={() => update("story", "")} /> : <>
      <div className="catalog-toolbar"><h2>Khám phá truyện</h2><label className="library-search"><MagnifyingGlass size={20} aria-hidden="true" /><span className="sr-only">Tìm truyện</span><input value={search} placeholder="Tìm tên truyện, nội dung…" onChange={(event) => update("q", event.target.value)} /></label></div>
      <div className="catalog-filters" aria-label="Chủ đề truyện">{["", ...categories].map((value) => <button key={value} type="button" aria-pressed={category === value} onClick={() => update("category", value)}>{value || "Tất cả truyện"}</button>)}</div>
      {catalog.isLoading ? <LoadingState label="Đang tải thư viện truyện" /> : catalog.isError ? <ErrorState title="Không thể tải truyện" message={catalog.error.message} onRetry={() => catalog.refetch()} /> : <>
        <p className="catalog-count">{filtered.length} câu chuyện để khám phá</p>
        {filtered.length ? <div className="catalog-grid">{filtered.map((story) => <article className="catalog-book" key={story.id}>
          <button className="catalog-cover" type="button" onClick={() => update("story", story.id)} aria-label={`Xem trước ${story.title}`}>{story.imageUrl ? <img src={story.imageUrl} alt={`Bìa truyện ${story.title}`} /> : <BookOpen size={64} aria-hidden="true" />}<span>{story.pages.length} trang</span></button>
          <div className="catalog-book-copy"><p className="catalog-category">{story.category}</p><h3>{story.title}</h3><p>{story.description}</p><button className="parent-text-link" type="button" onClick={() => update("story", story.id)}>Xem truyện & đề xuất <ArrowRight size={18} aria-hidden="true" /></button></div>
        </article>)}</div> : <EmptyState icon={BookOpen} title={stories.length ? "Không tìm thấy truyện phù hợp" : "Thư viện đang chờ những câu chuyện mới"} message={stories.length ? "Thử tên truyện khác hoặc bỏ lọc chủ đề." : "Các truyện đã xuất bản sẽ xuất hiện tại đây."} action={stories.length ? <button className="workspace-button workspace-button-quiet" onClick={() => setParams({})}>Xóa bộ lọc</button> : undefined} />}
      </>}
    </>}
  </div>;
}

function StoryDetail({ story, userId, onBack }) {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [childId, setChildId] = useState("");
  const children = useQuery({ queryKey: queryKeys.children(userId), queryFn: ({ signal }) => childrenService.list({ signal }) });
  const recommendation = useMutation({
    mutationFn: (targetId) => childrenService.recommendStory({ childId: targetId, storyId: story.id }),
    onSuccess: (_, targetId) => queryClient.invalidateQueries({ queryKey: ["child-library", userId, targetId] }),
  });
  const page = story.pages[pageIndex];
  const profiles = children.data?.items || [];
  const recipient = profiles.find((child) => child.id === recommendation.variables);
  return <section className="catalog-detail">
    <button type="button" className="parent-text-link" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Về thư viện truyện</button>
    <div className="catalog-detail-grid"><article className="catalog-reader"><div className="catalog-reader-heading"><p className="catalog-category">{story.category}</p><h2>{story.title}</h2><p>{story.description}</p></div>
      {page ? <><div className="catalog-page">{page.imageUrl && <img src={page.imageUrl} alt={`Minh họa: ${page.title}`} />}<div><h3>{page.title}</h3><p>{page.text}</p></div></div><nav className="catalog-pagination" aria-label="Trang truyện"><button className="icon-button" type="button" aria-label="Trang trước" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}><ArrowLeft size={20} /></button><span aria-live="polite">Trang {pageIndex + 1} / {story.pages.length}</span><button className="icon-button" type="button" aria-label="Trang tiếp theo" disabled={pageIndex === story.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}><ArrowRight size={20} /></button></nav></> : <p>Nội dung xem trước chưa có sẵn.</p>}
    </article><aside className="catalog-recommend"><PaperPlaneTilt size={30} aria-hidden="true" /><h2>Một gợi ý dành cho bé</h2><p>Chọn bé để thêm câu chuyện này vào thư viện riêng. Bé có thể khám phá khi muốn đọc.</p>
      {children.isLoading ? <LoadingState label="Đang tải hồ sơ bé" /> : children.isError ? <ErrorState message={children.error.message} onRetry={() => children.refetch()} /> : profiles.length ? <form onSubmit={(event) => { event.preventDefault(); if (childId) recommendation.mutate(childId); }}><fieldset disabled={recommendation.isPending}><legend>Đề xuất cho</legend>{profiles.map((child) => <label className="catalog-child" key={child.id}><input type="radio" name="recipient" value={child.id} checked={childId === child.id} onChange={() => { setChildId(child.id); recommendation.reset(); }} /><span>{child.displayName}</span></label>)}</fieldset><button type="submit" className="workspace-button" disabled={!childId || recommendation.isPending || recommendation.isSuccess}><PaperPlaneTilt size={18} aria-hidden="true" />{recommendation.isPending ? "Đang gửi…" : recommendation.isSuccess ? "Đã đề xuất" : "Đề xuất cho bé"}</button></form> : <div><p>Thêm hồ sơ bé để gửi đề xuất đầu tiên.</p><Link className="workspace-button" to="/parent/children/new">Thêm hồ sơ bé</Link></div>}
      {recommendation.isError && <p role="alert" className="admin-mutation-error">{recommendation.error.message}</p>}
      {recommendation.isSuccess && <div className="catalog-success" role="status"><CheckCircle size={22} aria-hidden="true" /><p>Đã thêm vào thư viện của {recipient?.displayName}.<Link to={`/parent/children/${recommendation.variables}/library`}>Xem thư viện của bé <ArrowRight size={16} aria-hidden="true" /></Link></p></div>}
    </aside></div>
  </section>;
}
