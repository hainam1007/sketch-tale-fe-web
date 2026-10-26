import { BookOpen, ChartLineUp, Clock, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const ranges = [["7d", "7 ngày gần đây"], ["30d", "30 ngày gần đây"]];

export default function AdminStatisticsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRange = searchParams.get("range");
  const range = ranges.some(([value]) => value === requestedRange) ? requestedRange : "7d";
  const statisticsQuery = useQuery({ queryKey: queryKeys.adminStatistics(user.id, range), queryFn: ({ signal }) => adminService.getStatistics({ range, signal }) });

  if (statisticsQuery.isLoading) return <LoadingState label="Đang tải số liệu vận hành" />;
  if (statisticsQuery.isError) return <ErrorState title="Không thể tải số liệu vận hành" message={statisticsQuery.error.message} onRetry={() => statisticsQuery.refetch()} />;
  const data = statisticsQuery.data;

  const summary = data.summary || {};
  const trend = Array.isArray(data.trend) ? data.trend : [];
  return <div className="workspace-dashboard statistics-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / STATISTICS</p><h1>Số liệu vận hành</h1><p>Snapshot aggregate theo khoảng thời gian; “đang hoạt động” mô tả trạng thái tài khoản, không phải DAU/MAU.</p></div><label className="data-range-control"><span>Khoảng thời gian</span><select id="admin-statistics-range" aria-label="Khoảng thời gian số liệu vận hành" value={range} onChange={(event) => setSearchParams({ range: event.target.value })}>{ranges.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="workspace-stat-grid"><StatCard icon={UsersThree} label="Tài khoản đang hoạt động" value={summary.activeUsers} suffix="tài khoản" /><StatCard icon={UsersThree} label="Tài khoản bị khóa" value={summary.lockedUsers} suffix="tài khoản" /><StatCard icon={BookOpen} label="Nhân vật" value={summary.characters} suffix="nhân vật" /><StatCard icon={Clock} label="Thời gian đọc" value={summary.readingMinutes} suffix="phút" /></div>{data.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}<section className="analytics-card"><div className="analytics-card-heading"><div><p className="workspace-eyebrow">TỔNG HỢP THEO MỐC</p><h2>Tracking đã nhận</h2></div><ChartLineUp size={27} aria-hidden="true" /></div>{trend.length ? <div className="analytics-table-wrap"><table className="analytics-table"><caption className="sr-only">Số liệu vận hành theo mốc thời gian</caption><thead><tr><th>Mốc</th><th>Tài khoản hoạt động</th><th>Nhân vật</th><th>Phút đọc</th></tr></thead><tbody>{trend.map((item, index) => <tr key={`${item.label || "bucket"}-${index}`}><th scope="row">{item.label || "Chưa xác định"}</th><td>{formatMetric(item.users)}</td><td>{formatMetric(item.characters)}</td><td>{formatMetric(item.readingMinutes)}</td></tr>)}</tbody></table></div> : <div className="workspace-state workspace-state-empty"><ChartLineUp size={27} aria-hidden="true" /><strong>Chưa có chuỗi dữ liệu</strong><p>Không có bucket thời gian để hiển thị cho khoảng đã chọn.</p></div>}</section></div>;
}

function StatCard({ icon: Icon, label, value, suffix }) {
  return <article className="workspace-stat-card"><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{formatMetric(value)}</strong><small>{suffix}</small></article>;
}

function formatMetric(value) {
  return value === null || value === undefined || value === "" ? "Chưa có dữ liệu" : typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("vi-VN").format(value) : String(value);
}
