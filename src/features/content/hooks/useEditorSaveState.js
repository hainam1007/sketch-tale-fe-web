import { useEffect } from "react";

export function isContentEditorDirty() {
  return typeof window !== "undefined" && window.__sketchTaleContentEditorDirty === true;
}

export function shouldConfirmContentEditorNavigation(event) {
  return isContentEditorDirty() && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

let approvedNavigationUntil = 0;

export function approveNextContentEditorNavigation() {
  approvedNavigationUntil = Date.now() + 5000;
}

export function consumeApprovedContentEditorNavigation() {
  if (Date.now() > approvedNavigationUntil) return false;
  approvedNavigationUntil = 0;
  return true;
}

/** Shared dirty/save state for authoring forms. */
export function useEditorSaveState({ dirty = false, isSaving = false, error = null, onDirtyChange } = {}) {
  useEffect(() => {
    if (typeof window !== "undefined") window.__sketchTaleContentEditorDirty = Boolean(dirty);
    onDirtyChange?.(dirty);
    return () => {
      if (typeof window !== "undefined") window.__sketchTaleContentEditorDirty = false;
      onDirtyChange?.(false);
    };
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  return { dirty, isSaving, error, status: isSaving ? "saving" : error ? "error" : dirty ? "dirty" : "saved" };
}
