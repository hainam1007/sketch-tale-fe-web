import { BookOpen, ChartLineUp, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { contentService } from "../services/contentService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

const ranges = [["7d", "7 ngày gần đây"], ["30d", "30 ngày gần đây"]];

export default function ContentStatisticsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawRange = searchParams.get("range") || "7d";
  const range = ranges.some(([value]) => value === rawRange) ? rawRange : "7d";
  const statisticsQuery = useQuery({ queryKey: queryKeys.contentStatistics(user.id, range), queryFn: ({ signal }) => contentService.getStatistics({ range, signal }) });

  if (statisticsQuery.isLoading) return <LoadingState label="Đang tải hiệu quả nội dung" />;
  if (statisticsQuery.isError) return <ErrorState title="Không thể tải hiệu quả nội dung" message={statisticsQuery.error.message} onRetry={() => statisticsQuery.refetch()} />;
  const data = statisticsQuery.data || {};
  const summary = data.summary || {};
  const trend = Array.isArray(data.trend) ? data.trend : [];
  const topStories = Array.isArray(data.topStories) ? data.topStories : [];
  const maxReads = Math.max(...trend.map((item) => Number(item.reads) || 0), 1);

  return <div className="workspace-dashboard statistics-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">CONTENT / STATISTICS</p><h1>Hiệu quả nội dung</h1><p>Số liệu đọc và hoàn thành theo khoảng thời gian, với đơn vị và mẫu số do Backend định nghĩa.</p></div><label className="data-range-control"><span>Khoảng thời gian</span><select id="content-statistics-range" aria-label="Khoảng thời gian hiệu quả nội dung" value={range} onChange={(event) => setSearchParams({ range: event.target.value })}>{ranges.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="workspace-stat-grid"><StatCard icon={BookOpen} label="Story đã publish" value={metric(summary.publishedStories)} suffix="story" /><StatCard icon={BookOpen} label="Draft đang giữ" value={metric(summary.draftStories)} suffix="draft" /><StatCard icon={ChartLineUp} label="Lượt đọc" value={metric(summary.totalReads)} suffix="lượt" /><StatCard icon={UsersThree} label="Người đọc hoạt động" value={metric(summary.activeReaders)} suffix="người" /></div>{data.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}<div className="analytics-two-column"><section className="analytics-card"><div className="analytics-card-heading"><div><p className="workspace-eyebrow">TRUYỆN ĐƯỢC ĐỌC NHIỀU</p><h2>Top story</h2></div><span className="analytics-card-note">Hoàn thành {rate(summary.completionRate)}</span></div>{topStories.length ? <div className="analytics-story-list">{topStories.map((story) => <article className="analytics-story-item" key={story.id}><div><strong>{story.title}</strong><span>{metric(story.reads)} lượt đọc · {rate(story.completionRate)} hoàn thành</span></div><StatusBadge value={story.status} tone="success" /></article>)}</div> : <div className="analytics-empty">Chưa có dữ liệu truyện trong khoảng này.</div>}</section><section className="analytics-card"><div className="analytics-card-heading"><div><p className="workspace-eyebrow">NHỊP ĐỌC</p><h2>Xu hướng theo ngày</h2></div><span className="analytics-card-note">{trend.length ? `${trend.length} ngày` : "Chưa có dữ liệu"}</span></div>{trend.length ? <div className="analytics-bar-list">{trend.map((item) => { const reads = Number(item.reads) || 0; return <div className="analytics-bar-row" key={item.label}><span>{item.label}</span><div><i style={{ width: `${reads / maxReads * 100}%` }} /></div><strong>{reads}</strong></div>; })}</div> : <div className="analytics-empty">Chưa có lượt đọc trong khoảng này.</div>}</section></div></div>;
}

function metric(value) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("vi-VN").format(value);
}

function rate(value) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function StatCard({ icon: Icon, label, value, suffix }) {
  return <article className="workspace-stat-card"><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{value}</strong><small>{suffix}</small></article>;
}
