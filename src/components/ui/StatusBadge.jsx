const labels = {
  Free: "Free",
  Pro: "Pro",
  Family: "Family",
  draft: "Bản nháp",
  published: "Đã publish",
  hidden: "Đã ẩn",
  active: "Đang hoạt động",
  disabled: "Đã tắt",
  locked: "Đang khóa",
  ready: "Sẵn sàng",
  processing: "Đang chạy",
  failed: "Thất bại",
  completed: "Hoàn tất",
  queued: "Đang chờ",
  expired: "Đã hết hạn",
  unavailable: "Chưa khả dụng",
  cancelled: "Đã hủy",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  open: "Mở",
  under_review: "Đang xem xét",
  resolved: "Đã giải quyết",
};

export default function StatusBadge({ value, tone = "neutral", label }) {
  return <span className={`workspace-badge workspace-badge-${tone}`}>{label || labels[value] || value}</span>;
}
