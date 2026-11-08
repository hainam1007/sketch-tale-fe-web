import { X } from "@phosphor-icons/react";

export default function DismissButton({ onClick, label = "Đóng thông báo" }) {
  return (
    <button
      className="workspace-alert-dismiss"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}
