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
  const blocked = dirty || isSaving;
  useEffect(() => {
    if (typeof window !== "undefined") window.__sketchTaleContentEditorDirty = Boolean(blocked);
    onDirtyChange?.(blocked);
    return () => {
      if (typeof window !== "undefined") window.__sketchTaleContentEditorDirty = false;
      onDirtyChange?.(false);
    };
  }, [blocked, onDirtyChange]);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!blocked) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [blocked]);

  return { dirty, isSaving, error, status: isSaving ? "saving" : error ? "error" : dirty ? "dirty" : "saved" };
}
