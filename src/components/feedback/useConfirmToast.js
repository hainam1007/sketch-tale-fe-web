import { useContext } from "react";
import ConfirmToastContext from "./ConfirmToastContext";

export function useConfirmToast() {
  const confirm = useContext(ConfirmToastContext);
  if (!confirm) throw new Error("useConfirmToast must be used inside ConfirmToastProvider");
  return confirm;
}
