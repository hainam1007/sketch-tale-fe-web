import { useState } from "react";
import { ArrowRight, BookOpen, ChartLineUp, CheckCircle, Clock, MagnifyingGlass, Package, PencilSimple, Plus } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import StatusBadge from "../../../components/ui/StatusBadge";
import { storyContinuePath } from "../utils/editorProgress";

const views = [
  { status: "all", label: "Tất cả", icon: BookOpen },
  { status: "draft", label: "Bản nháp", icon: PencilSimple },
  { status: "published", label: "Đã xuất bản", icon: CheckCircle },
];
const number = new Intl.NumberFormat("vi-VN");

export default function ContentOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const storyQueries = useQueries({ queries: views.map(({ status }) => {
    const filters = { search: "", status, category: "all", sort: "updated_desc", page: 1, pageSize: 5 };
    return { queryKey: queryKeys.stories(user.id, filters), queryFn: ({ signal }) => contentService.listStories({ ...filters, signal }) };
  }) });
  const categoriesQuery = useQuery({ queryKey: queryKeys.contentCategories(user.id), queryFn: ({ signal }) => contentService.listCategories({ signal }), staleTime: 300_000 });
  const statisticsQuery = useQuery({ queryKey: queryKeys.contentStatistics(user.id, "7d"), queryFn: ({ signal }) => contentService.getStatistics({ range: "7d", signal }) });
  const selectedQuery = storyQueries[views.findIndex((item) => item.status === view)];
  const draftQuery = storyQueries[1];
  const activeDraft = draftQuery.data?.items?.[0];
  const stories = selectedQuery.data?.items || [];
  const categories = categoriesQuery.data?.items || [];
  const libraryPath = view === "all" ? "/content/stories" : `/content/stories?status=${view}`;

  function findStory(event) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/content/stories?search=${encodeURIComponent(term)}` : "/content/stories");
  }

  return (
    <div className="workspace-dashboard cm-home">
      <header className="workspace-page-heading cm-home-heading">
        <div><p className="workspace-eyebrow">KHÔNG GIAN NỘI DUNG</p><h1>Tổng quan</h1><p>Truyện của bạn, công việc đang làm và hiệu quả nội dung.</p></div>
        <Link className="workspace-button" to="/content/stories/new"><Plus size={18} aria-hidden="true" /> Tạo truyện</Link>
      </header>

      <section className="cm-home-metrics" aria-label="Số lượng truyện trong toàn bộ kho">
        {views.map(({ status, label, icon: Icon }, index) => {
          const query = storyQueries[index];
          return <Link key={status} className={`cm-home-metric cm-home-metric-${status}`} to={status === "all" ? "/content/stories" : `/content/stories?status=${status}`}>
            <span className="cm-home-metric-label"><Icon size={20} aria-hidden="true" />{status === "all" ? "Tổng số truyện" : label}<ArrowRight size={16} aria-hidden="true" /></span>
            <strong>{query.isLoading ? "…" : query.isError ? "—" : metric(query.data?.total)}</strong>
            <small>{query.isError ? "Chưa tải được số liệu" : status === "all" ? "Trong toàn bộ kho truyện" : status === "draft" ? "Tiếp tục biên tập" : "Quản lý truyện đã xuất bản"}</small>
          </Link>;
        })}
      </section>

      <div className="cm-home-columns">
        <section className="cm-home-recent" aria-labelledby="cm-recent-title">
          <div className="cm-home-section-heading"><div><h2 id="cm-recent-title">Truyện gần đây</h2><p>Cập nhật mới nhất</p></div><Link className="workspace-text-link" to={libraryPath}>Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <form className="cm-home-search" role="search" onSubmit={findStory}>
            <MagnifyingGlass size={20} aria-hidden="true" /><label className="sr-only" htmlFor="cm-find-story">Tìm truyện trong kho</label>
            <input id="cm-find-story" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm truyện theo tên hoặc mô tả…" />
            <button type="submit" aria-label="Tìm truyện"><ArrowRight size={19} aria-hidden="true" /></button>
          </form>
          <div className="cm-home-filters" role="group" aria-label="Lọc truyện gần đây">
            {views.map(({ status, label }, index) => <button key={status} type="button" aria-pressed={view === status} onClick={() => setView(status)}>{label}<span>{storyQueries[index].isError ? "—" : metric(storyQueries[index].data?.total)}</span></button>)}
          </div>
          <div className="cm-home-rows" aria-live="polite" aria-busy={selectedQuery.isLoading}>
            {selectedQuery.isLoading ? <p className="cm-home-empty">Đang tải truyện…</p> : selectedQuery.isError ? <QueryError onRetry={() => selectedQuery.refetch()} /> : stories.length ? stories.map((story) => <RecentStory key={story.id} story={story} category={categories.find((item) => item.id === story.categoryId)?.label} />) : <div className="cm-home-empty"><BookOpen size={32} aria-hidden="true" /><h3>{view === "draft" ? "Chưa có bản nháp" : view === "published" ? "Chưa có truyện xuất bản" : "Câu chuyện đầu tiên bắt đầu từ đây"}</h3><p>{view === "published" ? "Hoàn thiện bản nháp để sẵn sàng xuất bản." : "Bắt đầu một câu chuyện mới khi bạn có ý tưởng."}</p><Link className="workspace-button workspace-button-quiet" to={view === "published" ? "/content/stories?status=draft" : "/content/stories/new"}>{view === "published" ? "Mở bản nháp" : "Tạo truyện"}<ArrowRight size={16} aria-hidden="true" /></Link></div>}
          </div>
          {stories.length > 0 && !selectedQuery.isError && <div className="cm-home-list-footer">{stories.length} truyện cập nhật gần nhất <Link to={libraryPath}>Mở kho truyện <ArrowRight size={14} aria-hidden="true" /></Link></div>}
        </section>

        <aside className="cm-home-aside" aria-label="Công việc và hiệu quả">
          <section className="cm-home-resume" aria-labelledby="cm-resume-title">
            <div className="cm-home-side-title"><Clock size={19} aria-hidden="true" /><h2 id="cm-resume-title">Tiếp tục công việc</h2></div>
            {draftQuery.isLoading ? <p role="status">Đang tải bản nháp…</p> : draftQuery.isError ? <QueryError onRetry={() => draftQuery.refetch()} /> : activeDraft ? <>
              <span className="cm-home-caption">Bản nháp cập nhật gần nhất</span><h3>{activeDraft.title}</h3>
              <p>{activeDraft.pagesCount || 0} trang · {formatDate(activeDraft.updatedAt)}</p>
              {activeDraft.draftDirty && <p className="cm-home-dirty">Có thay đổi chưa xuất bản</p>}
              <Link className="workspace-button" to={storyContinuePath(activeDraft.id)}>Tiếp tục biên tập <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className="cm-home-secondary" to={`/content/stories/${activeDraft.id}`}>Quản lý nội dung truyện</Link>
            </> : <><h3>Không có bản nháp đang làm</h3><p>Bạn có thể bắt đầu truyện mới hoặc chỉnh sửa truyện trong kho.</p><Link className="workspace-text-link" to="/content/stories/new">Tạo bản nháp <ArrowRight size={16} aria-hidden="true" /></Link></>}
          </section>
          <Performance query={statisticsQuery} />
          <Link className="cm-home-assets" to="/content/assets"><Package size={25} aria-hidden="true" /><span><strong>Kho tài sản</strong><small>Nhân vật, ảnh nền và hình ảnh phụ</small></span><ArrowRight size={18} aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}

function RecentStory({ story, category }) {
  const [failedUrl, setFailedUrl] = useState("");
  const cover = story.coverImageUrl;
  return <article className="cm-home-story">
    <span className="cm-home-cover">{cover && cover !== failedUrl ? <img src={cover} alt="" loading="lazy" onError={() => setFailedUrl(cover)} /> : <BookOpen size={25} aria-hidden="true" />}</span>
    <div className="cm-home-story-copy"><div className="cm-home-story-badges"><StatusBadge value={story.status} tone={story.status === "published" ? "success" : story.status === "hidden" ? "danger" : "gold"} /><span>{category || story.category || "Chưa phân loại"}</span></div>
      <h3><Link to={storyContinuePath(story.id)}>{story.title}</Link></h3>
      <p>{story.pagesCount || 0} trang <span aria-hidden="true">·</span> {formatDate(story.updatedAt)}</p>
      {story.draftDirty && <small className="cm-home-dirty">Có thay đổi chưa xuất bản</small>}
    </div>
    <Link className="cm-home-edit" to={storyContinuePath(story.id)} aria-label={`Chỉnh sửa ${story.title}`}><PencilSimple size={17} aria-hidden="true" /><span>Chỉnh sửa</span></Link>
  </article>;
}

function Performance({ query }) {
  const summary = query.data?.summary || {};
  const hasReads = summary.totalReads !== undefined && summary.totalReads !== null;
  const hasRate = summary.completionRate !== undefined && summary.completionRate !== null;
  const topStory = query.data?.topStories?.[0];
  return <section className="cm-home-performance" aria-labelledby="cm-performance-title">
    <div className="cm-home-side-title"><ChartLineUp size={19} aria-hidden="true" /><h2 id="cm-performance-title">Hiệu quả nội dung</h2></div>
    <span className="cm-home-caption">7 ngày gần đây</span>
    {query.isLoading ? <p role="status">Đang tải số liệu…</p> : query.isError ? <QueryError onRetry={() => query.refetch()} /> : <>
      <dl><div><dt>Lượt đọc</dt><dd>{metric(summary.totalReads)}</dd></div><div><dt>Hoàn thành</dt><dd>{hasRate ? `${metric(summary.completionRate)}%` : "—"}</dd></div></dl>
      {(!hasReads || !hasRate || query.data?.errors?.length > 0) && <p className="cm-home-analytics-note">{!hasReads && !hasRate ? "Số liệu đọc và hoàn thành hiện chưa khả dụng." : "Một số số liệu hiện chưa khả dụng."}</p>}
      {topStory && <Link className="cm-home-top-story" to={`/content/stories/${topStory.id}`}><small>Được đọc nhiều nhất</small><strong>{topStory.title}</strong><span>{metric(topStory.reads)} lượt đọc <ArrowRight size={14} aria-hidden="true" /></span></Link>}
    </>}
    <Link className="workspace-text-link" to="/content/statistics?range=7d">Xem hiệu quả <ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
}

function QueryError({ onRetry }) {
  return <div className="cm-home-query-error" role="status"><p>Chưa tải được dữ liệu.</p><button type="button" className="workspace-text-link" onClick={onRetry}>Thử lại</button></div>;
}

function metric(value) {
  return value === null || value === undefined ? "—" : number.format(value);
}

function formatDate(value) {
  const date = new Date(value);
  return !value || !Number.isFinite(date.getTime()) ? "Chưa rõ ngày cập nhật" : `Cập nhật ${new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", year: "numeric" }).format(date)}`;
}
