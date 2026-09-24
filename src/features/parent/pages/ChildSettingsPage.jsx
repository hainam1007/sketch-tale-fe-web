import { useState } from "react";
import { CheckCircle, FloppyDisk, Gear, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

export default function ChildSettingsPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const { child } = useOutletContext();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: queryKeys.childSettings(user.id, childId), queryFn: ({ signal }) => childrenService.getSettings({ childId, signal }) });
  const [draftValues, setDraftValues] = useState(null);
  const mutation = useMutation({ mutationFn: (payload) => childrenService.updateSettings({ childId, ...payload }), onSuccess: (next) => { queryClient.setQueryData(queryKeys.childSettings(user.id, childId), next); setDraftValues({ readingTimeLimitMinutes: next.readingTimeLimitMinutes, allowedCategories: next.allowedCategories }); } });

  if (settingsQuery.isLoading || !settingsQuery.data) return <LoadingState label="Đang tải cài đặt của bé" />;
  if (settingsQuery.isError) return <ErrorState title="Không thể tải cài đặt" message={settingsQuery.error.message} onRetry={() => settingsQuery.refetch()} />;
  const initial = { readingTimeLimitMinutes: settingsQuery.data.readingTimeLimitMinutes, allowedCategories: settingsQuery.data.allowedCategories };
  const values = draftValues || initial;
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const categories = settingsQuery.data.categories || [];

  function toggleCategory(category) {
    setDraftValues((current) => ({ ...(current || initial), allowedCategories: (current || initial).allowedCategories.includes(category) ? (current || initial).allowedCategories.filter((item) => item !== category) : [...(current || initial).allowedCategories, category] }));
  }

  return <div className="parent-settings-page"><div className="parent-feature-heading"><div><p className="workspace-eyebrow">CÀI ĐẶT / {child.displayName.toUpperCase()}</p><h2>Đặt nhịp đọc vừa đủ cho bé</h2><p>Những lựa chọn này chỉ áp dụng cho hồ sơ {child.displayName}, không thay đổi gói của gia đình.</p></div><span className="parent-feature-icon"><Gear size={27} aria-hidden="true" /></span></div><form className="parent-settings-card" onSubmit={(event) => { event.preventDefault(); mutation.mutate(values); }}><section className="settings-section"><div><h3>Thời gian đọc mỗi ngày</h3><p>Chọn giới hạn mềm để phụ huynh cùng bé giữ nhịp đọc đều đặn.</p></div><label className="settings-select-label" htmlFor="reading-time"><span className="sr-only">Thời gian đọc</span><select id="reading-time" value={values.readingTimeLimitMinutes ?? "unlimited"} onChange={(event) => setDraftValues((current) => ({ ...(current || initial), readingTimeLimitMinutes: event.target.value === "unlimited" ? null : Number(event.target.value) }))}><option value="unlimited">Không giới hạn</option><option value="15">15 phút</option><option value="30">30 phút</option><option value="45">45 phút</option><option value="60">60 phút</option></select></label></section><section className="settings-section"><div><h3>Category được phép</h3><p>Để trống nghĩa là chưa giới hạn category; hệ thống sẽ giữ nguyên ý nghĩa này.</p></div><div className="settings-category-grid">{categories.map((category) => <label className="settings-category-option" key={category}><input type="checkbox" checked={values.allowedCategories.includes(category)} onChange={() => toggleCategory(category)} /><span>{category}</span></label>)}</div></section>{mutation.isError && <div className="parent-form-alert" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutation.error.message}{mutation.error.fieldErrors && <ul>{Object.entries(mutation.error.fieldErrors).map(([key, message]) => <li key={key}>{key}: {message}</li>)}</ul>}</div>}{mutation.isSuccess && <p className="workspace-inline-success" role="status"><CheckCircle size={17} aria-hidden="true" /> Đã lưu cài đặt cho {child.displayName}.</p>}<div className="parent-form-actions"><span className="settings-dirty-note">{dirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ từ server"}</span><button className="workspace-button" type="submit" disabled={!dirty || mutation.isPending}><FloppyDisk size={17} aria-hidden="true" /> {mutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}</button></div></form></div>;
}
