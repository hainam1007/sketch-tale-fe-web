import { ArrowClockwise, CheckCircle, Info, SpinnerGap, WarningCircle } from "@phosphor-icons/react";

export function LoadingState({ label = "Đang tải dữ liệu", fullPage = false }) {
  return (
    <div className={`workspace-state loading-state ${fullPage ? "workspace-state-full" : ""}`} role="status" aria-live="polite">
      <SpinnerGap className="workspace-spinner" size={25} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Không thể tải dữ liệu", message, onRetry }) {
  return (
    <div className="workspace-state workspace-state-error" role="alert">
      <WarningCircle size={27} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{message || "Vui lòng thử lại sau ít phút."}</p>
        {onRetry && (
          <button className="workspace-button workspace-button-quiet" type="button" onClick={onRetry}>
            <ArrowClockwise size={17} aria-hidden="true" /> Thử lại
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = Info, title, message, action }) {
  const Icon = icon;
  return (
    <div className="workspace-state workspace-state-empty">
      <Icon size={29} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function SuccessState({ children }) {
  return (
    <p className="workspace-inline-success" role="status">
      <CheckCircle size={18} aria-hidden="true" /> {children}
    </p>
  );
}

export function ForbiddenState({ message = "Bạn không có quyền xem dữ liệu này." }) {
  return (
    <div className="workspace-state workspace-state-error" role="alert">
      <WarningCircle size={27} aria-hidden="true" />
      <div>
        <strong>Không thể truy cập</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
