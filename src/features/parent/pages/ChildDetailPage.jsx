import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import ChildForm from "../components/ChildForm";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, SuccessState } from "../../../components/feedback/States";

export default function ChildDetailPage() {
  const { user } = useAuth();
  const { childId } = useParams();
  const queryClient = useQueryClient();
  const childQuery = useQuery({ queryKey: queryKeys.child(user.id, childId), queryFn: () => childrenService.get({ childId }) });
  const mutation = useMutation({
    mutationFn: (payload) => childrenService.update({ childId, ...payload }),
    onSuccess: async (child) => {
      queryClient.setQueryData(queryKeys.child(user.id, childId), child);
      await queryClient.invalidateQueries({ queryKey: queryKeys.children(user.id) });
    },
  });

  if (childQuery.isLoading) return <LoadingState label="Đang tải hồ sơ" />;
  if (childQuery.isError) return <ErrorState title="Không thể mở hồ sơ" message={childQuery.error.message} onRetry={() => childQuery.refetch()} />;
  const child = childQuery.data;
  return <div className="child-detail-panel"><div className="child-detail-intro"><div><p className="workspace-eyebrow">THÔNG TIN HỒ SƠ</p><h2>Cập nhật thông tin của {child.displayName}</h2><p>Thay đổi sẽ áp dụng cho riêng hồ sơ này.</p></div>{mutation.isSuccess && <SuccessState>Đã lưu thay đổi hồ sơ.</SuccessState>}</div><ChildForm mode="edit" initialValues={{ displayName: child.displayName, birthDate: child.birthDate, avatar: child.avatar }} isSaving={mutation.isPending} serverError={mutation.error} onSubmit={mutation.mutate} onCancel="/parent/children" /></div>;
}
