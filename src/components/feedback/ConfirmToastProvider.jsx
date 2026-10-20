import { useCallback, useEffect, useId, useRef, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import ConfirmToastContext from "./ConfirmToastContext";

export default function ConfirmToastProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const dialogId = useId();

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolverRef.current?.(false);
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    resolverRef.current = resolve;
    setRequest({
      title: options.title || "Xác nhận thao tác",
      message: options.message || "Bạn có muốn tiếp tục?",
      confirmLabel: options.confirmLabel || "Tiếp tục",
      cancelLabel: options.cancelLabel || "Hủy",
      tone: options.tone || "warning",
    });
  }), []);

  const settle = useCallback((approved) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    resolve?.(approved);
    if (!approved) window.requestAnimationFrame(() => returnFocusRef.current?.focus?.());
  }, []);

  useEffect(() => {
    if (!request) return undefined;
    cancelButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        settle(false);
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = [...(dialogRef.current?.querySelectorAll("button:not(:disabled)") || [])];
      if (buttons.length < 2) return;
      const first = buttons[0];
      const last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [request, settle, dialogId]);

  useEffect(() => () => resolverRef.current?.(false), []);

  return <ConfirmToastContext.Provider value={confirm}>
    {children}
    {request && <div className="workspace-confirm-toast-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) settle(false); }}>
      <section className={`workspace-confirm-toast is-${request.tone}`} id={dialogId} ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={`${dialogId}-title`} aria-describedby={`${dialogId}-message`}>
        <div className="workspace-confirm-toast-heading">
          <span className="workspace-confirm-toast-icon"><WarningCircle size={22} aria-hidden="true" /></span>
          <div><span className="workspace-eyebrow">SKETCHTALE</span><h2 id={`${dialogId}-title`}>{request.title}</h2></div>
        </div>
        <p id={`${dialogId}-message`}>{request.message}</p>
        <div className="workspace-confirm-toast-actions">
          <button className="workspace-button workspace-button-quiet" type="button" ref={cancelButtonRef} onClick={() => settle(false)}>{request.cancelLabel}</button>
          <button className={`workspace-button${request.tone === "danger" ? " workspace-button-danger" : ""}`} type="button" onClick={() => settle(true)}>{request.confirmLabel}</button>
        </div>
      </section>
    </div>}
  </ConfirmToastContext.Provider>;
}
