import { BookOpen, ChartLineUp, Clock, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const ranges = [["7d", "7 ngày gần đây"], ["30d", "30 ngày gần đây"]];

export default function AdminStatisticsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") || "7d";
  const statisticsQuery = useQuery({ queryKey: queryKeys.adminStatistics(user.id, range), queryFn: ({ signal }) => adminService.getStatistics({ range, signal }) });

  if (statisticsQuery.isLoading) return <LoadingState label="Đang tải số liệu vận hành" />;
  if (statisticsQuery.isError) return <ErrorState title="Không thể tải số liệu vận hành" message={statisticsQuery.error.message} onRetry={() => statisticsQuery.refetch()} />;
  const data = statisticsQuery.data;

  return <div className="workspace-dashboard statistics-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / STATISTICS</p><h1>Số liệu vận hành</h1><p>Users, characters và thời gian đọc được aggregate ở server theo khoảng thời gian đã chọn.</p></div><label className="data-range-control"><span>Khoảng thời gian</span><select id="admin-statistics-range" aria-label="Khoảng thời gian số liệu vận hành" value={range} onChange={(event) => setSearchParams({ range: event.target.value })}>{ranges.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="workspace-stat-grid"><StatCard icon={UsersThree} label="User hoạt động" value={data.summary.activeUsers} suffix="user" /><StatCard icon={UsersThree} label="User bị khóa" value={data.summary.lockedUsers} suffix="user" /><StatCard icon={BookOpen} label="Nhân vật" value={data.summary.characters} suffix="nhân vật" /><StatCard icon={Clock} label="Thời gian đọc" value={data.summary.readingMinutes} suffix="phút" /></div>{data.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}<section className="analytics-card"><div className="analytics-card-heading"><div><p className="workspace-eyebrow">TỔNG HỢP THEO MỐC</p><h2>Tracking đã nhận</h2></div><ChartLineUp size={27} aria-hidden="true" /></div><div className="analytics-table-wrap"><table className="analytics-table"><caption className="sr-only">Số liệu vận hành theo mốc thời gian</caption><thead><tr><th>Mốc</th><th>User</th><th>Nhân vật</th><th>Phút đọc</th></tr></thead><tbody>{data.trend.map((item) => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.users}</td><td>{item.characters}</td><td>{item.readingMinutes}</td></tr>)}</tbody></table></div></section></div>;
}

function StatCard({ icon: Icon, label, value, suffix }) {
  return <article className="workspace-stat-card"><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{value}</strong><small>{suffix}</small></article>;
}
