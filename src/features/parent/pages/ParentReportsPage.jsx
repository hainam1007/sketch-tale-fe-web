import { CheckCircle, Gear, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";

export default function ParentReportsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(null);
  const reportQuery = useQuery({
    queryKey: queryKeys.familyReport(user.id),
    queryFn: ({ signal }) => childrenService.familyReport({ signal }),
  });
  const reportMutation = useMutation({
    mutationFn: (payload) => childrenService.updateFamilyReportSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.familyReport(user.id), data);
      setMessage({ type: "success", text: "Đã lưu cài đặt báo cáo. Việc tạo và gửi email do backend quản lý." });
    },
    onError: (error) => setMessage({ type: "error", text: error.message }),
  });

  if (reportQuery.isLoading) return <LoadingState label="Đang tải báo cáo Family" />;
  if (reportQuery.isError) return <ErrorState title="Không thể tải báo cáo" message={reportQuery.error.message} onRetry={() => reportQuery.refetch()} />;
  const report = reportQuery.data;
  const settings = report.settings || { enabled: false, schedule: "monthly", revision: 1 };

  function save(event) {
    event.preventDefault();
    reportMutation.mutate({ enabled: event.currentTarget.enabled.checked, schedule: "monthly", revision: settings.revision });
  }

  return <div className="parent-page family-report-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">PHỤ HUYNH / BÁO CÁO FAMILY</p><h1>Báo cáo học tập của gia đình</h1><p>Cấu hình báo cáo ở cấp tài khoản. Dashboard của từng bé vẫn nằm trong hồ sơ riêng.</p></div><span className="parent-feature-icon"><Gear size={29} aria-hidden="true" /></span></div><section className="family-report-card" aria-labelledby="family-report-title"><div className="export-section-heading"><span className="export-section-icon export-section-icon-dark"><Gear size={20} aria-hidden="true" /></span><div><p className="workspace-eyebrow">CẤU HÌNH CẤP TÀI KHOẢN</p><h2 id="family-report-title">Báo cáo học tập Family</h2></div></div>{!report.available ? <div className="report-unavailable"><StatusBadge value="unavailable" tone="neutral" /><p>{report.reason}</p><small>Chức năng chỉ xuất hiện khi gói và dịch vụ hỗ trợ.</small></div> : <><div className="report-ready-line"><StatusBadge value={report.status} tone="success" /><span>Trạng thái do dịch vụ báo cáo trả về.</span></div><p className="export-muted-copy">Báo cáo được tạo và gửi theo lịch bởi backend. Giao diện chỉ lưu lựa chọn của tài khoản.</p><form className="report-settings-form" onSubmit={save}><label className="report-toggle"><input name="enabled" type="checkbox" defaultChecked={settings.enabled} /> <span>Bật báo cáo định kỳ hàng tháng</span></label>{message && <div className={message.type === "error" ? "export-alert" : "export-success"} role={message.type === "error" ? "alert" : "status"}>{message.type === "error" ? <WarningCircle size={17} aria-hidden="true" /> : <CheckCircle size={17} aria-hidden="true" />}<span>{message.text}</span></div>}<button className="workspace-button" type="submit" disabled={reportMutation.isPending}>{reportMutation.isPending ? "Đang lưu…" : "Lưu cài đặt"}</button></form>{report.lastReport && <div className="report-last"><span><CheckCircle size={17} aria-hidden="true" /><strong>Bản gần nhất: {report.lastReport.period}</strong></span><small>{report.lastReport.fileName} · tạo bởi backend</small></div>}</>}</section></div>;
}
