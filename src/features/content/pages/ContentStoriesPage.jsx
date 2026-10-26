import { BookOpen, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { storyContinuePath } from "../utils/editorProgress";
import { featureApiModes } from "../../../lib/api/featureApi";

const PAGE_SIZE = 10;

export default function ContentStoriesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get("search") || "");
  const rawPage = Number(searchParams.get("page"));
  const requestedStatus = searchParams.get("status") || "all";
  const filters = {
    search: searchParams.get("search") || "",
    status: featureApiModes.content === "real" && requestedStatus === "pending" ? "draft" : requestedStatus,
    category: searchParams.get("category") || "all",
    sort: searchParams.get("sort") || "updated_desc",
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    pageSize: PAGE_SIZE,
  };
  const storiesQuery = useQuery({ queryKey: queryKeys.stories(user.id, filters), queryFn: ({ signal }) => contentService.listStories({ ...filters, signal }) });
  const assetsQuery = useQuery({ queryKey: queryKeys.assets(user.id), queryFn: ({ signal }) => contentService.listAssets({ signal }), enabled: featureApiModes.content !== "real" });
  const categoriesQuery = useQuery({ queryKey: queryKeys.contentCategories(user.id), queryFn: ({ signal }) => contentService.listCategories({ signal }), staleTime: 300_000 });
  const assets = assetsQuery.data?.items || [];
  const categories = categoriesQuery.data?.items || [];
  const pageData = storiesQuery.data || { items: [], total: 0, page: filters.page, pageSize: PAGE_SIZE, totalPages: 1 };

  const updateFilter = useCallback((name, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(name);
    else next.set(name, value);
    if (name !== "page") next.delete("page");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const hasActiveFilters = Boolean(filters.search || filters.status !== "all" || filters.category !== "all" || filters.sort !== "updated_desc");
  const resultLabel = "truyện";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearchDraft(filters.search), 0);
    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    if (featureApiModes.content !== "real" || requestedStatus !== "pending") return;
    const next = new URLSearchParams(searchParams);
    next.set("status", "draft");
    setSearchParams(next, { replace: true });
  }, [requestedStatus, searchParams, setSearchParams]);

  useEffect(() => {
    if (searchDraft === filters.search) return undefined;
    const timeoutId = window.setTimeout(() => updateFilter("search", searchDraft), 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchDraft, filters.search, updateFilter]);

  return <div className="workspace-dashboard content-stories-page">
    <div className="workspace-page-heading"><div><p className="workspace-eyebrow">NỘI DUNG / KHO TRUYỆN</p><h1>Kho truyện</h1><p>Quản lý bản nháp, ảnh bìa và các phiên bản trước khi chỉnh sửa.</p></div><Link className="workspace-button" to="/content/stories/new"><Plus size={18} aria-hidden="true" /> Tạo truyện</Link></div>
    <section className="admin-filter-panel content-filter-panel" aria-labelledby="story-filter-title">
      <div className="content-filter-heading"><div className="admin-filter-title"><MagnifyingGlass size={18} aria-hidden="true" /><strong id="story-filter-title">Tìm kiếm</strong></div>{hasActiveFilters && <Link className="content-filter-clear" to="/content/stories" replace><X size={15} aria-hidden="true" /> Xóa bộ lọc</Link>}</div>
      <div className="admin-filter-fields">
        <label className="admin-search"><span className="sr-only">Tìm truyện</span><MagnifyingGlass size={18} aria-hidden="true" /><input type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Tìm theo tên hoặc mô tả" /></label>
        <label><span className="sr-only">Lọc trạng thái</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option>{featureApiModes.content !== "real" && <option value="pending">Chờ duyệt</option>}<option value="published">Đã xuất bản</option>{featureApiModes.content !== "real" && <option value="hidden">Đã ẩn</option>}<option value="archived">Đã lưu trữ</option>{featureApiModes.content === "real" && <option value="unknown">Chưa xác định</option>}</select></label>
        <label><span className="sr-only">Lọc danh mục</span><select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} disabled={categoriesQuery.isLoading}><option value="all">Tất cả danh mục</option>{categories.map((category) => <option key={category.id || category} value={category.id || category}>{category.label || category}</option>)}</select></label>
        <label><span className="sr-only">Sắp xếp</span><select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="updated_desc">Mới cập nhật</option><option value="title_asc">Tên A → Z</option><option value="title_desc">Tên Z → A</option><option value="status_asc">Trạng thái</option></select></label>
      </div>
    </section>
    {storiesQuery.isLoading ? <LoadingState label="Đang tải truyện" /> : storiesQuery.isError ? <ErrorState message={storiesQuery.error.message} onRetry={() => storiesQuery.refetch()} /> : pageData.items.length ? <><div className="content-results-bar" aria-live="polite"><span><strong>{new Intl.NumberFormat("vi-VN").format(pageData.total)}</strong> {resultLabel}</span>{hasActiveFilters && <span className="content-results-filtered">Đang hiển thị theo bộ lọc</span>}</div><div className="content-story-list" aria-label="Danh sách truyện">{pageData.items.map((story) => <StoryListItem key={story.id} story={story} category={categories.find((item) => item.id === story.categoryId)?.label} asset={assets.find((item) => item.id === story.coverAssetId)} />)}</div><StoryPagination page={pageData.page} totalPages={pageData.totalPages} total={pageData.total} onPageChange={(page) => updateFilter("page", String(page))} /></> : <EmptyState icon={BookOpen} title={hasActiveFilters ? "Không tìm thấy truyện" : "Chưa có truyện nào"} message={hasActiveFilters ? "Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm truyện." : "Tạo một bản nháp để bắt đầu xây dựng nội dung."} action={hasActiveFilters ? <Link className="workspace-button workspace-button-quiet" to="/content/stories" replace><X size={17} aria-hidden="true" /> Xóa bộ lọc</Link> : <Link className="workspace-button" to="/content/stories/new"><Plus size={17} aria-hidden="true" /> Tạo truyện</Link>} />}
  </div>;
}

function StoryPagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;
  return <nav className="content-pagination" aria-label="Phân trang truyện"><span>{new Intl.NumberFormat("vi-VN").format(total)} truyện</span><div><button type="button" className="workspace-button workspace-button-quiet" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Trước</button><strong aria-current="page">Trang {page} / {totalPages}</strong><button type="button" className="workspace-button workspace-button-quiet" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Sau</button></div></nav>;
}

function StoryListItem({ story, category, asset }) {
  const statusTone = story.status === "published" ? "success" : story.status === "hidden" ? "danger" : story.status === "unknown" ? "neutral" : "gold";
  const pagesCountValue = Number(story.pagesCount);
  const pagesCount = Number.isFinite(pagesCountValue) ? pagesCountValue : 0;
  const updatedLabel = formatStoryDate(story.updatedAt);
  const coverUrl = story.coverImageUrl || asset?.url;
  const [failedCoverUrl, setFailedCoverUrl] = useState("");
  const coverFailed = Boolean(coverUrl) && failedCoverUrl === coverUrl;
  return <article className="content-story-item" aria-labelledby={`story-title-${story.id}`}><div className={`content-story-cover${coverUrl && !coverFailed ? "" : " content-story-cover-missing"}`}>{coverUrl && !coverFailed ? <img src={coverUrl} alt={`${story.title} ảnh bìa`} width="94" height="72" loading="lazy" decoding="async" onError={() => setFailedCoverUrl(coverUrl)} /> : <span aria-label={coverFailed ? "Không tải được ảnh bìa" : "Chưa có ảnh bìa"}>{coverFailed ? "Không tải được ảnh bìa" : "Chưa có ảnh bìa"}</span>}</div><div className="content-story-copy"><div><StatusBadge value={story.status} tone={statusTone} /><span className="content-story-category">{category || story.category || "Chưa phân loại"}</span>{story.draftDirty && <span className="content-story-dirty">Có thay đổi chưa xuất bản</span>}</div><h2 id={`story-title-${story.id}`}>{story.title}</h2><p>{story.description || "Chưa có mô tả ngắn."}</p><small>{pagesCount} trang · cập nhật {updatedLabel}</small></div><div className="content-story-actions"><Link className="workspace-button workspace-button-quiet" to={storyContinuePath(story.id)}>Chỉnh sửa <span className="sr-only">{story.title}</span></Link><Link className="workspace-button" to={`/content/stories/${story.id}`}>Quản lý truyện <span className="sr-only">{story.title}</span></Link></div></article>;
}

function formatStoryDate(value) {
  if (!value) return "chưa rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "chưa rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
