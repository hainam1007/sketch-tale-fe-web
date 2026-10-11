import { ArrowRight, BookOpen, ChartLineUp, Clock, Package, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { storyContinuePath } from "../utils/editorProgress";

export default function ContentOverviewPage() {
  const { user } = useAuth();
  const storiesQuery = useQuery({
    queryKey: queryKeys.stories(user.id, { search: "", status: "all", category: "all", sort: "updated_desc", page: 1, pageSize: 5 }),
    queryFn: ({ signal }) => contentService.listStories({ page: 1, pageSize: 5, sort: "updated_desc", signal }),
  });
  const draftsQuery = useQuery({
    queryKey: queryKeys.stories(user.id, { search: "", status: "draft", category: "all", sort: "updated_desc", page: 1, pageSize: 1 }),
    queryFn: ({ signal }) => contentService.listStories({ page: 1, pageSize: 1, status: "draft", sort: "updated_desc", signal }),
  });

  if (storiesQuery.isLoading || draftsQuery.isLoading) return <LoadingState label="Đang tải tổng quan nội dung" />;
  if (storiesQuery.isError) return <ErrorState title="Không thể tải tổng quan" message={storiesQuery.error.message} onRetry={() => storiesQuery.refetch()} />;

  const stories = storiesQuery.data?.items || [];
  const recentDrafts = stories.filter((story) => story.status === "draft");
  const drafts = draftsQuery.isError ? recentDrafts : (draftsQuery.data?.items || []);
  const published = stories.filter((story) => story.status === "published");
  const activeDraft = drafts[0];

  return (
    <div className="workspace-dashboard content-overview-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">CONTENT MANAGER</p>
          <h1>Tổng quan nội dung</h1>
          <p>Tiếp tục bản nháp gần nhất hoặc bắt đầu một câu chuyện mới.</p>
        </div>
        <Link className="workspace-button" to="/content/stories/new"><Plus size={18} aria-hidden="true" /> Tạo truyện</Link>
      </header>

      <section className="content-overview-hero" aria-labelledby="content-overview-hero-title">
        <div>
          <span className="content-overview-kicker"><Clock size={15} aria-hidden="true" /> Không gian biên tập</span>
          <h2 id="content-overview-hero-title">{activeDraft ? activeDraft.title : "Bắt đầu bản nháp đầu tiên"}</h2>
          <p>{activeDraft?.description || "Tạo một bản nháp rồi tiếp tục xây dựng trang, vai, từ vựng và câu hỏi trong cùng một workspace."}</p>
          <div className="content-overview-actions">
            <Link className="workspace-button" to={drafts[0] ? storyContinuePath(drafts[0].id) : "/content/stories/new"}>{drafts[0] ? "Tiếp tục bản nháp" : "Tạo bản nháp đầu tiên"} <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="workspace-text-link" to="/content/stories">Mở kho truyện <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="content-overview-stats" aria-label="Tóm tắt nội dung">
        <OverviewStat icon={BookOpen} label="Bản nháp gần nhất" value={drafts.length ? "Có" : "Chưa có"} note={draftsQuery.isError ? "Không thể kiểm tra toàn bộ bản nháp" : "Tìm trong toàn bộ kho truyện"} />
        <OverviewStat icon={ChartLineUp} label="Đã publish" value={published.length} note="trong 5 story mới nhất" />
      </section>

      <nav className="content-overview-shortcuts" aria-label="Lối tắt nội dung">
        <Link className="content-overview-shortcut" to="/content/assets"><span className="content-overview-stat-icon"><Package size={19} aria-hidden="true" /></span><span><strong>Kho tư liệu</strong><small>Ảnh dùng chung cho story</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
        <Link className="content-overview-shortcut" to="/content/statistics"><span className="content-overview-stat-icon"><ChartLineUp size={19} aria-hidden="true" /></span><span><strong>Hiệu quả nội dung</strong><small>Lượt đọc và hoàn thành</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
      </nav>

      <section className="content-overview-section" aria-labelledby="content-recent-title">
        <div className="content-overview-section-heading"><div><p className="workspace-eyebrow">TIẾP TỤC BIÊN TẬP</p><h2 id="content-recent-title">Story cập nhật gần đây</h2></div><Link className="workspace-text-link" to="/content/stories">Xem tất cả <ArrowRight size={15} aria-hidden="true" /></Link></div>
        {stories.length ? <div className="content-overview-story-list">{stories.map((story) => <OverviewStory key={story.id} story={story} />)}</div> : <EmptyState icon={BookOpen} title="Chưa có story nào" message="Tạo một bản nháp để bắt đầu xây dựng câu chuyện đầu tiên." action={<Link className="workspace-button" to="/content/stories/new"><Plus size={17} aria-hidden="true" /> Tạo truyện</Link>} />}
      </section>
    </div>
  );
}

function OverviewStat({ icon: Icon, label, value, note }) {
  return <article className="content-overview-stat"><span className="content-overview-stat-icon"><Icon size={19} aria-hidden="true" /></span><span className="content-overview-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function OverviewStory({ story }) {
  const tone = story.status === "published" ? "success" : story.status === "hidden" ? "danger" : "gold";
  return <article className="content-overview-story"><div className="content-overview-story-mark"><BookOpen size={19} aria-hidden="true" /></div><div className="content-overview-story-copy"><div><StatusBadge value={story.status} tone={tone} /><span>{story.category || "Chưa phân loại"}</span></div><h3>{story.title}</h3><p>{story.description || "Chưa có mô tả ngắn."}</p></div><Link className="icon-button" to={storyContinuePath(story.id)} aria-label={`Tiếp tục sửa ${story.title}`}><ArrowRight size={17} aria-hidden="true" /></Link></article>;
}
