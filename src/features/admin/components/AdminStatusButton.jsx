import { useRef, useState } from "react";
import { LockKey, LockKeyOpen } from "@phosphor-icons/react";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";

export default function AdminStatusButton({ active, name, disabled, onChange }) {
  const confirm = useConfirmToast();
  const busyRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const action = active ? "Khóa" : "Mở khóa";

  async function handleClick() {
    if (disabled || busyRef.current) return;
    busyRef.current = true;
    setConfirming(true);
    try {
      const approved = await confirm({
        title: `${action} ${name}?`,
        message: active
          ? `Bạn có chắc muốn khóa “${name}”? Mục này sẽ ngừng hoạt động cho đến khi được mở khóa.`
          : `Bạn có muốn mở khóa “${name}” để mục này hoạt động trở lại?`,
        confirmLabel: `Xác nhận ${action.toLowerCase()}`,
        tone: active ? "danger" : "warning",
      });
      if (approved) onChange();
    } finally {
      busyRef.current = false;
      setConfirming(false);
    }
  }

  return (
    <button
      type="button"
      className={`admin-icon-btn ${active ? "" : "is-danger"}`}
      title={`${action} ${name}`}
      aria-label={`${action} ${name}`}
      disabled={disabled || confirming}
      onClick={handleClick}
    >
      {active ? <LockKeyOpen size={18} aria-hidden="true" /> : <LockKey size={18} aria-hidden="true" />}
    </button>
  );
}
